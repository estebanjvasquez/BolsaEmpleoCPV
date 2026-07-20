import { Prisma, type PrismaClient } from "@prisma/client";
import type { ProfessionalRegistrationInput } from "@cpv/shared";
import type { Env } from "../config/env";
import { HttpError } from "../lib/http-error";
import { encrypt } from "./crypto/encryption";
import { generateToken, hmacSha256Hex, sha256Hex } from "./crypto/hmac";
import { verifyTurnstileToken } from "./turnstile";
import { sendVerificationEmail } from "./email";

interface RegisterProfessionalDeps {
  prisma: PrismaClient;
  env: Env;
  consentIp: string | null;
}

// Queries against Hyperdrive's Supavisor *transaction-mode* pooler must run
// sequentially, not via Promise.all: firing several concurrent queries from
// one Worker invocation starves the pool and one of them times out
// ("Timed out while waiting for a message from the origin database").
async function validateCatalogReferences(prisma: PrismaClient, input: ProfessionalRegistrationInput) {
  const area = await prisma.area.findUnique({ where: { id: input.area_id } });
  const subarea = await prisma.subarea.findUnique({ where: { id: input.subarea_id } });
  const sector = await prisma.sector.findUnique({ where: { id: input.sector_id } });
  const certifications =
    input.certifications.length > 0
      ? await prisma.certification.findMany({ where: { id: { in: input.certifications } } })
      : [];

  const fields: Record<string, string> = {};
  if (!area) fields.area_id = "Área inválida";
  if (!subarea) fields.subarea_id = "Subárea inválida";
  else if (subarea.areaId !== input.area_id) fields.subarea_id = "La subárea no pertenece al área seleccionada";
  if (!sector) fields.sector_id = "Sector inválido";
  if (certifications.length !== input.certifications.length) {
    fields.certifications = "Una o más certificaciones son inválidas";
  }

  if (Object.keys(fields).length > 0) {
    throw new HttpError(400, "Bad Request", "Validation failed", fields);
  }
}

export async function registerProfessional(
  input: ProfessionalRegistrationInput,
  { prisma, env, consentIp }: RegisterProfessionalDeps,
): Promise<{ id: string }> {
  const captchaValid = await verifyTurnstileToken(
    input.captcha_token,
    env.TURNSTILE_SECRET_KEY,
    consentIp ?? undefined,
  );
  if (!captchaValid) {
    throw new HttpError(400, "Bad Request", "Verificación de captcha fallida", {
      captcha_token: "Token de captcha inválido o expirado",
    });
  }

  await validateCatalogReferences(prisma, input);

  const documentNumberHash = await hmacSha256Hex(input.document_number, env.HMAC_PEPPER);

  const existingByEmail = await prisma.professional.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  const existingByDocument = await prisma.professional.findUnique({
    where: { documentNumberHash },
    select: { id: true },
  });

  const dedupeFields: Record<string, string> = {};
  if (existingByEmail) dedupeFields.email = "El correo ya está registrado";
  if (existingByDocument) dedupeFields.document_number = "Ya existe un profesional registrado con este documento";
  if (Object.keys(dedupeFields).length > 0) {
    throw new HttpError(400, "Bad Request", "Validation failed", dedupeFields);
  }

  // Pure crypto, no DB round-trip — safe to run concurrently.
  const [documentNumberEncrypted, phoneEncrypted] = await Promise.all([
    encrypt(input.document_number, env.ENCRYPTION_KEY),
    encrypt(input.phone, env.ENCRYPTION_KEY),
  ]);

  const verificationToken = generateToken();
  const emailVerificationTokenHash = await sha256Hex(verificationToken);

  let professional: { id: string };
  try {
    professional = await prisma.professional.create({
      data: {
        firstName: input.first_name,
        lastName: input.last_name,
        documentType: input.document_type,
        documentNumberEncrypted,
        documentNumberHash,
        email: input.email,
        phoneEncrypted,
        city: input.city,
        state: input.state,
        areaId: input.area_id,
        subareaId: input.subarea_id,
        experienceYears: input.experience_years,
        lastPosition: input.last_position,
        bioSummary: input.bio_summary,
        sectorId: input.sector_id,
        educationLevel: input.education_level,
        relocationWilling: input.relocation_willing,
        jobTypesWilling: input.job_types_willing,
        immediateAvailability: input.immediate_availability,
        salaryExpectation: input.salary_expectation ?? null,
        consentGiven: input.consent_given,
        consentIp,
        emailVerificationTokenHash,
        languages: {
          create: input.languages.map((lang) => ({ language: lang.language, level: lang.level })),
        },
        certifications: {
          create: input.certifications.map((certificationId) => ({ certificationId })),
        },
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined)?.join(",") ?? "";
      if (target.includes("email")) {
        throw new HttpError(400, "Bad Request", "Validation failed", { email: "El correo ya está registrado" });
      }
      if (target.includes("document_number_hash")) {
        throw new HttpError(400, "Bad Request", "Validation failed", {
          document_number: "Ya existe un profesional registrado con este documento",
        });
      }
    }
    throw error;
  }

  await sendVerificationEmail(env, { to: input.email, firstName: input.first_name, token: verificationToken });

  return professional;
}

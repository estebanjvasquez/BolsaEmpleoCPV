import type { PrismaClient } from "@prisma/client";
import type { ProfessionalCorrectionInput } from "@cpv/shared";
import type { Env } from "../config/env";
import { HttpError } from "../lib/http-error";
import { encrypt } from "./crypto/encryption";
import { generateToken, sha256Hex } from "./crypto/hmac";
import { enqueueEmail } from "./email-outbox.service";
import { escapeHtml } from "./email";

export async function getCorrection(token: string, prisma: PrismaClient) {
  const profile = await prisma.professional.findFirst({ where: { editTokenHash: await sha256Hex(token), editableUntil: { gt: new Date() }, isActive: true, status: "rejected" }, select: { firstName: true, lastName: true, email: true, city: true, state: true, experienceYears: true, lastPosition: true, bioSummary: true, moderationReason: true } });
  if (!profile) throw new HttpError(410, "Gone", "El enlace no es válido o expiró.");
  return { first_name: profile.firstName, last_name: profile.lastName, email: profile.email, city: profile.city, state: profile.state, experience_years: profile.experienceYears, last_position: profile.lastPosition, bio_summary: profile.bioSummary, moderation_reason: profile.moderationReason };
}

export async function correctProfessional(token: string, input: ProfessionalCorrectionInput, prisma: PrismaClient, env: Env) {
  const tokenHash = await sha256Hex(token);
  const existing = await prisma.professional.findFirst({ where: { editTokenHash: tokenHash, editableUntil: { gt: new Date() }, status: "rejected", isActive: true }, select: { id: true, email: true } });
  if (!existing) throw new HttpError(410, "Gone", "El enlace no es válido o expiró.");
  const duplicate = await prisma.professional.findFirst({ where: { email: input.email, id: { not: existing.id } }, select: { id: true } });
  if (duplicate) throw new HttpError(400, "Bad Request", "El correo ya está registrado.");
  const verificationToken = input.email !== existing.email ? generateToken() : null;
  const data = {
    firstName: input.first_name, lastName: input.last_name, email: input.email,
    city: input.city, state: input.state, experienceYears: input.experience_years,
    lastPosition: input.last_position, bioSummary: input.bio_summary,
    ...(input.phone ? { phoneEncrypted: await encrypt(input.phone, env.ENCRYPTION_KEY) } : {}),
    ...(verificationToken ? { emailVerified: false, emailVerificationTokenHash: await sha256Hex(verificationToken) } : {}),
    status: "pending" as const, moderationReason: null, editTokenHash: null, editableUntil: null,
  };
  await prisma.$transaction(async (tx) => {
    const changed = await tx.professional.updateMany({ where: { id: existing.id, editTokenHash: tokenHash, editableUntil: { gt: new Date() }, status: "rejected", isActive: true }, data });
    if (changed.count !== 1) throw new HttpError(410, "Gone", "El enlace ya fue utilizado o expiró.");
    if (verificationToken) {
      const url = `${env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
      await enqueueEmail(tx, env, { to: input.email, subject: "Verifique su nuevo correo — CPV", text: `Confirme su correo: ${url}`, html: `<p>Confirme su correo: <a href="${escapeHtml(url)}">Verificar</a></p>` });
    }
  });
  return { message: verificationToken ? "Cambios guardados. Verifique su nuevo correo para que el perfil pueda ser aprobado." : "Cambios guardados y perfil reenviado a revisión." };
}

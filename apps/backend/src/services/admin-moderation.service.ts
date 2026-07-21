import type { PrismaClient, ProfessionalStatus } from "@prisma/client";
import type { Env } from "../config/env";
import { HttpError } from "../lib/http-error";
import { decrypt } from "./crypto/encryption";
import { generateToken, sha256Hex } from "./crypto/hmac";
import { sendAvailabilityEmail } from "./email";

interface ListDeps {
  prisma: PrismaClient;
  encryptionKey: string;
  adminId: string;
  ipAddress: string;
}

/**
 * Lists professionals by status with document_number/phone decrypted for
 * admin review. Every call logs one pii_access_log row per professional
 * whose PII was decrypted (implementation_plan.md §4.5, §9.1).
 */
export async function listProfessionalsByStatus(status: ProfessionalStatus, { prisma, encryptionKey, adminId, ipAddress }: ListDeps) {
  const professionals = await prisma.professional.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      documentType: true,
      documentNumberEncrypted: true,
      email: true,
      phoneEncrypted: true,
      status: true,
      createdAt: true,
    },
  });

  // Pure crypto, no DB round-trip — safe to run concurrently, unlike Prisma queries.
  const data = await Promise.all(
    professionals.map(async (p) => ({
      id: p.id,
      first_name: p.firstName,
      last_name: p.lastName,
      document_type: p.documentType,
      document_number: await decrypt(p.documentNumberEncrypted, encryptionKey),
      email: p.email,
      phone: await decrypt(p.phoneEncrypted, encryptionKey),
      status: p.status,
      created_at: p.createdAt.toISOString(),
    })),
  );

  if (professionals.length > 0) {
    await prisma.piiAccessLog.createMany({
      data: professionals.map((p) => ({
        adminId,
        professionalId: p.id,
        fieldsAccessed: ["document_number", "phone"],
        ipAddress,
      })),
    });
  }

  return data;
}

interface UpdateStatusDeps {
  prisma: PrismaClient;
  env: Env;
}

/**
 * Updates moderation status. The first time a profile is approved, mints a
 * persistent availability token (implementation_plan.md §4.8) and emails it
 * — subsequent approvals (e.g. after a rejection is reversed) reuse the
 * existing token rather than invalidating a link the candidate may have saved.
 */
export async function updateProfessionalStatus(
  id: string,
  status: ProfessionalStatus,
  { prisma, env }: UpdateStatusDeps,
): Promise<{ id: string; status: ProfessionalStatus }> {
  const existing = await prisma.professional.findUnique({
    where: { id },
    select: { id: true, firstName: true, email: true, availabilityTokenHash: true },
  });
  if (!existing) {
    throw new HttpError(404, "Not Found", "Profesional no encontrado");
  }

  const mintAvailabilityToken = status === "approved" && !existing.availabilityTokenHash;
  const availabilityToken = mintAvailabilityToken ? generateToken() : null;

  const updated = await prisma.professional.update({
    where: { id },
    data: {
      status,
      ...(availabilityToken && { availabilityTokenHash: await sha256Hex(availabilityToken) }),
    },
    select: { id: true, status: true },
  });

  if (availabilityToken) {
    await sendAvailabilityEmail(env, { to: existing.email, firstName: existing.firstName, token: availabilityToken });
  }

  return updated;
}

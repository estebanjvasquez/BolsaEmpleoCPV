import type { PrismaClient, ProfessionalStatus } from "@prisma/client";
import type { z } from "zod";
import type { professionalAdminUpdateSchema } from "@cpv/shared";
import type { Env } from "../config/env";
import { HttpError } from "../lib/http-error";
import { decrypt } from "./crypto/encryption";
import { generateToken, sha256Hex } from "./crypto/hmac";
import { sendAvailabilityEmail, sendResubmissionEmail } from "./email";

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
      emailVerified: true,
      phoneEncrypted: true,
      status: true,
      isActive: true,
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
      email_verified: p.emailVerified,
      phone: await decrypt(p.phoneEncrypted, encryptionKey),
      status: p.status,
      is_active: p.isActive,
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
  adminId: string;
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
  reason: string | undefined,
  { prisma, env, adminId }: UpdateStatusDeps,
): Promise<{ id: string; status: ProfessionalStatus }> {
  const existing = await prisma.professional.findUnique({
    where: { id },
    select: { id: true, firstName: true, email: true, emailVerified: true, availabilityTokenHash: true },
  });
  if (!existing) {
    throw new HttpError(404, "Not Found", "Profesional no encontrado");
  }

  if (status === "approved" && !existing.emailVerified) {
    throw new HttpError(409, "Conflict", "El profesional debe verificar su correo antes de ser aprobado.");
  }

  const mintAvailabilityToken = status === "approved" && !existing.availabilityTokenHash;
  const availabilityToken = mintAvailabilityToken ? generateToken() : null;
  const resubmissionToken = status === "rejected" ? generateToken() : null;

  const updated = await prisma.$transaction(async (tx) => {
    const value = await tx.professional.update({
      where: { id },
      data: {
        status, moderationReason: status === "rejected" ? reason : null,
        ...(availabilityToken && { availabilityTokenHash: await sha256Hex(availabilityToken) }),
        ...(resubmissionToken && { editTokenHash: await sha256Hex(resubmissionToken), editableUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) }),
      },
      select: { id: true, status: true },
    });
    await tx.adminAuditLog.create({ data: { adminId, action: `professional_${status}`, targetType: "professional", targetId: id, reason: reason ?? null } });
    return value;
  });

  if (availabilityToken) {
    await sendAvailabilityEmail(env, { to: existing.email, firstName: existing.firstName, token: availabilityToken });
  }
  if (resubmissionToken && reason) await sendResubmissionEmail(env, { to: existing.email, firstName: existing.firstName, token: resubmissionToken, reason });

  return updated;
}

export async function resubmitProfessional(token: string, prisma: PrismaClient): Promise<void> {
  const tokenHash = await sha256Hex(token);
  const professional = await prisma.professional.findFirst({ where: { editTokenHash: tokenHash, editableUntil: { gt: new Date() }, status: "rejected" }, select: { id: true } });
  if (!professional) throw new HttpError(404, "Not Found", "El enlace no es válido o expiró");
  await prisma.professional.update({ where: { id: professional.id }, data: { status: "pending", moderationReason: null, editTokenHash: null, editableUntil: null } });
}

export async function setProfessionalActive(id: string, isActive: boolean, adminId: string, prisma: PrismaClient) {
  const professional = await prisma.professional.update({ where: { id }, data: { isActive }, select: { id: true, isActive: true } }).catch(() => null);
  if (!professional) throw new HttpError(404, "Not Found", "Profesional no encontrado");
  await prisma.adminAuditLog.create({ data: { adminId, action: isActive ? "professional_activated" : "professional_deactivated", targetType: "professional", targetId: id } });
  return { id: professional.id, is_active: professional.isActive };
}

export async function updateProfessionalByAdmin(id: string, input: z.infer<typeof professionalAdminUpdateSchema>, adminId: string, prisma: PrismaClient) {
  const updated = await prisma.professional.update({ where: { id }, data: { city: input.city, state: input.state, experienceYears: input.experience_years, lastPosition: input.last_position, bioSummary: input.bio_summary }, select: { id: true } }).catch(() => null);
  if (!updated) throw new HttpError(404, "Not Found", "Profesional no encontrado");
  await prisma.adminAuditLog.create({ data: { adminId, action: "professional_updated", targetType: "professional", targetId: id, metadata: input } });
  return { id: updated.id, message: "Perfil profesional actualizado." };
}

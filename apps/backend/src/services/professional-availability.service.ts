import type { HiredStatus, PrismaClient } from "@prisma/client";
import { HttpError } from "../lib/http-error";
import { sha256Hex } from "./crypto/hmac";

/** Validates the persistent availability token and returns basic profile info (implementation_plan.md §4.8). */
export async function getAvailabilityByToken(token: string, prisma: PrismaClient) {
  const tokenHash = await sha256Hex(token);
  const professional = await prisma.professional.findFirst({
    where: { availabilityTokenHash: tokenHash, isActive: true, emailVerified: true, status: "approved" },
    select: { firstName: true, lastName: true, hiredStatus: true },
  });

  if (!professional) {
    throw new HttpError(410, "Gone", "El enlace de disponibilidad expiró o es inválido.");
  }

  return {
    first_name: professional.firstName,
    last_name: professional.lastName,
    hired_status: professional.hiredStatus,
  };
}

/**
 * Updates the candidate's hired/availability status via their persistent
 * token link. Marking as hired hides the profile from company search
 * (implementation_plan.md §4.8) by clearing immediate_availability and
 * flipping hiredStatus away from "looking".
 */
export async function updateAvailabilityByToken(
  token: string,
  hiredStatus: HiredStatus,
  prisma: PrismaClient,
): Promise<void> {
  const tokenHash = await sha256Hex(token);
  const professional = await prisma.professional.findFirst({
    where: { availabilityTokenHash: tokenHash, isActive: true, emailVerified: true, status: "approved" },
    select: { id: true },
  });

  if (!professional) {
    throw new HttpError(410, "Gone", "El enlace de disponibilidad expiró o es inválido.");
  }

  await prisma.professional.update({
    where: { id: professional.id },
    data: {
      hiredStatus,
      hiredAt: hiredStatus === "looking" ? null : new Date(),
      immediateAvailability: hiredStatus === "looking",
    },
  });
}

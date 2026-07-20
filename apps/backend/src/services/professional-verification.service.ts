import type { PrismaClient } from "@prisma/client";
import { HttpError } from "../lib/http-error";
import { sha256Hex } from "./crypto/hmac";

export async function verifyProfessionalEmail(token: string, prisma: PrismaClient): Promise<{ id: string }> {
  const tokenHash = await sha256Hex(token);
  const professional = await prisma.professional.findFirst({
    where: { emailVerificationTokenHash: tokenHash },
    select: { id: true },
  });

  if (!professional) {
    throw new HttpError(410, "Gone", "El enlace de verificación expiró o ya fue utilizado.");
  }

  await prisma.professional.update({
    where: { id: professional.id },
    data: { emailVerified: true, emailVerificationTokenHash: null },
  });

  return { id: professional.id };
}

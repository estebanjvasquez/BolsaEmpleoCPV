import type { PrismaClient } from "@prisma/client";
import { HttpError } from "../lib/http-error";

/** Lists companies for admin review, optionally filtered by verification status. */
export async function listCompanies(verified: boolean | undefined, prisma: PrismaClient) {
  const companies = await prisma.company.findMany({
    where: verified === undefined ? undefined : { isVerified: verified },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, rif: true, email: true, phone: true, isVerified: true, createdAt: true },
  });

  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    rif: c.rif,
    email: c.email,
    phone: c.phone,
    is_verified: c.isVerified,
    created_at: c.createdAt.toISOString(),
  }));
}

/** Approves a company, unblocking search/contact access gated by requireVerifiedCompany. */
export async function verifyCompany(id: string, prisma: PrismaClient): Promise<{ id: string; is_verified: boolean }> {
  const existing = await prisma.company.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new HttpError(404, "Not Found", "Empresa no encontrada");
  }

  const updated = await prisma.company.update({
    where: { id },
    data: { isVerified: true },
    select: { id: true, isVerified: true },
  });

  return { id: updated.id, is_verified: updated.isVerified };
}

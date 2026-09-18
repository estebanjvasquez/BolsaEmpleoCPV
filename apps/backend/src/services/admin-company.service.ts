import type { PrismaClient } from "@prisma/client";
import type { CompanyStatus } from "@prisma/client";
import { HttpError } from "../lib/http-error";
import { calculateSectorFit } from "./admin-sector-fit.service";

/** Lists companies for admin review, optionally filtered by moderation status. */
export async function listCompanies(status: CompanyStatus | undefined, prisma: PrismaClient) {
  const companies = await prisma.company.findMany({
    where: status === undefined ? undefined : { status },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, rif: true, email: true, phone: true, businessAreas: true, energyServices: true, businessDescription: true, website: true, isVerified: true, isActive: true, status: true, createdAt: true },
  });

  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    rif: c.rif,
    email: c.email,
    phone: c.phone,
    is_verified: c.isVerified,
    is_active: c.isActive,
    status: c.status,
    created_at: c.createdAt.toISOString(),
    business_areas: c.businessAreas,
    energy_services: c.energyServices,
    business_description: c.businessDescription,
    website: c.website,
    sector_fit: calculateSectorFit({ businessAreas: c.businessAreas, energyServices: c.energyServices, businessDescription: c.businessDescription, website: c.website }),
  }));
}

export async function setCompanyActive(id: string, isActive: boolean, adminId: string, prisma: PrismaClient) {
  const company = await prisma.company.update({ where: { id }, data: { isActive, ...(isActive ? {} : { passwordResetTokenHash: null, passwordResetExpiresAt: null, sessionVersion: { increment: 1 } }) }, select: { id: true, isActive: true } }).catch(() => null);
  if (!company) throw new HttpError(404, "Not Found", "Empresa no encontrada");
  await prisma.adminAuditLog.create({ data: { adminId, action: isActive ? "company_activated" : "company_deactivated", targetType: "company", targetId: id } });
  return { id: company.id, is_active: company.isActive };
}

/** Approves a company, unblocking search/contact access gated by requireVerifiedCompany. */
export async function verifyCompany(id: string, prisma: PrismaClient): Promise<{ id: string; is_verified: boolean }> {
  const updated = await setCompanyStatus(id, "approved", prisma);
  return { id: updated.id, is_verified: updated.is_verified };
}

/** Updates company moderation state and keeps the legacy access flag in sync. */
export async function setCompanyStatus(
  id: string,
  status: CompanyStatus,
  prisma: PrismaClient,
): Promise<{ id: string; is_verified: boolean; status: CompanyStatus }> {
  const existing = await prisma.company.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    throw new HttpError(404, "Not Found", "Empresa no encontrada");
  }

  const updated = await prisma.company.update({
    where: { id },
    data: { status, isVerified: status === "approved" },
    select: { id: true, isVerified: true, status: true },
  });

  return { id: updated.id, is_verified: updated.isVerified, status: updated.status };
}

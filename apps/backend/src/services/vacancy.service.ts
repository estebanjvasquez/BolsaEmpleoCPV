import type { PrismaClient, VacancyStatus } from "@prisma/client";
import type { VacancyCreateInput, VacancyUpdateInput } from "@cpv/shared";
import { HttpError } from "../lib/http-error";

export async function createVacancy(input: VacancyCreateInput, companyId: string, prisma: PrismaClient) {
  const area = await prisma.area.findUnique({ where: { id: input.area_id }, select: { id: true } });
  if (!area) throw new HttpError(400, "Bad Request", "Área inválida", { area_id: "Área inválida" });

  const vacancy = await prisma.vacancy.create({
    data: {
      companyId,
      title: input.title,
      description: input.description,
      location: input.location,
      areaId: input.area_id,
      employmentType: input.employment_type,
      experienceYears: input.experience_years,
      salaryMin: input.salary_min ?? null,
      salaryMax: input.salary_max ?? null,
      deadline: input.deadline ? new Date(`${input.deadline}T00:00:00.000Z`) : null,
      externalApplicationUrl: input.external_application_url ?? null,
    },
    select: { id: true, status: true },
  });
  return vacancy;
}

async function ownedVacancy(id: string, companyId: string, prisma: PrismaClient) {
  const vacancy = await prisma.vacancy.findFirst({ where: { id, companyId }, select: { id: true, status: true } });
  if (!vacancy) throw new HttpError(404, "Not Found", "Vacante no encontrada");
  return vacancy;
}

export async function updateCompanyVacancy(id: string, input: VacancyUpdateInput, companyId: string, prisma: PrismaClient) {
  await ownedVacancy(id, companyId, prisma);
  if (input.area_id !== undefined && !await prisma.area.findUnique({ where: { id: input.area_id }, select: { id: true } })) {
    throw new HttpError(400, "Bad Request", "Área inválida", { area_id: "Área inválida" });
  }
  const value = await prisma.vacancy.update({
    where: { id },
    data: {
      ...(input.title !== undefined ? { title: input.title } : {}), ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.location !== undefined ? { location: input.location } : {}), ...(input.area_id !== undefined ? { areaId: input.area_id } : {}),
      ...(input.employment_type !== undefined ? { employmentType: input.employment_type } : {}), ...(input.experience_years !== undefined ? { experienceYears: input.experience_years } : {}),
      ...(input.salary_min !== undefined ? { salaryMin: input.salary_min } : {}), ...(input.salary_max !== undefined ? { salaryMax: input.salary_max } : {}),
      ...(input.deadline !== undefined ? { deadline: input.deadline ? new Date(`${input.deadline}T00:00:00.000Z`) : null } : {}),
      ...(input.external_application_url !== undefined ? { externalApplicationUrl: input.external_application_url } : {}),
      status: "pending", moderationReason: null,
    }, include: { area: { select: { name: true } } },
  });
  return serializeVacancy(value);
}

export async function setCompanyVacancyStatus(id: string, action: "close" | "reopen", companyId: string, prisma: PrismaClient) {
  const vacancy = await ownedVacancy(id, companyId, prisma);
  if (action === "close" && vacancy.status === "closed") return { id, status: "closed" };
  if (action === "reopen" && vacancy.status !== "closed") throw new HttpError(409, "Conflict", "Solo puede reabrir vacantes cerradas");
  const value = await prisma.vacancy.update({ where: { id }, data: action === "close" ? { status: "closed" } : { status: "pending", moderationReason: null }, select: { id: true, status: true } });
  return value;
}

export async function listCompanyVacancies(companyId: string, prisma: PrismaClient) {
  const data = await prisma.vacancy.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { area: { select: { name: true } } },
  });
  return data.map(serializeVacancy);
}

export async function listPublicVacancies(prisma: PrismaClient) {
  const data = await prisma.vacancy.findMany({
    where: { status: "approved", company: { isActive: true, isVerified: true, status: "approved" }, OR: [{ deadline: null }, { deadline: { gte: new Date() } }] },
    orderBy: { createdAt: "desc" },
    include: { company: { select: { name: true } }, area: { select: { name: true } } },
  });
  return data.map(serializeVacancy);
}

export async function listAdminVacancies(status: VacancyStatus, prisma: PrismaClient) {
  const data = await prisma.vacancy.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    include: { company: { select: { name: true } }, area: { select: { name: true } } },
  });
  return data.map(serializeVacancy);
}

export async function updateVacancyStatus(
  id: string,
  status: Extract<VacancyStatus, "approved" | "rejected" | "closed">,
  reason: string | undefined,
  adminId: string,
  prisma: PrismaClient,
) {
  const vacancy = await prisma.vacancy.findUnique({ where: { id }, select: { id: true } });
  if (!vacancy) throw new HttpError(404, "Not Found", "Vacante no encontrada");

  const updated = await prisma.$transaction(async (tx) => {
    const value = await tx.vacancy.update({
      where: { id },
      data: { status, moderationReason: status === "rejected" ? reason : null },
      select: { id: true, status: true, moderationReason: true },
    });
    await tx.adminAuditLog.create({
      data: { adminId, action: `vacancy_${status}`, targetType: "vacancy", targetId: id, reason: reason ?? null },
    });
    return value;
  });
  return { id: updated.id, status: updated.status, moderation_reason: updated.moderationReason };
}

function serializeVacancy(vacancy: {
  id: string; title: string; description: string; location: string; employmentType: string; experienceYears: number;
  salaryMin: { toString(): string } | null; salaryMax: { toString(): string } | null; deadline: Date | null;
  status: VacancyStatus; moderationReason: string | null; createdAt: Date; company?: { name: string }; area: { name: string }; externalApplicationUrl: string | null;
}) {
  return {
    id: vacancy.id, title: vacancy.title, description: vacancy.description, location: vacancy.location,
    employment_type: vacancy.employmentType, experience_years: vacancy.experienceYears,
    salary_min: vacancy.salaryMin ? Number(vacancy.salaryMin) : null, salary_max: vacancy.salaryMax ? Number(vacancy.salaryMax) : null,
    deadline: vacancy.deadline?.toISOString().slice(0, 10) ?? null, status: vacancy.status,
    moderation_reason: vacancy.moderationReason, created_at: vacancy.createdAt.toISOString(),
    area: vacancy.area.name, company_name: vacancy.company?.name, external_application_url: vacancy.externalApplicationUrl,
  };
}

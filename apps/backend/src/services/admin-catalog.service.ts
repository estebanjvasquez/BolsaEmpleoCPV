import type { PrismaClient } from "@prisma/client";
import { HttpError } from "../lib/http-error";

async function assertUniqueName<T>(
  findByName: () => Promise<T | null>,
  fieldError: Record<string, string>,
) {
  const existing = await findByName();
  if (existing) {
    throw new HttpError(400, "Bad Request", "Validation failed", fieldError);
  }
}

// --- Areas -------------------------------------------------------------

export async function createArea(name: string, createdBy: string, prisma: PrismaClient) {
  await assertUniqueName(() => prisma.area.findUnique({ where: { name } }), { name: "Ya existe un área con ese nombre" });
  return prisma.area.create({ data: { name, createdBy }, select: { id: true, name: true, createdBy: true } });
}

export async function updateArea(id: number, name: string, prisma: PrismaClient) {
  const existing = await prisma.area.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Not Found", "Área no encontrada");
  return prisma.area.update({ where: { id }, data: { name }, select: { id: true, name: true, createdBy: true } });
}

export async function deleteArea(id: number, prisma: PrismaClient) {
  const existing = await prisma.area.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Not Found", "Área no encontrada");
  const referenced = await prisma.professional.count({ where: { areaId: id } });
  if (referenced > 0) {
    throw new HttpError(409, "Conflict", "El área está referenciada por profesionales existentes");
  }
  await prisma.area.delete({ where: { id } });
}

// --- Subareas ------------------------------------------------------------

export async function createSubarea(name: string, areaId: number, createdBy: string, prisma: PrismaClient) {
  const area = await prisma.area.findUnique({ where: { id: areaId } });
  if (!area) throw new HttpError(400, "Bad Request", "Validation failed", { area_id: "Área inválida" });

  await assertUniqueName(
    () => prisma.subarea.findUnique({ where: { uq_subarea_per_area: { areaId, name } } }),
    { name: "Ya existe una subárea con ese nombre en esta área" },
  );

  return prisma.subarea.create({
    data: { name, areaId, createdBy },
    select: { id: true, name: true, areaId: true, createdBy: true },
  });
}

export async function updateSubarea(id: number, name: string, prisma: PrismaClient) {
  const existing = await prisma.subarea.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Not Found", "Subárea no encontrada");
  return prisma.subarea.update({
    where: { id },
    data: { name },
    select: { id: true, name: true, areaId: true, createdBy: true },
  });
}

export async function deleteSubarea(id: number, prisma: PrismaClient) {
  const existing = await prisma.subarea.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Not Found", "Subárea no encontrada");
  const referenced = await prisma.professional.count({ where: { subareaId: id } });
  if (referenced > 0) {
    throw new HttpError(409, "Conflict", "La subárea está referenciada por profesionales existentes");
  }
  await prisma.subarea.delete({ where: { id } });
}

// --- Sectors ---------------------------------------------------------------

export async function createSector(name: string, createdBy: string, prisma: PrismaClient) {
  await assertUniqueName(() => prisma.sector.findUnique({ where: { name } }), {
    name: "Ya existe un sector con ese nombre",
  });
  return prisma.sector.create({ data: { name, createdBy }, select: { id: true, name: true, createdBy: true } });
}

export async function updateSector(id: number, name: string, prisma: PrismaClient) {
  const existing = await prisma.sector.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Not Found", "Sector no encontrado");
  return prisma.sector.update({ where: { id }, data: { name }, select: { id: true, name: true, createdBy: true } });
}

export async function deleteSector(id: number, prisma: PrismaClient) {
  const existing = await prisma.sector.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Not Found", "Sector no encontrado");
  const referenced = await prisma.professional.count({ where: { sectorId: id } });
  if (referenced > 0) {
    throw new HttpError(409, "Conflict", "El sector está referenciado por profesionales existentes");
  }
  await prisma.sector.delete({ where: { id } });
}

// --- Certifications ----------------------------------------------------

export async function createCertification(name: string, createdBy: string, prisma: PrismaClient) {
  await assertUniqueName(() => prisma.certification.findUnique({ where: { name } }), {
    name: "Ya existe una certificación con ese nombre",
  });
  return prisma.certification.create({
    data: { name, createdBy },
    select: { id: true, name: true, createdBy: true },
  });
}

export async function updateCertification(id: number, name: string, prisma: PrismaClient) {
  const existing = await prisma.certification.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Not Found", "Certificación no encontrada");
  return prisma.certification.update({
    where: { id },
    data: { name },
    select: { id: true, name: true, createdBy: true },
  });
}

export async function deleteCertification(id: number, prisma: PrismaClient) {
  const existing = await prisma.certification.findUnique({ where: { id } });
  if (!existing) throw new HttpError(404, "Not Found", "Certificación no encontrada");
  const referenced = await prisma.professionalCertification.count({ where: { certificationId: id } });
  if (referenced > 0) {
    throw new HttpError(409, "Conflict", "La certificación está referenciada por profesionales existentes");
  }
  await prisma.certification.delete({ where: { id } });
}

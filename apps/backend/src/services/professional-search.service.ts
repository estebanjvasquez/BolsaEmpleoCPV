import type { Prisma, PrismaClient } from "@prisma/client";
import type { ProfessionalSearchQuery } from "@cpv/shared";

const LEVEL_ES: Record<string, string> = {
  Basic: "Básico",
  Intermediate: "Intermedio",
  Advanced: "Avanzado",
  Native: "Nativo",
};

interface SearchResult {
  data: Array<Record<string, unknown>>;
  meta: { total: number; page: number; limit: number; has_more: boolean };
}

function buildWhere(query: ProfessionalSearchQuery): Prisma.ProfessionalWhereInput {
  return {
    status: "approved",
    ...(query.area_id !== undefined && { areaId: query.area_id }),
    ...(query.subarea_id !== undefined && { subareaId: query.subarea_id }),
    ...(query.min_experience !== undefined && { experienceYears: { gte: query.min_experience } }),
    ...(query.state !== undefined && { state: { equals: query.state, mode: "insensitive" } }),
    ...(query.relocation !== undefined && { relocationWilling: query.relocation }),
    ...(query.keyword !== undefined && {
      OR: [
        { lastPosition: { contains: query.keyword, mode: "insensitive" } },
        { bioSummary: { contains: query.keyword, mode: "insensitive" } },
      ],
    }),
  };
}

// Sequential, not Promise.all — concurrent queries against the Hyperdrive-fronted
// connection within one request can starve it (see professional-registration.service.ts).
export async function searchProfessionals(
  query: ProfessionalSearchQuery,
  prisma: PrismaClient,
): Promise<SearchResult> {
  const where = buildWhere(query);

  const total = await prisma.professional.count({ where });
  const results = await prisma.professional.findMany({
    where,
    include: {
      area: true,
      subarea: true,
      languages: true,
      certifications: { include: { certification: true } },
    },
    orderBy: { createdAt: "desc" },
    skip: (query.page - 1) * query.limit,
    take: query.limit,
  });

  const data = results.map((p) => ({
    id: p.id,
    first_name: p.firstName,
    last_name: `${p.lastName.charAt(0)}.`,
    city: p.city,
    state: p.state,
    area: p.area.name,
    subarea: p.subarea.name,
    experience_years: p.experienceYears,
    last_position: p.lastPosition,
    bio_summary: p.bioSummary,
    education_level: p.educationLevel,
    relocation_willing: p.relocationWilling,
    job_types_willing: p.jobTypesWilling,
    immediate_availability: p.immediateAvailability,
    languages: p.languages.map((l) => `${l.language} (${LEVEL_ES[l.level] ?? l.level})`),
    certifications: p.certifications.map((c) => `Certificación ${c.certification.name}`),
    created_at: p.createdAt.toISOString(),
  }));

  return {
    data,
    meta: {
      total,
      page: query.page,
      limit: query.limit,
      has_more: query.page * query.limit < total,
    },
  };
}

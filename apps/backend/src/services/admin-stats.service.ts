import type { PrismaClient } from "@prisma/client";
import type { AdminStats } from "@cpv/shared";

const TOP_N = 5;
const MONTHS_TRACKED = 6;

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function lastNMonthKeys(n: number): string[] {
  const keys: string[] = [];
  const cursor = new Date();
  cursor.setUTCDate(1);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - i, 1));
    keys.push(monthKey(d));
  }
  return keys;
}

// Sequential, not Promise.all — see professional-search.service.ts for why
// concurrent Prisma queries against the Hyperdrive-fronted connection are avoided.
export async function getAdminStats(prisma: PrismaClient): Promise<AdminStats> {
  const totalProfessionals = await prisma.professional.count();
  const totalCompanies = await prisma.company.count();

  const contacts = await prisma.contactLog.findMany({
    select: {
      companyId: true,
      company: { select: { name: true } },
      professional: { select: { areaId: true, area: { select: { name: true } } } },
    },
  });

  const professionals = await prisma.professional.findMany({
    select: { hiredStatus: true, createdAt: true },
  });

  const companies = await prisma.company.findMany({ select: { createdAt: true } });

  const viaPortal = professionals.filter((p) => p.hiredStatus === "hired_via_portal").length;
  const externally = professionals.filter((p) => p.hiredStatus === "hired_externally").length;
  const totalHires = viaPortal + externally;
  const totalContacts = contacts.length;

  const areaCounts = new Map<number, { area_name: string; contacts_count: number }>();
  const companyCounts = new Map<string, { company_name: string; contacts_count: number }>();

  for (const contact of contacts) {
    const area = areaCounts.get(contact.professional.areaId);
    areaCounts.set(contact.professional.areaId, {
      area_name: contact.professional.area.name,
      contacts_count: (area?.contacts_count ?? 0) + 1,
    });

    const company = companyCounts.get(contact.companyId);
    companyCounts.set(contact.companyId, {
      company_name: contact.company.name,
      contacts_count: (company?.contacts_count ?? 0) + 1,
    });
  }

  const mostRequestedAreas = [...areaCounts.entries()]
    .map(([area_id, v]) => ({ area_id, ...v }))
    .sort((a, b) => b.contacts_count - a.contacts_count)
    .slice(0, TOP_N);

  const topContactingCompanies = [...companyCounts.entries()]
    .map(([company_id, v]) => ({ company_id, ...v }))
    .sort((a, b) => b.contacts_count - a.contacts_count)
    .slice(0, TOP_N);

  const months = lastNMonthKeys(MONTHS_TRACKED);
  const registrationsOverTime = months.map((month) => ({
    month,
    professionals: professionals.filter((p) => monthKey(p.createdAt) === month).length,
    companies: companies.filter((c) => monthKey(c.createdAt) === month).length,
  }));

  return {
    total_professionals: totalProfessionals,
    total_companies: totalCompanies,
    total_contacts: totalContacts,
    hires_reported: { via_portal: viaPortal, externally, total: totalHires },
    success_rate_percent: totalContacts > 0 ? Math.round((totalHires / totalContacts) * 10000) / 100 : 0,
    most_requested_areas: mostRequestedAreas,
    top_contacting_companies: topContactingCompanies,
    registrations_over_time: registrationsOverTime,
  };
}

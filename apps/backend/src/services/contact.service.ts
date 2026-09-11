import type { PrismaClient } from "@prisma/client";
import { HttpError } from "../lib/http-error";

/** Creates a contact request from a company to an approved professional (implementation_plan.md §4.4). */
export async function createContactRequest(
  professionalId: string,
  companyId: string,
  message: string,
  prisma: PrismaClient,
) {
  const professional = await prisma.professional.findUnique({
    where: { id: professionalId },
    select: { id: true, status: true, isActive: true, emailVerified: true, hiredStatus: true },
  });

  if (!professional || professional.status !== "approved" || !professional.isActive || !professional.emailVerified || professional.hiredStatus !== "looking") {
    throw new HttpError(404, "Not Found", "Profesional no encontrado");
  }

  const contact = await prisma.contactLog.create({
    data: { companyId, professionalId, message },
    select: { id: true, status: true },
  });

  return {
    contact_request_id: contact.id,
    status: contact.status,
    message: "Solicitud de contacto registrada. El administrador revisará y facilitará el contacto.",
  };
}

/** Lists a company's own past contact requests, feeding the "Mis Contactos" feedback UI (implementation_plan.md §4.9). */
export async function listCompanyContacts(companyId: string, prisma: PrismaClient) {
  const contacts = await prisma.contactLog.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: { professional: { select: { firstName: true, lastName: true } } },
  });

  return contacts.map((contact) => ({
    id: contact.id,
    professional_id: contact.professionalId,
    professional_name: `${contact.professional.firstName} ${contact.professional.lastName}`,
    message: contact.message,
    status: contact.status,
    result: contact.result,
    created_at: contact.createdAt.toISOString(),
  }));
}

import type { ContactStatus, PrismaClient } from "@prisma/client";
import type { Env } from "../config/env";
import { HttpError } from "../lib/http-error";
import { escapeHtml } from "./email";
import { enqueueEmail, processEmailJob } from "./email-outbox.service";

export async function listAdminContacts(prisma: PrismaClient, status: ContactStatus) {
  const contacts = await prisma.contactLog.findMany({ where: { status }, orderBy: { createdAt: "asc" }, take: 100, include: { company: { select: { name: true } }, professional: { select: { firstName: true, lastName: true } } } });
  return contacts.map((c) => ({ id: c.id, company_name: c.company.name, professional_name: `${c.professional.firstName} ${c.professional.lastName}`, message: c.message, status: c.status, created_at: c.createdAt.toISOString() }));
}

export async function moderateContact(id: string, action: "send" | "block", adminId: string, prisma: PrismaClient, env: Env) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) throw new HttpError(400, "Bad Request", "Identificador inválido");
  const job = await prisma.$transaction(async (tx) => {
    // Lock the request so concurrent send/block decisions have a single winner.
    await tx.$queryRaw`SELECT id FROM contacts_log WHERE id = ${id}::uuid FOR UPDATE`;
    const contact = await tx.contactLog.findUnique({ where: { id }, include: { company: true, professional: true } });
    if (!contact) throw new HttpError(404, "Not Found", "Solicitud no encontrada");
    if (contact.status !== "pending_admin") throw new HttpError(409, "Conflict", "La solicitud ya fue resuelta");
    const existing = await tx.emailJob.findUnique({ where: { dedupeKey: `contact:${id}` } });
    if (existing) throw new HttpError(409, "Conflict", "El envío ya está en proceso. Revise su estado en Correos.");
    if (action === "block") {
      await tx.contactLog.update({ where: { id }, data: { status: "blocked" } });
      await tx.adminAuditLog.create({ data: { adminId, action: "contact_blocked", targetType: "contact", targetId: id } });
      return null;
    }
    const { company, professional } = contact;
    if (!company.isActive || !company.isVerified || !professional.isActive || !professional.emailVerified || professional.status !== "approved" || professional.hiredStatus !== "looking") throw new HttpError(409, "Conflict", "La empresa o el profesional ya no están habilitados para este contacto.");
    const text = `${company.name} desea contactar con usted a través de la CPV.\n\n${contact.message}\n\nSi le interesa, puede responder directamente a ${company.email}. Sus datos de contacto no se han compartido con la empresa.`;
    const queued = await enqueueEmail(tx, env, { to: professional.email, subject: "Oportunidad profesional — Bolsa de Talento CPV", text, html: `<p>${escapeHtml(company.name)} desea contactar con usted a través de la CPV.</p><p>${escapeHtml(contact.message)}</p><p>Si le interesa, escriba a ${escapeHtml(company.email)}. Sus datos de contacto no se han compartido con la empresa.</p>` }, { dedupeKey: `contact:${id}`, contactId: id });
    await tx.adminAuditLog.create({ data: { adminId, action: "contact_email_queued", targetType: "contact", targetId: id } });
    return queued;
  });
  if (job) await processEmailJob(prisma, env, job.id);
  return { message: job ? "Notificación registrada. Puede consultar la aceptación del proveedor en Correos." : "Solicitud bloqueada." };
}

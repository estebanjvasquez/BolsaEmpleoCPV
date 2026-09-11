import type { ContactResult, PrismaClient } from "@prisma/client";
import { HttpError } from "../lib/http-error";

/**
 * Records a company's outcome report for one of its own contact requests
 * (implementation_plan.md §4.9). A "hired" result also flips the
 * professional to hired_externally — unless the candidate already
 * self-reported via their availability token — so they drop out of search
 * the same way a self-reported hire does.
 */
export async function submitContactFeedback(
  contactId: string,
  companyId: string,
  result: ContactResult,
  prisma: PrismaClient,
): Promise<void> {
  const contact = await prisma.contactLog.findUnique({
    where: { id: contactId },
    select: { id: true, companyId: true, professionalId: true, status: true },
  });

  if (!contact || contact.companyId !== companyId) {
    throw new HttpError(404, "Not Found", "Solicitud de contacto no encontrada");
  }

  if (contact.status !== "sent") throw new HttpError(409, "Conflict", "La solicitud debe haber sido notificada antes de registrar su resultado.");
  await prisma.$transaction(async (tx) => {
    await tx.contactLog.update({ where: { id: contactId }, data: { result, feedbackUpdatedAt: new Date() } });
    if (result === "hired") {
      await tx.professional.updateMany({ where: { id: contact.professionalId, hiredStatus: "looking" }, data: { hiredStatus: "hired_via_portal", hiredAt: new Date(), immediateAvailability: false } });
    }
  });
}

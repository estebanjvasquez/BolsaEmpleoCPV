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
    select: { id: true, companyId: true, professionalId: true },
  });

  if (!contact || contact.companyId !== companyId) {
    throw new HttpError(404, "Not Found", "Solicitud de contacto no encontrada");
  }

  await prisma.contactLog.update({
    where: { id: contactId },
    data: { result, feedbackUpdatedAt: new Date() },
  });

  if (result === "hired") {
    const professional = await prisma.professional.findUnique({
      where: { id: contact.professionalId },
      select: { hiredStatus: true },
    });

    if (professional?.hiredStatus === "looking") {
      await prisma.professional.update({
        where: { id: contact.professionalId },
        data: { hiredStatus: "hired_externally", hiredAt: new Date(), immediateAvailability: false },
      });
    }
  }
}

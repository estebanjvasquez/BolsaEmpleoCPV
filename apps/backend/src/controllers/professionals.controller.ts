import { Hono } from "hono";
import {
  professionalRegistrationSchema,
  professionalSearchQuerySchema,
  contactRequestSchema,
  availabilityUpdateSchema,
} from "@cpv/shared";
import type { Env } from "../config/env";
import { createPrismaClient } from "../config/db";
import { HttpError } from "../lib/http-error";
import { zodFieldErrors } from "../lib/zod-errors";
import { registerProfessional } from "../services/professional-registration.service";
import { verifyProfessionalEmail } from "../services/professional-verification.service";
import { searchProfessionals } from "../services/professional-search.service";
import { createContactRequest } from "../services/contact.service";
import { getAvailabilityByToken, updateAvailabilityByToken } from "../services/professional-availability.service";
import { resubmitProfessional } from "../services/admin-moderation.service";
import { companyAuthMiddleware, type CompanyAuthVariables } from "../middleware/company-auth";
import { requireVerifiedCompany } from "../middleware/require-verified-company";

export const professionalsController = new Hono<{ Bindings: Env; Variables: CompanyAuthVariables }>();

professionalsController.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = professionalRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  }

  const prisma = createPrismaClient(c.env);
  const consentIp = c.req.header("cf-connecting-ip") ?? null;

  const professional = await registerProfessional(parsed.data, { prisma, env: c.env, consentIp });

  return c.json(
    {
      id: professional.id,
      status: "pending",
      message: "Registro completado con éxito. Su perfil está en proceso de revisión por parte de la CPV.",
    },
    201,
  );
});

professionalsController.get("/verify/:token", async (c) => {
  const prisma = createPrismaClient(c.env);
  const result = await verifyProfessionalEmail(c.req.param("token"), prisma);
  return c.json({ id: result.id, message: "Correo verificado con éxito." });
});

professionalsController.get("/search", companyAuthMiddleware, requireVerifiedCompany, async (c) => {
  const parsed = professionalSearchQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  }

  const prisma = createPrismaClient(c.env);
  const result = await searchProfessionals(parsed.data, prisma);

  await prisma.searchLog.create({
    data: {
      companyId: c.get("companyId"),
      queryParams: parsed.data,
      resultsCount: result.meta.total,
      ipAddress: c.req.header("cf-connecting-ip") ?? "unknown",
    },
  });

  return c.json(result);
});

professionalsController.post("/:id/contact", companyAuthMiddleware, requireVerifiedCompany, async (c) => {
  const parsed = contactRequestSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  }

  const prisma = createPrismaClient(c.env);
  const result = await createContactRequest(c.req.param("id"), c.get("companyId"), parsed.data.message, prisma);
  return c.json(result);
});

professionalsController.get("/availability/:token", async (c) => {
  const prisma = createPrismaClient(c.env);
  const result = await getAvailabilityByToken(c.req.param("token"), prisma);
  return c.json(result);
});

professionalsController.post("/availability/:token", async (c) => {
  const parsed = availabilityUpdateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  }

  const prisma = createPrismaClient(c.env);
  await updateAvailabilityByToken(c.req.param("token"), parsed.data.hired_status, prisma);
  return c.json({ message: "Estado de disponibilidad actualizado correctamente. ¡Gracias por reportar su contratación!" });
});

professionalsController.post("/resubmissions/:token", async (c) => {
  const prisma = createPrismaClient(c.env);
  await resubmitProfessional(c.req.param("token"), prisma);
  return c.json({ message: "Su perfil fue reenviado para una nueva revisión." });
});

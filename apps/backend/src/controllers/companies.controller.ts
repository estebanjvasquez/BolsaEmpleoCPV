import { Hono } from "hono";
import { companyRegistrationSchema, companyLoginSchema, companyFeedbackSchema } from "@cpv/shared";
import type { Env } from "../config/env";
import { createPrismaClient } from "../config/db";
import { HttpError } from "../lib/http-error";
import { zodFieldErrors } from "../lib/zod-errors";
import { registerCompany, loginCompany } from "../services/company-auth.service";
import { listCompanyContacts } from "../services/contact.service";
import { submitContactFeedback } from "../services/company-feedback.service";
import { companyAuthMiddleware, type CompanyAuthVariables } from "../middleware/company-auth";
import { requireVerifiedCompany } from "../middleware/require-verified-company";

export const companiesController = new Hono<{ Bindings: Env; Variables: CompanyAuthVariables }>();

companiesController.post("/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = companyRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  }

  const prisma = createPrismaClient(c.env);
  const company = await registerCompany(parsed.data, prisma);

  return c.json(
    {
      id: company.id,
      message: "Registro exitoso. Un administrador debe aprobar su cuenta para poder realizar búsquedas.",
    },
    201,
  );
});

companiesController.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = companyLoginSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  }

  const prisma = createPrismaClient(c.env);
  const result = await loginCompany(parsed.data, prisma, c.env.JWT_SECRET);

  return c.json(result);
});

companiesController.get("/me", companyAuthMiddleware, async (c) => {
  const prisma = createPrismaClient(c.env);
  const company = await prisma.company.findUnique({
    where: { id: c.get("companyId") },
    select: { id: true, name: true, rif: true, email: true, phone: true, isVerified: true, createdAt: true },
  });

  if (!company) {
    throw new HttpError(404, "Not Found", "Empresa no encontrada");
  }

  return c.json(company);
});

companiesController.get("/contacts", companyAuthMiddleware, requireVerifiedCompany, async (c) => {
  const prisma = createPrismaClient(c.env);
  const data = await listCompanyContacts(c.get("companyId"), prisma);
  return c.json({ data });
});

companiesController.post("/feedback/:contact_id", companyAuthMiddleware, requireVerifiedCompany, async (c) => {
  const parsed = companyFeedbackSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  }

  const prisma = createPrismaClient(c.env);
  await submitContactFeedback(c.req.param("contact_id"), c.get("companyId"), parsed.data.result, prisma);
  return c.json({ message: "Feedback registrado con éxito. Gracias por ayudarnos a medir la efectividad de la plataforma." });
});

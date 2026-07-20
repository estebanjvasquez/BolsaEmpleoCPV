import { Hono } from "hono";
import { companyRegistrationSchema, companyLoginSchema } from "@cpv/shared";
import type { Env } from "../config/env";
import { createPrismaClient } from "../config/db";
import { HttpError } from "../lib/http-error";
import { zodFieldErrors } from "../lib/zod-errors";
import { registerCompany, loginCompany } from "../services/company-auth.service";
import { companyAuthMiddleware, type CompanyAuthVariables } from "../middleware/company-auth";

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

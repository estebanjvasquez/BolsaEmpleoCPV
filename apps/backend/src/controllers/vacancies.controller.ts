import { Hono } from "hono";
import { vacancyCreateSchema, vacancyUpdateSchema } from "@cpv/shared";
import type { Env } from "../config/env";
import { createPrismaClient } from "../config/db";
import { HttpError } from "../lib/http-error";
import { zodFieldErrors } from "../lib/zod-errors";
import { companyAuthMiddleware, type CompanyAuthVariables } from "../middleware/company-auth";
import { requireVerifiedCompany } from "../middleware/require-verified-company";
import { createVacancy, listCompanyVacancies, listPublicVacancies, setCompanyVacancyStatus, updateCompanyVacancy } from "../services/vacancy.service";

export const vacanciesController = new Hono<{ Bindings: Env; Variables: CompanyAuthVariables }>();

vacanciesController.get("/", async (c) => {
  const prisma = createPrismaClient(c.env);
  return c.json({ data: await listPublicVacancies(prisma) });
});

vacanciesController.get("/mine", companyAuthMiddleware, requireVerifiedCompany, async (c) => {
  const prisma = createPrismaClient(c.env);
  return c.json({ data: await listCompanyVacancies(c.get("companyId"), prisma) });
});

vacanciesController.post("/", companyAuthMiddleware, requireVerifiedCompany, async (c) => {
  const parsed = vacancyCreateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  const prisma = createPrismaClient(c.env);
  const vacancy = await createVacancy(parsed.data, c.get("companyId"), prisma);
  return c.json({ ...vacancy, message: "Vacante enviada para revisión administrativa." }, 201);
});

vacanciesController.patch("/:id", companyAuthMiddleware, requireVerifiedCompany, async (c) => {
  const parsed = vacancyUpdateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  const prisma = createPrismaClient(c.env);
  return c.json(await updateCompanyVacancy(c.req.param("id"), parsed.data, c.get("companyId"), prisma));
});

vacanciesController.post("/:id/close", companyAuthMiddleware, requireVerifiedCompany, async (c) => {
  const prisma = createPrismaClient(c.env);
  return c.json(await setCompanyVacancyStatus(c.req.param("id"), "close", c.get("companyId"), prisma));
});

vacanciesController.post("/:id/reopen", companyAuthMiddleware, requireVerifiedCompany, async (c) => {
  const prisma = createPrismaClient(c.env);
  return c.json(await setCompanyVacancyStatus(c.req.param("id"), "reopen", c.get("companyId"), prisma));
});

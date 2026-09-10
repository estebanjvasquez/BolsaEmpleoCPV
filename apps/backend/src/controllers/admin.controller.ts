import { Hono } from "hono";
import { z } from "zod";
import { activeStateUpdateSchema, adminLoginSchema, catalogItemSchema, professionalAdminUpdateSchema, professionalStatusUpdateSchema, subareaItemSchema } from "@cpv/shared";
import type { Env } from "../config/env";
import { createPrismaClient } from "../config/db";
import { HttpError } from "../lib/http-error";
import { zodFieldErrors } from "../lib/zod-errors";
import { adminAuthMiddleware, type AdminAuthVariables } from "../middleware/admin-auth";
import { loginAdmin } from "../services/admin-auth.service";
import { listProfessionalsByStatus, setProfessionalActive, updateProfessionalByAdmin, updateProfessionalStatus } from "../services/admin-moderation.service";
import { getAdminStats } from "../services/admin-stats.service";
import { listCompanies, setCompanyActive, setCompanyStatus, verifyCompany } from "../services/admin-company.service";
import { createCompanyPasswordReset } from "../services/company-auth.service";
import { sendCompanyPasswordResetEmail } from "../services/email";
import { listAdminVacancies, updateVacancyStatus } from "../services/vacancy.service";
import { vacancyStatusUpdateSchema } from "@cpv/shared";
import {
  createArea,
  createCertification,
  createSector,
  createSubarea,
  deleteArea,
  deleteCertification,
  deleteSector,
  deleteSubarea,
  updateArea,
  updateCertification,
  updateSector,
  updateSubarea,
} from "../services/admin-catalog.service";

const statusQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});
const idParamSchema = z.coerce.number().int().positive();

function parseIdParam(raw: string): number {
  const parsed = idParamSchema.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", { id: "Debe ser un número entero positivo" });
  }
  return parsed.data;
}

export const adminController = new Hono<{ Bindings: Env; Variables: AdminAuthVariables }>();

adminController.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  }

  const prisma = createPrismaClient(c.env);
  const result = await loginAdmin(parsed.data, prisma, c.env.JWT_SECRET);
  return c.json(result);
});

adminController.get("/professionals", adminAuthMiddleware, async (c) => {
  const parsed = statusQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  }

  const prisma = createPrismaClient(c.env);
  const data = await listProfessionalsByStatus(parsed.data.status, {
    prisma,
    encryptionKey: c.env.ENCRYPTION_KEY,
    adminId: c.get("adminId"),
    ipAddress: c.req.header("cf-connecting-ip") ?? "unknown",
  });

  return c.json({ data });
});

adminController.patch("/professionals/:id/status", adminAuthMiddleware, async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = professionalStatusUpdateSchema.safeParse(body);
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  }

  const prisma = createPrismaClient(c.env);
  const result = await updateProfessionalStatus(c.req.param("id"), parsed.data.status, parsed.data.reason, { prisma, env: c.env, adminId: c.get("adminId") });
  return c.json(result);
});

adminController.patch("/professionals/:id/active", adminAuthMiddleware, async (c) => {
  const parsed = activeStateUpdateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  const prisma = createPrismaClient(c.env);
  return c.json(await setProfessionalActive(c.req.param("id"), parsed.data.is_active, c.get("adminId"), prisma));
});

adminController.patch("/professionals/:id", adminAuthMiddleware, async (c) => {
  const parsed = professionalAdminUpdateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  const prisma = createPrismaClient(c.env);
  return c.json(await updateProfessionalByAdmin(c.req.param("id"), parsed.data, c.get("adminId"), prisma));
});

const vacancyQuerySchema = z.object({ status: z.enum(["pending", "approved", "rejected", "closed"]).default("pending") });

adminController.get("/vacancies", adminAuthMiddleware, async (c) => {
  const parsed = vacancyQuerySchema.safeParse(c.req.query());
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  const prisma = createPrismaClient(c.env);
  return c.json({ data: await listAdminVacancies(parsed.data.status, prisma) });
});

adminController.patch("/vacancies/:id/status", adminAuthMiddleware, async (c) => {
  const parsed = vacancyStatusUpdateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  const prisma = createPrismaClient(c.env);
  return c.json(await updateVacancyStatus(c.req.param("id"), parsed.data.status, parsed.data.reason, c.get("adminId"), prisma));
});

adminController.get("/stats", adminAuthMiddleware, async (c) => {
  const prisma = createPrismaClient(c.env);
  return c.json(await getAdminStats(prisma));
});

// --- Company verification --------------------------------------------------

const companiesQuerySchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

adminController.get("/companies", adminAuthMiddleware, async (c) => {
  const parsed = companiesQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  }

  const prisma = createPrismaClient(c.env);
  const data = await listCompanies(parsed.data.status, prisma);
  return c.json({ data });
});

adminController.patch("/companies/:id/verify", adminAuthMiddleware, async (c) => {
  const prisma = createPrismaClient(c.env);
  const result = await verifyCompany(c.req.param("id"), prisma);
  return c.json(result);
});

const companyStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
});

adminController.patch("/companies/:id/status", adminAuthMiddleware, async (c) => {
  const parsed = companyStatusSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  }

  const prisma = createPrismaClient(c.env);
  return c.json(await setCompanyStatus(c.req.param("id"), parsed.data.status, prisma));
});

adminController.patch("/companies/:id/active", adminAuthMiddleware, async (c) => {
  const parsed = activeStateUpdateSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  const prisma = createPrismaClient(c.env);
  return c.json(await setCompanyActive(c.req.param("id"), parsed.data.is_active, c.get("adminId"), prisma));
});

adminController.post("/companies/:id/password-reset", adminAuthMiddleware, async (c) => {
  const prisma = createPrismaClient(c.env);
  const company = await prisma.company.findUnique({ where: { id: c.req.param("id") }, select: { email: true } });
  if (!company) throw new HttpError(404, "Not Found", "Empresa no encontrada");
  const reset = await createCompanyPasswordReset(company.email, prisma);
  if (reset) await sendCompanyPasswordResetEmail(c.env, { to: reset.email, companyName: reset.name, token: reset.token });
  await prisma.adminAuditLog.create({ data: { adminId: c.get("adminId"), action: "company_password_reset_sent", targetType: "company", targetId: c.req.param("id") } });
  return c.json({ message: "Se enviaron las instrucciones de restablecimiento al correo registrado." }, 202);
});

// --- Catalog CRUD --------------------------------------------------------

async function resolveAdminUsername(prisma: ReturnType<typeof createPrismaClient>, adminId: string) {
  const admin = await prisma.admin.findUnique({ where: { id: adminId }, select: { username: true } });
  return admin?.username ?? "unknown";
}

adminController.post("/catalogs/areas", adminAuthMiddleware, async (c) => {
  const parsed = catalogItemSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));

  const prisma = createPrismaClient(c.env);
  const createdBy = await resolveAdminUsername(prisma, c.get("adminId"));
  const area = await createArea(parsed.data.name, createdBy, prisma);
  return c.json(area, 201);
});

adminController.patch("/catalogs/areas/:id", adminAuthMiddleware, async (c) => {
  const id = parseIdParam(c.req.param("id"));
  const parsed = catalogItemSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));

  const prisma = createPrismaClient(c.env);
  return c.json(await updateArea(id, parsed.data.name, prisma));
});

adminController.delete("/catalogs/areas/:id", adminAuthMiddleware, async (c) => {
  const id = parseIdParam(c.req.param("id"));
  const prisma = createPrismaClient(c.env);
  await deleteArea(id, prisma);
  return c.body(null, 204);
});

adminController.post("/catalogs/subareas", adminAuthMiddleware, async (c) => {
  const parsed = subareaItemSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));

  const prisma = createPrismaClient(c.env);
  const createdBy = await resolveAdminUsername(prisma, c.get("adminId"));
  const subarea = await createSubarea(parsed.data.name, parsed.data.area_id, createdBy, prisma);
  return c.json(subarea, 201);
});

adminController.patch("/catalogs/subareas/:id", adminAuthMiddleware, async (c) => {
  const id = parseIdParam(c.req.param("id"));
  const parsed = catalogItemSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));

  const prisma = createPrismaClient(c.env);
  return c.json(await updateSubarea(id, parsed.data.name, prisma));
});

adminController.delete("/catalogs/subareas/:id", adminAuthMiddleware, async (c) => {
  const id = parseIdParam(c.req.param("id"));
  const prisma = createPrismaClient(c.env);
  await deleteSubarea(id, prisma);
  return c.body(null, 204);
});

adminController.post("/catalogs/sectors", adminAuthMiddleware, async (c) => {
  const parsed = catalogItemSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));

  const prisma = createPrismaClient(c.env);
  const createdBy = await resolveAdminUsername(prisma, c.get("adminId"));
  const sector = await createSector(parsed.data.name, createdBy, prisma);
  return c.json(sector, 201);
});

adminController.patch("/catalogs/sectors/:id", adminAuthMiddleware, async (c) => {
  const id = parseIdParam(c.req.param("id"));
  const parsed = catalogItemSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));

  const prisma = createPrismaClient(c.env);
  return c.json(await updateSector(id, parsed.data.name, prisma));
});

adminController.delete("/catalogs/sectors/:id", adminAuthMiddleware, async (c) => {
  const id = parseIdParam(c.req.param("id"));
  const prisma = createPrismaClient(c.env);
  await deleteSector(id, prisma);
  return c.body(null, 204);
});

adminController.post("/catalogs/certifications", adminAuthMiddleware, async (c) => {
  const parsed = catalogItemSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));

  const prisma = createPrismaClient(c.env);
  const createdBy = await resolveAdminUsername(prisma, c.get("adminId"));
  const certification = await createCertification(parsed.data.name, createdBy, prisma);
  return c.json(certification, 201);
});

adminController.patch("/catalogs/certifications/:id", adminAuthMiddleware, async (c) => {
  const id = parseIdParam(c.req.param("id"));
  const parsed = catalogItemSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));

  const prisma = createPrismaClient(c.env);
  return c.json(await updateCertification(id, parsed.data.name, prisma));
});

adminController.delete("/catalogs/certifications/:id", adminAuthMiddleware, async (c) => {
  const id = parseIdParam(c.req.param("id"));
  const prisma = createPrismaClient(c.env);
  await deleteCertification(id, prisma);
  return c.body(null, 204);
});

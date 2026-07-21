import { Hono } from "hono";
import { z } from "zod";
import { adminLoginSchema, catalogItemSchema, professionalStatusUpdateSchema, subareaItemSchema } from "@cpv/shared";
import type { Env } from "../config/env";
import { createPrismaClient } from "../config/db";
import { HttpError } from "../lib/http-error";
import { zodFieldErrors } from "../lib/zod-errors";
import { adminAuthMiddleware, type AdminAuthVariables } from "../middleware/admin-auth";
import { loginAdmin } from "../services/admin-auth.service";
import { listProfessionalsByStatus, updateProfessionalStatus } from "../services/admin-moderation.service";
import { getAdminStats } from "../services/admin-stats.service";
import { listCompanies, verifyCompany } from "../services/admin-company.service";
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
  const result = await updateProfessionalStatus(c.req.param("id"), parsed.data.status, { prisma, env: c.env });
  return c.json(result);
});

adminController.get("/stats", adminAuthMiddleware, async (c) => {
  const prisma = createPrismaClient(c.env);
  return c.json(await getAdminStats(prisma));
});

// --- Company verification --------------------------------------------------

const companiesQuerySchema = z.object({
  verified: z.enum(["true", "false"]).optional(),
});

adminController.get("/companies", adminAuthMiddleware, async (c) => {
  const parsed = companiesQuerySchema.safeParse(c.req.query());
  if (!parsed.success) {
    throw new HttpError(400, "Bad Request", "Validation failed", zodFieldErrors(parsed.error));
  }

  const prisma = createPrismaClient(c.env);
  const verified = parsed.data.verified === undefined ? undefined : parsed.data.verified === "true";
  const data = await listCompanies(verified, prisma);
  return c.json({ data });
});

adminController.patch("/companies/:id/verify", adminAuthMiddleware, async (c) => {
  const prisma = createPrismaClient(c.env);
  const result = await verifyCompany(c.req.param("id"), prisma);
  return c.json(result);
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

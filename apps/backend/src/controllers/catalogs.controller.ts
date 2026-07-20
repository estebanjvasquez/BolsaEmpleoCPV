import { Hono } from "hono";
import { VENEZUELA_STATES } from "@cpv/shared";
import type { Env } from "../config/env";
import { createPrismaClient } from "../config/db";

export const catalogsController = new Hono<{ Bindings: Env }>();

// Sequential, not Promise.all — see professional-registration.service.ts for why
// concurrent queries against the Hyperdrive-fronted connection are avoided.
catalogsController.get("/", async (c) => {
  const prisma = createPrismaClient(c.env);

  const areas = await prisma.area.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const subareas = await prisma.subarea.findMany({
    orderBy: { name: "asc" },
    select: { id: true, areaId: true, name: true },
  });
  const sectors = await prisma.sector.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } });
  const certifications = await prisma.certification.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  c.header("Cache-Control", "public, max-age=3600");

  return c.json({
    areas,
    subareas: subareas.map((s) => ({ id: s.id, area_id: s.areaId, name: s.name })),
    sectors,
    certifications,
    states: VENEZUELA_STATES,
  });
});

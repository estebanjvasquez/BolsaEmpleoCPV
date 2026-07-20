import { Hono } from "hono";
import type { Env } from "./config/env";
import { createPrismaClient } from "./config/db";
import { errorHandler } from "./middleware/errorHandler";
import { professionalsController } from "./controllers/professionals.controller";
import { companiesController } from "./controllers/companies.controller";
import { adminController } from "./controllers/admin.controller";

const app = new Hono<{ Bindings: Env }>();

app.onError(errorHandler);

app.get("/health", (c) => c.json({ status: "ok" }));

app.get("/health/db", async (c) => {
  const prisma = createPrismaClient(c.env);
  const areaCount = await prisma.area.count();
  return c.json({ status: "ok", areaCount });
});

app.route("/api/v1/professionals", professionalsController);
app.route("/api/v1/companies", companiesController);
app.route("/api/v1/admin", adminController);

// Future routes mount here as controllers land (BE-7..BE-10, implementation_plan.md §8):
// app.route("/api/v1/catalogs", catalogsController);

export default app;

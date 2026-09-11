import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import { createPrismaClient } from "../config/db";
import type { Env } from "../config/env";
import { HttpError } from "../lib/http-error";

export interface CompanyAuthVariables {
  companyId: string;
}

/** Verifies the Bearer JWT and exposes the company id via c.get("companyId"). */
export const companyAuthMiddleware = createMiddleware<{ Bindings: Env; Variables: CompanyAuthVariables }>(
  async (c, next) => {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

    if (!token) {
      throw new HttpError(401, "Unauthorized", "Access token is missing or invalid");
    }

    let payload: Record<string, unknown>;
    try {
      payload = await verify(token, c.env.JWT_SECRET, "HS256");
    } catch {
      throw new HttpError(401, "Unauthorized", "Access token is missing or invalid");
    }

    if (typeof payload.sub !== "string" || payload.type !== "company") {
      throw new HttpError(401, "Unauthorized", "Access token is missing or invalid");
    }

    const company = await createPrismaClient(c.env).company.findUnique({
      where: { id: payload.sub }, select: { isActive: true, sessionVersion: true },
    });
    if (!company?.isActive || (payload.version ?? 0) !== company.sessionVersion) {
      throw new HttpError(401, "Unauthorized", "La sesión expiró. Inicie sesión nuevamente.");
    }
    c.set("companyId", payload.sub);
    await next();
  },
);

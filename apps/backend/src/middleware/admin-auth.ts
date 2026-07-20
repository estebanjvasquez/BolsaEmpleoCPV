import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";
import type { Env } from "../config/env";
import { HttpError } from "../lib/http-error";

export interface AdminAuthVariables {
  adminId: string;
}

/** Verifies the Bearer JWT is an admin-type token and exposes the admin id via c.get("adminId"). */
export const adminAuthMiddleware = createMiddleware<{ Bindings: Env; Variables: AdminAuthVariables }>(
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

    if (typeof payload.sub !== "string" || payload.type !== "admin") {
      throw new HttpError(401, "Unauthorized", "Access token is missing or invalid");
    }

    c.set("adminId", payload.sub);
    await next();
  },
);

import { createMiddleware } from "hono/factory";
import { createPrismaClient } from "../config/db";
import type { Env } from "../config/env";
import { hmacSha256Hex } from "../services/crypto/hmac";
import { consumeRateLimit } from "../services/rate-limit.service";

export const publicRateLimit = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  const path = c.req.path;
  const registration = c.req.method === "POST" && /^\/api\/v1\/(professionals|companies\/register)\/?$/.test(path);
  const authentication = c.req.method === "POST" && (path.endsWith("/login") || path.includes("/password-resets"));
  const tokenAction = path.includes("/resubmissions/") || path.includes("/availability/") || path.includes("/verify/");
  if (!registration && !authentication && !tokenAction) return next();
  const limit = registration ? 3 : authentication ? 20 : 60;
  const scope = registration ? "registration" : authentication ? "authentication" : "token";
  const ip = c.req.header("cf-connecting-ip") ?? "local";
  const key = await hmacSha256Hex(`${scope}:${ip}`, c.env.HMAC_PEPPER);
  const prisma = createPrismaClient(c.env);
  if (!await consumeRateLimit(prisma, key, limit)) {
    c.header("Retry-After", "3600");
    return c.json({ error: "Too Many Requests", message: "Demasiados intentos. Inténtelo de nuevo más tarde." }, 429);
  }
  await next();
});

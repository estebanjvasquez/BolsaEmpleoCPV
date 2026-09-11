import { Hono } from "hono";
import { sign } from "hono/jwt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { companyAuthMiddleware, type CompanyAuthVariables } from "./company-auth";
import { errorHandler } from "./errorHandler";
import type { Env } from "../config/env";

const JWT_SECRET = "test-secret-with-at-least-thirty-two-characters";
const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("../config/db", () => ({ createPrismaClient: () => ({ company: { findUnique } }) }));
beforeEach(() => { findUnique.mockResolvedValue({ isActive: true, sessionVersion: 0 }); });

function buildApp() {
  const app = new Hono<{ Bindings: Env; Variables: CompanyAuthVariables }>();
  app.onError(errorHandler);
  app.get("/protected", companyAuthMiddleware, (c) => c.json({ companyId: c.get("companyId") }));
  return app;
}

describe("companyAuthMiddleware", () => {
  it("rejects sessions revoked by password reset", async () => {
    findUnique.mockResolvedValue({ isActive: true, sessionVersion: 1 });
    const token = await sign({ sub: "company-123", type: "company", version: 0, exp: Math.floor(Date.now()/1000)+3600 }, JWT_SECRET);
    expect((await buildApp().request("/protected", { headers: { Authorization: `Bearer ${token}` } }, { JWT_SECRET } as Env)).status).toBe(401);
  });
  it("rejects deactivated companies with an otherwise valid token", async () => {
    findUnique.mockResolvedValue({ isActive: false, sessionVersion: 0 });
    const token = await sign({ sub: "company-123", type: "company", exp: Math.floor(Date.now()/1000)+3600 }, JWT_SECRET);
    expect((await buildApp().request("/protected", { headers: { Authorization: `Bearer ${token}` } }, { JWT_SECRET } as Env)).status).toBe(401);
  });
  it("rejects requests with no Authorization header", async () => {
    const app = buildApp();
    const res = await app.request("/protected", {}, { JWT_SECRET } as Env);
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "Unauthorized", message: "Access token is missing or invalid" });
  });

  it("rejects an invalid token", async () => {
    const app = buildApp();
    const res = await app.request(
      "/protected",
      { headers: { Authorization: "Bearer not-a-real-token" } },
      { JWT_SECRET } as Env,
    );
    expect(res.status).toBe(401);
  });

  it("accepts a valid token and exposes companyId", async () => {
    const app = buildApp();
    const token = await sign(
      { sub: "company-123", type: "company", exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET,
    );
    const res = await app.request(
      "/protected",
      { headers: { Authorization: `Bearer ${token}` } },
      { JWT_SECRET } as Env,
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ companyId: "company-123" });
  });

  it("rejects an expired token", async () => {
    const app = buildApp();
    const token = await sign(
      { sub: "company-123", type: "company", exp: Math.floor(Date.now() / 1000) - 10 },
      JWT_SECRET,
    );
    const res = await app.request(
      "/protected",
      { headers: { Authorization: `Bearer ${token}` } },
      { JWT_SECRET } as Env,
    );
    expect(res.status).toBe(401);
  });

  it("rejects a valid admin-type token on a company route", async () => {
    const app = buildApp();
    const token = await sign(
      { sub: "admin-123", type: "admin", exp: Math.floor(Date.now() / 1000) + 3600 },
      JWT_SECRET,
    );
    const res = await app.request(
      "/protected",
      { headers: { Authorization: `Bearer ${token}` } },
      { JWT_SECRET } as Env,
    );
    expect(res.status).toBe(401);
  });
});

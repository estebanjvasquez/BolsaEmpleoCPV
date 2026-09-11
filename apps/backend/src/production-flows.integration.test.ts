import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { loadEnvFile } from "node:process";
import { readFileSync, readdirSync } from "node:fs";
import { Client } from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sign } from "hono/jwt";
import type { Env } from "./config/env";
import { encrypt } from "./services/crypto/encryption";
import { sha256Hex } from "./services/crypto/hmac";
import { hashPassword } from "./services/password";
import { processEmailJob } from "./services/email-outbox.service";
import { app } from "./index";

const state = vi.hoisted(() => ({ prisma: null as PrismaClient | null }));
vi.mock("./config/db", () => ({ createPrismaClient: () => state.prisma }));

// Explicit opt-in. All fixtures live in a unique isolated schema, never public.
describe.skipIf(process.env.CPV_INTEGRATION !== "1")("production flows against isolated PostgreSQL", () => {
  const schema = `cpv_qa_${Date.now()}`;
  let sql: Client; let prisma: PrismaClient; let companyId: string; let professionalId: string; let adminId: string; let companyToken: string; let adminToken: string; let areaId: number;
  const emailSend = vi.fn().mockResolvedValue({ messageId: "qa-accepted" });
  const env = { ENCRYPTION_KEY: "a1".repeat(32), HMAC_PEPPER: "b2".repeat(32), JWT_SECRET: "qa-only-secret-at-least-thirty-two-characters", EMAIL_FROM: "qa@example.invalid", FRONTEND_URL: "https://example.invalid", EMAIL: { send: emailSend } } as unknown as Env;
  const request = (path: string, method = "GET", body?: unknown, token?: string) => app.request(path, { method, headers: { "Content-Type": "application/json", "cf-connecting-ip": "192.0.2.123", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) }, env);

  beforeAll(async () => {
    loadEnvFile(".env");
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!connectionString) throw new Error("Missing database configuration");
    if (!/^cpv_qa_\d+$/.test(schema)) throw new Error("Invalid test schema");
    sql = new Client({ connectionString }); await sql.connect();
    await sql.query(`CREATE SCHEMA "${schema}"`);
    await sql.query(`SET search_path TO "${schema}", public`);
    for (const name of readdirSync("prisma/migrations").sort()) {
      // The production-only grant migration explicitly targets public tables.
      if (name === "migration_lock.toml" || name.includes("protect_api_tables")) continue;
      await sql.query(readFileSync(`prisma/migrations/${name}/migration.sql`, "utf8"));
    }
    prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString, options: `-c search_path=${schema},public` }, { schema }) });
    state.prisma = prisma;
    const area = await prisma.area.create({ data: { name: "QA area" } }); areaId = area.id;
    const subarea = await prisma.subarea.create({ data: { name: "QA subarea", areaId } });
    const sector = await prisma.sector.create({ data: { name: "QA sector" } });
    const company = await prisma.company.create({ data: { name: "QA company", rif: "QA", email: "qa-company@example.invalid", phone: "000000", passwordHash: await hashPassword("QA-password-for-tests"), isActive: true, isVerified: true, status: "approved" } }); companyId = company.id;
    const admin = await prisma.admin.create({ data: { username: "qa-admin", email: "qa-admin@example.invalid", passwordHash: "unused", role: "superadmin" } }); adminId = admin.id;
    const professional = await prisma.professional.create({ data: { firstName: "QA", lastName: "Professional", documentType: "V", documentNumberEncrypted: await encrypt("00000000", env.ENCRYPTION_KEY), documentNumberHash: "f".repeat(64), email: "qa-professional@example.invalid", phoneEncrypted: await encrypt("000000", env.ENCRYPTION_KEY), city: "QA", state: "QA", areaId, subareaId: subarea.id, sectorId: sector.id, experienceYears: 5, lastPosition: "QA position", bioSummary: "A".repeat(120), educationLevel: "Universitario", consentGiven: true, status: "approved", emailVerified: false } }); professionalId = professional.id;
    companyToken = await sign({ sub: companyId, type: "company", version: 0, exp: Math.floor(Date.now()/1000)+3600 }, env.JWT_SECRET);
    adminToken = await sign({ sub: adminId, type: "admin", exp: Math.floor(Date.now()/1000)+3600 }, env.JWT_SECRET);
  }, 90_000);

  afterAll(async () => {
    await prisma?.$disconnect();
    if (sql && /^cpv_qa_\d+$/.test(schema)) { await sql.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); await sql.end(); }
  });

  it("hides unverified profiles and blocks their approval/contact", async () => {
    expect(((await (await request("/api/v1/professionals/search", "GET", undefined, companyToken)).json()) as { data: unknown[] }).data).toHaveLength(0);
    expect((await request(`/api/v1/professionals/${professionalId}/contact`, "POST", { message: "QA contact" }, companyToken)).status).toBe(404);
    expect((await request(`/api/v1/admin/professionals/${professionalId}/status`, "PATCH", { status: "approved" }, adminToken)).status).toBe(409);
    await prisma.professional.update({ where: { id: professionalId }, data: { emailVerified: true } });
    expect(((await (await request("/api/v1/professionals/search", "GET", undefined, companyToken)).json()) as { data: unknown[] }).data).toHaveLength(1);
  });

  it("persists contact moderation, retries failure and prevents duplicate notification", async () => {
    const res = await request(`/api/v1/professionals/${professionalId}/contact`, "POST", { message: "QA contact" }, companyToken);
    const { contact_request_id: id } = await res.json() as { contact_request_id: string };
    emailSend.mockRejectedValueOnce(new Error("Simulated provider failure"));
    expect((await request(`/api/v1/admin/contacts/${id}`, "PATCH", { action: "send" }, adminToken)).status).toBe(200);
    const job = await prisma.emailJob.findUniqueOrThrow({ where: { dedupeKey: `contact:${id}` } });
    expect(job.status).toBe("queued"); expect(job.payloadEncrypted).not.toContain("qa-professional");
    expect((await request(`/api/v1/admin/contacts/${id}`, "PATCH", { action: "send" }, adminToken)).status).toBe(409);
    await prisma.emailJob.update({ where: { id: job.id }, data: { nextAttemptAt: new Date(0) } });
    await processEmailJob(prisma, env, job.id);
    expect((await prisma.contactLog.findUniqueOrThrow({ where: { id } })).status).toBe("sent");
    expect((await prisma.emailJob.findUniqueOrThrow({ where: { id: job.id } })).payloadEncrypted).toBe("");
  });

  it("hides vacancies when their company is deactivated", async () => {
    const vacancy = await prisma.vacancy.create({ data: { companyId, title: "QA vacancy", description: "A".repeat(100), location: "QA", areaId, employmentType: "Tiempo Completo", experienceYears: 0, status: "approved" } });
    expect(((await (await request("/api/v1/vacancies")).json()) as { data: unknown[] }).data).toHaveLength(1);
    await prisma.company.update({ where: { id: companyId }, data: { isActive: false } });
    expect(((await (await request("/api/v1/vacancies")).json()) as { data: unknown[] }).data).toHaveLength(0);
    expect((await request("/api/v1/companies/me", "GET", undefined, companyToken)).status).toBe(401);
    await prisma.company.update({ where: { id: companyId }, data: { isActive: true } });
    expect((await request(`/api/v1/vacancies/${vacancy.id}`, "PATCH", { title: "QA revised vacancy" }, companyToken)).status).toBe(200);
    expect((await prisma.vacancy.findUniqueOrThrow({ where: { id: vacancy.id } })).status).toBe("pending");
  });

  it("consumes reset tokens once and revokes existing sessions", async () => {
    const token = "reset-test-token";
    await prisma.company.update({ where: { id: companyId }, data: { passwordResetTokenHash: await sha256Hex(token), passwordResetExpiresAt: new Date(Date.now()+60_000) } });
    expect((await request(`/api/v1/companies/password-resets/${token}`, "POST", { password: "Updated-test-password" })).status).toBe(200);
    expect((await request(`/api/v1/companies/password-resets/${token}`, "POST", { password: "Updated-test-password" })).status).toBe(400);
    expect((await request("/api/v1/companies/me", "GET", undefined, companyToken)).status).toBe(401);
  });

  it("persists corrections and consumes the correction token", async () => {
    const token = "correction-test-token";
    await prisma.professional.update({ where: { id: professionalId }, data: { status: "rejected", editTokenHash: await sha256Hex(token), editableUntil: new Date(Date.now()+60_000) } });
    const input = { first_name: "Corrected", last_name: "QA", email: "new-qa@example.invalid", phone: "00000000", city: "QA", state: "QA", experience_years: 6, last_position: "QA", bio_summary: "B".repeat(120) };
    expect((await request(`/api/v1/professionals/resubmissions/${token}`, "POST", input)).status).toBe(200);
    const updated = await prisma.professional.findUniqueOrThrow({ where: { id: professionalId } });
    expect(updated.firstName).toBe("Corrected"); expect(updated.emailVerified).toBe(false); expect(updated.editTokenHash).toBeNull(); expect(updated.status).toBe("pending");
    expect((await request(`/api/v1/professionals/resubmissions/${token}`, "POST", input)).status).toBe(410);
  });

  it("enforces registration limits without writing invalid registrations", async () => {
    for (let i = 0; i < 3; i++) expect((await request("/api/v1/professionals", "POST", {})).status).toBe(400);
    expect((await request("/api/v1/professionals", "POST", {})).status).toBe(429);
    expect(await prisma.professional.count()).toBe(1);
  });
});

import { Prisma, type PrismaClient } from "@prisma/client";
import { sign } from "hono/jwt";
import type { CompanyLoginInput, CompanyProfileUpdateInput, CompanyRegistrationInput } from "@cpv/shared";
import { HttpError } from "../lib/http-error";
import { hashPassword, verifyPassword } from "./password";
import { generateToken, sha256Hex } from "./crypto/hmac";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

// A valid-format bcrypt hash that no real password will ever match. Comparing
// against it when the email isn't found keeps login's response time constant,
// so timing can't be used to enumerate registered company emails.
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8Q4WuKtLE9mFO3wgpF5H6xVQnuVFqW";

export async function registerCompany(
  input: CompanyRegistrationInput,
  prisma: PrismaClient,
): Promise<{ id: string }> {
  // Sequential, not Promise.all — concurrent queries against the Hyperdrive/
  // Supavisor transaction pooler within one request can starve the pool
  // (see professional-registration.service.ts).
  const existingByEmail = await prisma.company.findUnique({ where: { email: input.email }, select: { id: true } });
  const existingByRif = await prisma.company.findUnique({ where: { rif: input.rif }, select: { id: true } });

  const fields: Record<string, string> = {};
  if (existingByEmail) fields.email = "El correo ya está registrado";
  if (existingByRif) fields.rif = "El RIF ya está registrado";
  if (Object.keys(fields).length > 0) {
    throw new HttpError(400, "Bad Request", "Validation failed", fields);
  }

  const passwordHash = await hashPassword(input.password);

  try {
    return await prisma.company.create({
      data: {
        name: input.name,
        rif: input.rif,
        email: input.email,
        phone: input.phone,
        passwordHash,
      },
      select: { id: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined)?.join(",") ?? "";
      if (target.includes("email")) {
        throw new HttpError(400, "Bad Request", "Validation failed", { email: "El correo ya está registrado" });
      }
      if (target.includes("rif")) {
        throw new HttpError(400, "Bad Request", "Validation failed", { rif: "El RIF ya está registrado" });
      }
    }
    throw error;
  }
}

export async function loginCompany(
  input: CompanyLoginInput,
  prisma: PrismaClient,
  jwtSecret: string,
): Promise<{ token: string; company: { id: string; name: string } }> {
  const company = await prisma.company.findUnique({ where: { email: input.email } });
  const valid = await verifyPassword(input.password, company?.passwordHash ?? DUMMY_HASH);

  if (!company || !valid || !company.isActive) {
    throw new HttpError(401, "Unauthorized", "Credenciales inválidas");
  }

  // "type" prevents a company token from being replayed against admin-only
  // routes (or vice versa) — see admin-auth.service.ts for the counterpart.
  const token = await sign(
    { sub: company.id, type: "company", exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS },
    jwtSecret,
    "HS256",
  );

  return { token, company: { id: company.id, name: company.name } };
}

export async function updateCompanyProfile(id: string, input: CompanyProfileUpdateInput, prisma: PrismaClient) {
  const existing = await prisma.company.findUnique({ where: { id }, select: { id: true, email: true } });
  if (!existing) throw new HttpError(404, "Not Found", "Empresa no encontrada");
  if (input.email !== existing.email) {
    const duplicate = await prisma.company.findUnique({ where: { email: input.email }, select: { id: true } });
    if (duplicate) throw new HttpError(400, "Bad Request", "Validation failed", { email: "El correo ya está registrado" });
  }
  return prisma.company.update({ where: { id }, data: input, select: { id: true, name: true, email: true, phone: true } });
}

export async function createCompanyPasswordReset(email: string, prisma: PrismaClient) {
  const company = await prisma.company.findUnique({ where: { email }, select: { id: true, name: true, email: true, isActive: true } });
  if (!company?.isActive) return null;
  const token = generateToken();
  await prisma.company.update({ where: { id: company.id }, data: { passwordResetTokenHash: await sha256Hex(token), passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000) } });
  return { ...company, token };
}

export async function resetCompanyPassword(token: string, password: string, prisma: PrismaClient) {
  const tokenHash = await sha256Hex(token);
  const company = await prisma.company.findFirst({ where: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { gt: new Date() }, isActive: true }, select: { id: true } });
  if (!company) throw new HttpError(400, "Bad Request", "El enlace no es válido o expiró");
  await prisma.company.update({ where: { id: company.id }, data: { passwordHash: await hashPassword(password), passwordResetTokenHash: null, passwordResetExpiresAt: null } });
}

import type { PrismaClient } from "@prisma/client";
import { sign } from "hono/jwt";
import type { AdminLoginInput } from "@cpv/shared";
import { HttpError } from "../lib/http-error";
import { verifyPassword } from "./password";

const TOKEN_TTL_SECONDS = 60 * 60 * 8; // 8 hours — shorter-lived than company sessions

// See company-auth.service.ts DUMMY_HASH for why this constant-time comparison exists.
const DUMMY_HASH = "$2a$12$CwTycUXWue0Thq9StjUM0uJ8Q4WuKtLE9mFO3wgpF5H6xVQnuVFqW";

export async function loginAdmin(
  input: AdminLoginInput,
  prisma: PrismaClient,
  jwtSecret: string,
): Promise<{ token: string; admin: { id: string; username: string; role: string } }> {
  const admin = await prisma.admin.findUnique({ where: { email: input.email } });
  const valid = await verifyPassword(input.password, admin?.passwordHash ?? DUMMY_HASH);

  if (!admin || !valid) {
    throw new HttpError(401, "Unauthorized", "Credenciales inválidas");
  }

  const token = await sign(
    { sub: admin.id, type: "admin", role: admin.role, exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS },
    jwtSecret,
    "HS256",
  );

  return { token, admin: { id: admin.id, username: admin.username, role: admin.role } };
}

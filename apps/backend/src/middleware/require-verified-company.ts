import { createMiddleware } from "hono/factory";
import type { Env } from "../config/env";
import { createPrismaClient } from "../config/db";
import { HttpError } from "../lib/http-error";
import type { CompanyAuthVariables } from "./company-auth";

/** Blocks unverified companies from actions gated on admin approval (search, contact). */
export const requireVerifiedCompany = createMiddleware<{ Bindings: Env; Variables: CompanyAuthVariables }>(
  async (c, next) => {
    const prisma = createPrismaClient(c.env);
    const company = await prisma.company.findUnique({
      where: { id: c.get("companyId") },
      select: { isVerified: true },
    });

    if (!company?.isVerified) {
      throw new HttpError(
        403,
        "Forbidden",
        "Su cuenta debe ser aprobada por un administrador antes de continuar.",
      );
    }

    await next();
  },
);

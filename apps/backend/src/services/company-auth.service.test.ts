import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { sha256Hex } from "./crypto/hmac";
import { resetCompanyPassword } from "./company-auth.service";

describe("resetCompanyPassword", () => {
  it("accepts the uppercase form of a generated hexadecimal reset token", async () => {
    const token = "a1b2c3d4".repeat(8);
    const findFirst = vi.fn().mockResolvedValue({ id: "company-1" });
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const prisma = {
      company: { findFirst, updateMany },
    } as unknown as PrismaClient;

    await resetCompanyPassword(token.toUpperCase(), "NuevaClaveSegura123!", prisma);

    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ passwordResetTokenHash: await sha256Hex(token) }),
    }));
    expect(updateMany).toHaveBeenCalledOnce();
  });
});

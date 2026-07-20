import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hashing", () => {
  it("round-trips a correct password", async () => {
    const hash = await hashPassword("Password123!");
    await expect(verifyPassword("Password123!", hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("Password123!");
    await expect(verifyPassword("WrongPassword", hash)).resolves.toBe(false);
  });

  it("produces a different hash each time (random salt)", async () => {
    const a = await hashPassword("Password123!");
    const b = await hashPassword("Password123!");
    expect(a).not.toBe(b);
  });
});

import { describe, expect, it } from "vitest";
import { hmacSha256Hex, generateToken, sha256Hex } from "./hmac";

const PEPPER = "a".repeat(64);

describe("hmacSha256Hex", () => {
  it("is deterministic for the same value and pepper", async () => {
    const a = await hmacSha256Hex("12345678", PEPPER);
    const b = await hmacSha256Hex("12345678", PEPPER);
    expect(a).toBe(b);
  });

  it("produces a 64-char hex digest", async () => {
    const hash = await hmacSha256Hex("12345678", PEPPER);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs for different peppers (keyed hash)", async () => {
    const a = await hmacSha256Hex("12345678", PEPPER);
    const b = await hmacSha256Hex("12345678", "b".repeat(64));
    expect(a).not.toBe(b);
  });
});

describe("generateToken", () => {
  it("produces a 64-char hex token and is non-repeating", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });
});

describe("sha256Hex", () => {
  it("is deterministic and produces a 64-char hex digest", async () => {
    const token = generateToken();
    const a = await sha256Hex(token);
    const b = await sha256Hex(token);
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

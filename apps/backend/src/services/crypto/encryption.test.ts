import { describe, expect, it } from "vitest";
import { encrypt, decrypt } from "./encryption";

const KEY = "0".repeat(63) + "1"; // 32-byte hex key (64 hex chars)

describe("encryption", () => {
  it("round-trips plaintext through encrypt/decrypt", async () => {
    const ciphertext = await encrypt("V-12345678", KEY);
    expect(await decrypt(ciphertext, KEY)).toBe("V-12345678");
  });

  it("produces different ciphertext for the same plaintext (random IV)", async () => {
    const a = await encrypt("+584123456789", KEY);
    const b = await encrypt("+584123456789", KEY);
    expect(a).not.toBe(b);
  });

  it("fails to decrypt with the wrong key", async () => {
    const wrongKey = "1".repeat(64);
    const ciphertext = await encrypt("secret-value", KEY);
    await expect(decrypt(ciphertext, wrongKey)).rejects.toThrow();
  });

  it("rejects malformed ciphertext", async () => {
    await expect(decrypt("not-a-valid-ciphertext", KEY)).rejects.toThrow(/Malformed ciphertext/);
  });
});

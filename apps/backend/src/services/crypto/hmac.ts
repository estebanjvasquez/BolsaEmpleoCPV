import { hexToBytes, bytesToHex } from "./bytes";

/**
 * Deterministic HMAC-SHA256(value, pepper) for dedupe lookups on low-entropy
 * PII (e.g. document_number). A plain unsalted hash is brute-forceable from a
 * DB leak — a Venezuelan cédula has only ~10^8 possible values — so the
 * keyed pepper is required (implementation_plan.md §9.1). Output: 64 hex chars.
 */
export async function hmacSha256Hex(value: string, hexPepper: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    hexToBytes(hexPepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(signature));
}

/** 256-bit random token (64 hex chars) for one-time links (verify/edit/availability). */
export function generateToken(): string {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * Plain SHA-256 for hashing high-entropy random tokens before storage — no
 * pepper needed since brute-forcing 256 bits of randomness is infeasible,
 * unlike the low-entropy document_number case above.
 */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

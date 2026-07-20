import { hexToBytes, bytesToBase64, base64ToBytes } from "./bytes";

const ALGORITHM = "AES-GCM";
const IV_LENGTH_BYTES = 12;

function importKey(hexKey: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", hexToBytes(hexKey), ALGORITHM, false, ["encrypt", "decrypt"]);
}

/**
 * Encrypts a PII value with AES-256-GCM using a random IV per call, so the
 * ciphertext is non-deterministic and cannot be used for lookups
 * (implementation_plan.md §9.1 — use the HMAC hash columns for that instead).
 * Output format: "<iv-base64>:<ciphertext-base64>" (ciphertext includes the GCM auth tag).
 */
export async function encrypt(plaintext: string, hexKey: string): Promise<string> {
  const key = await importKey(hexKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, new TextEncoder().encode(plaintext));
  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(ciphertext))}`;
}

export async function decrypt(encoded: string, hexKey: string): Promise<string> {
  const [ivB64, ciphertextB64] = encoded.split(":");
  if (!ivB64 || !ciphertextB64) {
    throw new Error("Malformed ciphertext: expected '<iv>:<ciphertext>'");
  }
  const key = await importKey(hexKey);
  const iv = base64ToBytes(ivB64);
  const ciphertext = base64ToBytes(ciphertextB64);
  const plaintext = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

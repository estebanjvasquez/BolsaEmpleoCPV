import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "./turnstile";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("verifyTurnstileToken", () => {
  it("rejects valid challenges issued for another hostname or action", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, hostname: "localhost", action: "company_signup" }))));
    await expect(verifyTurnstileToken("token", "secret", undefined, { hostname: "talento.camarapetrolera.app", action: "company_signup" })).resolves.toBe(false);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, hostname: "talento.camarapetrolera.app", action: "professional_signup" }))));
    await expect(verifyTurnstileToken("token", "secret", undefined, { hostname: "talento.camarapetrolera.app", action: "company_signup" })).resolves.toBe(false);
  });
  it("accepts the expected production hostname and action", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, hostname: "talento.camarapetrolera.app", action: "company_signup" }))));
    await expect(verifyTurnstileToken("token", "secret", undefined, { hostname: "talento.camarapetrolera.app", action: "company_signup" })).resolves.toBe(true);
  });
  it("returns true when Cloudflare reports success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }))),
    );
    await expect(verifyTurnstileToken("valid-token", "secret")).resolves.toBe(true);
  });

  it("returns false when Cloudflare reports failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: false, "error-codes": ["invalid-input-response"] })),
      ),
    );
    await expect(verifyTurnstileToken("bad-token", "secret")).resolves.toBe(false);
  });
});

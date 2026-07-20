import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "./turnstile";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("verifyTurnstileToken", () => {
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

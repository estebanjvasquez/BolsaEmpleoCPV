const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
  success: boolean;
  "error-codes"?: string[];
}

/** Validates a Turnstile captcha token server-side (implementation_plan.md §9.2). */
export async function verifyTurnstileToken(
  token: string,
  secretKey: string,
  remoteIp?: string,
): Promise<boolean> {
  const body = new URLSearchParams({ secret: secretKey, response: token });
  if (remoteIp) body.set("remoteip", remoteIp);

  const response = await fetch(VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const result = (await response.json()) as TurnstileResponse;
  return result.success;
}

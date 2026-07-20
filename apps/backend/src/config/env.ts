/** Worker bindings, expanded as BE-x tasks add secrets (implementation_plan.md §8). */
export interface Env {
  ENVIRONMENT: string;
  HYPERDRIVE: Hyperdrive;
  /** 32-byte hex key for AES-256-GCM encryption of PII fields (implementation_plan.md §9.1). */
  ENCRYPTION_KEY: string;
  /** Pepper for HMAC-SHA256 deterministic-lookup hashes (document_number dedupe). */
  HMAC_PEPPER: string;
  /** Cloudflare Turnstile secret key, verified server-side on registration. */
  TURNSTILE_SECRET_KEY: string;
  /** Resend API key for transactional email. Optional: unset in early environments
   *  until INF-2's email provider is configured — sending degrades to a logged no-op. */
  RESEND_API_KEY?: string;
  EMAIL_FROM: string;
  FRONTEND_URL: string;
  /** Signing secret for company session JWTs (implementation_plan.md §4.2). */
  JWT_SECRET: string;
}

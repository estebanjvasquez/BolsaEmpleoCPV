# Project Spec - Camara Petrolera de Venezuela Talent Exchange

## Purpose

This monorepo powers the job board and talent exchange for the Camara Petrolera de Venezuela. It includes a public frontend, a Cloudflare Workers API, shared validation schemas, Supabase/Postgres persistence, Hyperdrive connectivity, email verification, Turnstile protection, and JWT-based authentication.

## Applications

- `apps/frontend`: Next.js App Router application deployed to Cloudflare Workers through OpenNext.
- `apps/backend`: Hono API deployed to Cloudflare Workers with Prisma and Hyperdrive.
- `packages/shared`: shared TypeScript types and Zod schemas used by frontend and backend.

## Production Surface

- Frontend: `https://talento.camarapetrolera.app/`
- API: `https://api.talento.camarapetrolera.app/`
- Frontend Worker: `talento-cpv-web`
- Backend Worker: `cpv-talent-api`

## Stability Gate

Before any production deployment:

1. Run the affected workspace build.
2. Run the monorepo build when shared code or config changes.
3. Run tests for the affected workspace.
4. Run Cloudflare/OpenNext preview locally and verify at least `/`, `/register`, and any touched route.
5. Confirm backend `/health` and `/health/db` when backend or integration config changes.

## Current Delivery Phases

1. Stabilization: restore local build/preview parity and prevent regressions in deploy tooling.
2. Candidate and company flows: complete registration, email verification, login/session, profile management, and vacancy publication.
3. Search and matching: searchable talent/job indexes, filtering, saved searches, and admin moderation.
4. Operations: audit logging, backup/restore, observability, alerting, and documented credential rotation.
5. Hardening: security review, privacy review, PII migration playbooks, WAF/rate-limit tuning, and production runbooks.

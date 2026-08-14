# AGENTS.md — Project Guidelines & Instructions

This file serves as the primary context directory for AI assistants. Read this first to minimize token usage and understand the project standards.

---

## 🚀 Key Commands

### Development & Build
* **Run entire monorepo in dev mode:** `npm run dev` (runs frontend and backend concurrently via Turborepo)
* **Build all workspaces:** `npm run build`
* **Clean dependencies/caches:** `npm run clean`

### Backend (`apps/backend`)
* **Dev Server (Workers local):** `npm run dev --workspace=backend` (runs wrangler dev)
* **Deploy to Cloudflare:** `npm run deploy --workspace=backend`
* **Prisma Migrations (Direct SQL):** `npx prisma migrate dev` (run from backend root)
* **Generate Prisma Client:** `npx prisma generate` (run from backend root)

### Frontend (`apps/frontend`)
* **Dev Server (Next.js):** `npm run dev --workspace=frontend`
* **Build Next.js App:** `npm run build --workspace=frontend`

### Cloudflare / Wrangler for Agents
* **Frontend Wrangler with project-local profile:** `npm run cf:frontend -- <wrangler args>`
* **Backend Wrangler with project-local profile:** `npm run cf:backend -- <wrangler args>`
* **Agent login:** `npm run cf:frontend -- auth create cpv-agent`, then `npm run cf:frontend -- auth activate cpv-agent .`
* The wrapper stores auth/config under `.wrangler-agent/config` so sandboxed agents do not need read/write access to the user profile.

### Agent Model Routing
* **Analyze / plan / review / diagnose:** use OpenAI 5.6 Terra.
* **Implementation / local validation:** use OpenAI 5.5 when available for token efficiency.
* **Security, deployment, database, or credential-risk decisions:** escalate to OpenAI 5.6 Terra.

---

## 🛠️ Tech Stack & Architecture

* **Monorepo structure:** npm workspaces + Turborepo
  * `apps/frontend`: Next.js (App Router, Tailwind CSS, React Hook Form, Zod)
  * `apps/backend`: Hono framework on Cloudflare Workers (TypeScript)
  * `packages/shared`: Shared Typescript models, types, and Zod schemas (for shared validation)
* **Database & ORM:** Supabase (PostgreSQL with `pg_trgm`) + Prisma (utilizing `driverAdapters` for @prisma/adapter-pg on Workers) connected via Cloudflare Hyperdrive.
* **Email & Auth:** Resend/Brevo transaccional API, Turnstile captcha, JWT auth.

---

## ⚡ Token-Saving Guidelines (CRITICAL)

To optimize token efficiency and speed up responses, follow these constraints:
1. **Targeted File Reads:** NEVER read the entire file if you only need a specific section. Use the `view_file` tool with `StartLine` and `EndLine` parameters to read only the lines of interest.
2. **Grep Before Browsing:** Always search for specific functions, imports, or definitions using `grep_search` before opening a folder or listing large directories.
3. **Minimize Boilerplate:** Provide concise code modifications (focused diffs/blocks) rather than reprinting complete files.
4. **Reuse Shared schemas:** Validation schemas (Zod) and TypeScript types MUST be written in `packages/shared` and imported. Do not rewrite or duplicate validation schemas on the frontend and backend.
5. **No Placeholders:** Write fully functional code changes without using placeholder comments like `// TODO: implement later` unless explicitly requested.
6. **Command Wait Times:** For long-running commands or dev servers launched via `run_command`, set a low `WaitMsBeforeAsync` (e.g. 500ms) to send them to the background immediately.

---

## 🎨 Code Style & Quality Standards

* **TypeScript:** Strict type checking. Avoid `any` types. Make interfaces clear and typed.
* **Hono Endpoints:** Return typed JSON responses. Standard error handling: `{ error: string, message: string, fields?: Record<string, string> }`.
* **Prisma Operations:** Use transactional queries where applicable. Ensure sensitive fields (PII like phone numbers, documents) are encrypted using `aes-256-gcm` and deduplicated deterministic-lookup using `HMAC-SHA256(field, pepper)`.
* **Security Checks:** Verify rate limits (Turnstile on public registration, Cloudflare WAF on others) and log all PII decryptions to `pii_access_log`.

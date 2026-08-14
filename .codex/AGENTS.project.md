# Agent Configuration - BolsaEmpleoCPV

## Model Routing

- Analysis, planning, review, diagnosis, architecture decisions, and risk assessment: use OpenAI 5.6 Terra.
- Implementation, routine edits, test execution, and local validation: use OpenAI 5.5 when available to control token cost.
- Escalate back to OpenAI 5.6 Terra for security-sensitive changes, production deployment decisions, database migrations, credential rotation, or ambiguous failures.

## Operating Rules

- Treat `AGENTS.md` as the primary project guide.
- Do not deploy until local build and Cloudflare preview pass for the touched app.
- For Cloudflare work, use the project-local Wrangler profile wrapper:
  - Frontend: `npm run cf:frontend -- <wrangler args>`
  - Backend: `npm run cf:backend -- <wrangler args>`
- The wrapper stores Wrangler agent profile data under `.wrangler-agent/config`, avoiding the user profile path that the sandbox cannot read or write.
- Do not commit `.wrangler-agent`, `.wrangler`, `.dev.vars`, `.env`, or generated OpenNext/Next build output.
- Never rotate `ENCRYPTION_KEY` or `HMAC_PEPPER` without a written migration plan for encrypted PII and deterministic lookup data.

## Cloudflare Login For Agents

Use this sequence from the repo root:

```powershell
npm run cf:frontend -- auth create cpv-agent
npm run cf:frontend -- auth activate cpv-agent .
npm run cf:frontend -- whoami
```

If an API token is provided for automation, set `CLOUDFLARE_API_TOKEN` only in the process environment or a local ignored file. Do not store tokens in tracked files.

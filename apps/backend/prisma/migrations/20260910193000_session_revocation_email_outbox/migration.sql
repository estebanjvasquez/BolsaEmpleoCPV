ALTER TABLE "companies" ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0;
CREATE TABLE "email_jobs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "payload_encrypted" TEXT NOT NULL,
  "dedupe_key" TEXT UNIQUE,
  "contact_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'queued',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "next_attempt_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "accepted_at" TIMESTAMP(3),
  "provider_id" TEXT
);
CREATE INDEX "email_jobs_status_next_attempt_at_idx" ON "email_jobs"("status", "next_attempt_at");
ALTER TABLE "email_jobs" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "email_jobs" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON TABLE "email_jobs" FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON TABLE "email_jobs" FROM authenticated; END IF;
END $$;

CREATE TABLE "api_rate_limits" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "hits" INTEGER NOT NULL DEFAULT 1,
  "expires_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "api_rate_limits_expires_at_idx" ON "api_rate_limits"("expires_at");
ALTER TABLE "api_rate_limits" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "api_rate_limits" FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN REVOKE ALL ON TABLE "api_rate_limits" FROM anon; END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN REVOKE ALL ON TABLE "api_rate_limits" FROM authenticated; END IF;
END $$;

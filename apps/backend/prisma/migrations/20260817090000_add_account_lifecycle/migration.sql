ALTER TABLE "companies"
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "password_reset_token_hash" CHAR(64),
  ADD COLUMN "password_reset_expires_at" TIMESTAMP(3);

ALTER TABLE "professionals"
  ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

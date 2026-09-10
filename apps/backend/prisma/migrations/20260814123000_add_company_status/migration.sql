-- Preserve existing approval decisions while introducing an explicit company
-- moderation state. `is_verified` stays as the access-control compatibility flag.
CREATE TYPE "CompanyStatus" AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE "companies"
  ADD COLUMN "status" "CompanyStatus" NOT NULL DEFAULT 'pending';

UPDATE "companies"
SET "status" = CASE WHEN "is_verified" THEN 'approved'::"CompanyStatus" ELSE 'pending'::"CompanyStatus" END;

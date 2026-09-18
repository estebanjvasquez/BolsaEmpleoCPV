ALTER TABLE "companies"
  ADD COLUMN "business_areas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "energy_services" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "business_description" TEXT,
  ADD COLUMN "website" VARCHAR(500);

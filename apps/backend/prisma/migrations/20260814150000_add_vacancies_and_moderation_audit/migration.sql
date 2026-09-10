CREATE TYPE "VacancyStatus" AS ENUM ('pending', 'approved', 'rejected', 'closed');

ALTER TABLE "professionals" ADD COLUMN "moderation_reason" TEXT;

CREATE TABLE "vacancies" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "title" VARCHAR(150) NOT NULL,
  "description" TEXT NOT NULL,
  "location" VARCHAR(150) NOT NULL,
  "area_id" INTEGER NOT NULL,
  "employment_type" VARCHAR(50) NOT NULL,
  "experience_years" INTEGER NOT NULL,
  "salary_min" DECIMAL(12,2),
  "salary_max" DECIMAL(12,2),
  "deadline" DATE,
  "status" "VacancyStatus" NOT NULL DEFAULT 'pending',
  "moderation_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vacancies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_audit_log" (
  "id" UUID NOT NULL,
  "admin_id" UUID NOT NULL,
  "action" VARCHAR(80) NOT NULL,
  "target_type" VARCHAR(50) NOT NULL,
  "target_id" UUID NOT NULL,
  "reason" TEXT,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "admin_audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vacancies_status_created_at_idx" ON "vacancies"("status", "created_at");
CREATE INDEX "admin_audit_log_target_type_target_id_created_at_idx" ON "admin_audit_log"("target_type", "target_id", "created_at");

ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_area_id_fkey"
  FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "admin_audit_log" ADD CONSTRAINT "admin_audit_log_admin_id_fkey"
  FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

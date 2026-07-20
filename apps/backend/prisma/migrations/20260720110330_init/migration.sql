-- CreateEnum
CREATE TYPE "ProfessionalStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "HiredStatus" AS ENUM ('looking', 'hired_via_portal', 'hired_externally');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('superadmin', 'moderator');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('pending_admin', 'sent', 'blocked');

-- CreateEnum
CREATE TYPE "ContactResult" AS ENUM ('pending', 'hired', 'not_hired', 'in_progress');

-- CreateTable
CREATE TABLE "areas" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subareas" (
    "id" SERIAL NOT NULL,
    "area_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "subareas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL DEFAULT 'system',

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "rif" VARCHAR(20) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" UUID NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'moderator',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professionals" (
    "id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "document_type" VARCHAR(10) NOT NULL,
    "document_number_encrypted" VARCHAR(255) NOT NULL,
    "document_number_hash" CHAR(64) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "phone_encrypted" VARCHAR(255) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "state" VARCHAR(100) NOT NULL,
    "area_id" INTEGER NOT NULL,
    "subarea_id" INTEGER NOT NULL,
    "experience_years" INTEGER NOT NULL,
    "last_position" VARCHAR(150) NOT NULL,
    "bio_summary" TEXT NOT NULL,
    "sector_id" INTEGER NOT NULL,
    "education_level" VARCHAR(50) NOT NULL,
    "relocation_willing" BOOLEAN NOT NULL DEFAULT false,
    "job_types_willing" TEXT[],
    "immediate_availability" BOOLEAN NOT NULL DEFAULT false,
    "salary_expectation" DECIMAL(12,2),
    "status" "ProfessionalStatus" NOT NULL DEFAULT 'pending',
    "hired_status" "HiredStatus" NOT NULL DEFAULT 'looking',
    "hired_at" TIMESTAMP(3),
    "availability_token_hash" CHAR(64),
    "editable_until" TIMESTAMP(3),
    "edit_token_hash" CHAR(64),
    "consent_given" BOOLEAN NOT NULL DEFAULT false,
    "consent_version" VARCHAR(20) NOT NULL DEFAULT 'v1',
    "consent_ip" VARCHAR(45),
    "consent_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professional_certifications" (
    "professional_id" UUID NOT NULL,
    "certification_id" INTEGER NOT NULL,
    "issue_date" DATE,

    CONSTRAINT "professional_certifications_pkey" PRIMARY KEY ("professional_id","certification_id")
);

-- CreateTable
CREATE TABLE "professional_languages" (
    "id" SERIAL NOT NULL,
    "professional_id" UUID NOT NULL,
    "language" VARCHAR(50) NOT NULL,
    "level" VARCHAR(20) NOT NULL,

    CONSTRAINT "professional_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "searches_log" (
    "id" SERIAL NOT NULL,
    "company_id" UUID NOT NULL,
    "query_params" JSONB NOT NULL,
    "results_count" INTEGER NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "searches_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts_log" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'pending_admin',
    "result" "ContactResult" NOT NULL DEFAULT 'pending',
    "feedback_updated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pii_access_log" (
    "id" UUID NOT NULL,
    "admin_id" UUID NOT NULL,
    "professional_id" UUID NOT NULL,
    "fields_accessed" TEXT[],
    "ip_address" VARCHAR(45) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pii_access_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "areas_name_key" ON "areas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "subareas_area_id_name_key" ON "subareas"("area_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "sectors_name_key" ON "sectors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "certifications_name_key" ON "certifications"("name");

-- CreateIndex
CREATE UNIQUE INDEX "companies_rif_key" ON "companies"("rif");

-- CreateIndex
CREATE UNIQUE INDEX "companies_email_key" ON "companies"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_document_number_hash_key" ON "professionals"("document_number_hash");

-- CreateIndex
CREATE UNIQUE INDEX "professionals_email_key" ON "professionals"("email");

-- CreateIndex
CREATE UNIQUE INDEX "professional_languages_professional_id_language_key" ON "professional_languages"("professional_id", "language");

-- AddForeignKey
ALTER TABLE "subareas" ADD CONSTRAINT "subareas_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_subarea_id_fkey" FOREIGN KEY ("subarea_id") REFERENCES "subareas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professionals" ADD CONSTRAINT "professionals_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_certifications" ADD CONSTRAINT "professional_certifications_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_certifications" ADD CONSTRAINT "professional_certifications_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "certifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professional_languages" ADD CONSTRAINT "professional_languages_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "searches_log" ADD CONSTRAINT "searches_log_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts_log" ADD CONSTRAINT "contacts_log_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts_log" ADD CONSTRAINT "contacts_log_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pii_access_log" ADD CONSTRAINT "pii_access_log_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pii_access_log" ADD CONSTRAINT "pii_access_log_professional_id_fkey" FOREIGN KEY ("professional_id") REFERENCES "professionals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

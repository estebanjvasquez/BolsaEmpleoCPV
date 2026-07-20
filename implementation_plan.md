# Technical Design & Implementation Plan: CPV Talent Platform MVP

This document outlines the architecture, database design, API contracts, testing strategy, and execution plan for the **Cámara Petrolera de Venezuela (CPV) Talent Platform MVP**.

---

## 1. Feasibility Analysis and Risks

1. **Support Overhead due to Single-Submission Flow**:
   * **Risk**: Since professionals register once and cannot edit their profiles directly (no candidate dashboard/login for simplicity), any error (typo in email, phone, or experience) must be manually corrected by an administrator.
   * **Mitigation**: Introduce a mandatory email verification step (column `email_verified`) plus a secure, time-limited self-edit link. The one-time token is stored **hashed** in `edit_token_hash` and is valid until `editable_until` (24-48 h), letting the professional self-correct before the profile is locked. See endpoint **"Professional Self-Edit (Token)"** in Section 4.

2. **PII Exposure and Direct Contact Vulnerabilities**:
   * **Risk**: If the search endpoint exposes candidate contact info (email/phone), scrapers can harvest Venezuelan oil sector professional data.
   * **Mitigation**: Candidate emails/phones are never returned in search results. Instead, companies click "Request Contact", which creates a `contacts_log` entry and triggers an automated system email to the candidate or administrator, keeping candidate contact details hidden until mutual interest is established.

3. **Spam & Automated Registrations (Bot Flood)**:
   * **Risk**: The professional registration endpoint has no authentication, making it a prime target for spam and DDOS registration attacks.
   * **Mitigation**: Implement Cloudflare Turnstile or Google reCAPTCHA v3 on the client, verified on the backend before processing. Combine with rate-limiting on `POST /api/v1/professionals` restricted to 3 requests per IP per hour.

4. **Data Consistency and Wizard Form Drop-off**:
   * **Risk**: A 4-step form is prone to user abandonment. If the user refreshes or loses internet, progress is lost.
   * **Mitigation**: Persist form state in `localStorage` at each step. On step 4, the user reviews a unified summary before final submission. No database write occurs until the final step is validated.

5. **Search Query Scaling (PostgreSQL Trigram Search)**:
   * **Risk**: Using PostgreSQL trigram indexes (`pg_trgm`) for text search is simple and cost-effective for the MVP but can degrade in performance if search filters are poorly optimized.
   * **Mitigation**: Limit search results to page sizes of 20 with **offset pagination (`page`/`limit`)** for the MVP — the dataset is small and offset keeps the API and tests simple; cursor-based pagination is a documented Phase-2 upgrade if deep-page latency appears. Use GIN trigram indexes on the searchable fields (`last_position`, `bio_summary`) and **partial** B-tree indexes (`WHERE status = 'approved'`) for the structured filters (`area_id`, `subarea_id`, `experience_years`), since search only ever returns approved profiles.

6. **Regulatory Compliance and Data Privacy**:
   * **Risk**: Under local and international data protection practices, storing passport/cédula, phone numbers, and job preferences requires explicit, recorded consent.
   * **Mitigation**: Store a cryptographic hash or encrypted version of the document number (cédula/passport) to prevent identity theft in case of database leakage, and enforce a mandatory, timestamped consent checkbox before submission.

7. **Tracking Portal Effectiveness (Hires via Portal)**:
   * **Risk**: Relying purely on candidate self-reporting to mark themselves as "hired" is prone to high drop-off since candidates lose incentive to log back in once employed.
   * **Mitigation**: Implement a dual feedback loop: (1) candidates receive a persistent secure token link to update their availability/mark themselves as "hired", (2) companies are prompted on login and via automated email 30 days after initiating a contact request to provide feedback on the hire status, and (3) administrators can manually log confirmed hires in the moderation panel.

---

## 2. Proposed Folder Structure (Monorepo Scaffold)

We propose a monorepo setup using npm workspaces or Turborepo. This allows sharing TypeScript types and Zod validation schemas between the frontend and backend.

```
bolsa-empleo-cpv/
├── package.json
├── turbo.json
├── apps/
│   ├── frontend/                # Next.js (App Router, React Hook Form, Tailwind CSS)
│   │   ├── src/
│   │   │   ├── app/             # Next.js Routing
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   ├── register/    # 4-Step Professional Wizard Form
│   │   │   │   ├── search/      # Company Search Dashboard
│   │   │   │   └── admin/       # Admin Moderation Panel
│   │   │   ├── components/      # UI components (Button, Input, FormStep, Select)
│   │   │   ├── lib/             # API client, utility functions
│   │   │   └── hooks/           # Custom React hooks (e.g., useLocalStorageForm)
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── backend/                 # Hono + TypeScript on Cloudflare Workers
│       ├── src/
│       │   ├── index.ts         # Worker entrypoint (Hono app + bindings)
│       │   ├── controllers/     # API Endpoints (professionals, search, auth)
│       │   ├── services/        # Business Logic (email, auth, db queries)
│       │   ├── middleware/      # Auth, Rate limiting, Validation
│       │   └── config/          # Env/secret bindings & Prisma+Hyperdrive client
│       ├── prisma/
│       │   └── schema.prisma    # Prisma Schema definition (driverAdapters)
│       ├── wrangler.toml        # Workers config (Hyperdrive binding, secrets, routes)
│       ├── tsconfig.json
│       ├── package.json
│       └── vitest.config.ts
└── packages/
    └── shared/                  # Shared types and validation schemas
        ├── src/
        │   ├── index.ts
        │   ├── validation/      # Zod validation schemas (professionalSchema, companySchema)
        │   └── types/           # TS Interfaces
        └── package.json
```

---

## 3. SQL Schema (DDL)

```sql
-- Enable extension for trigram search and UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum types
CREATE TYPE professional_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE hired_status AS ENUM ('looking', 'hired_via_portal', 'hired_externally');
CREATE TYPE user_role AS ENUM ('superadmin', 'moderator');
CREATE TYPE contact_status AS ENUM ('pending_admin', 'sent', 'blocked');
CREATE TYPE contact_result AS ENUM ('pending', 'hired', 'not_hired', 'in_progress');

-- Catalogs
CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'system'
);

CREATE TABLE subareas (
    id SERIAL PRIMARY KEY,
    area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'system',
    CONSTRAINT uq_subarea_per_area UNIQUE (area_id, name)
);

CREATE TABLE sectors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'system'
);

CREATE TABLE certifications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'system'
);

-- Users: Companies
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    rif VARCHAR(20) NOT NULL UNIQUE, -- Tax ID
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users: Admins
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'moderator',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Main Professionals Table
CREATE TABLE professionals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    document_type VARCHAR(10) NOT NULL, -- 'V', 'E', 'P' (Venezolano, Extranjero, Pasaporte)
    document_number_encrypted VARCHAR(255) NOT NULL,        -- AES-256-GCM ciphertext (non-deterministic → NOT unique)
    document_number_hash CHAR(64) NOT NULL UNIQUE,          -- HMAC-SHA256(document_number, pepper): deterministic dedupe/lookup
    email VARCHAR(150) NOT NULL UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,                   -- ownership confirmed via emailed link
    phone_encrypted VARCHAR(255) NOT NULL,                  -- AES-256-GCM ciphertext
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    area_id INTEGER NOT NULL REFERENCES areas(id),
    subarea_id INTEGER NOT NULL REFERENCES subareas(id),
    experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
    last_position VARCHAR(150) NOT NULL,
    bio_summary TEXT NOT NULL,
    sector_id INTEGER NOT NULL REFERENCES sectors(id),
    education_level VARCHAR(50) NOT NULL, -- e.g., Técnico, Universitario, Especialización
    relocation_willing BOOLEAN DEFAULT FALSE,
    job_types_willing TEXT[] NOT NULL DEFAULT '{}',         -- multi-select: Tiempo Completo, Por Proyecto, Asesoría/Consultoría
    immediate_availability BOOLEAN DEFAULT FALSE,
    salary_expectation NUMERIC(12, 2) DEFAULT NULL,         -- monthly amount, USD
    status professional_status DEFAULT 'pending',
    hired_status hired_status DEFAULT 'looking',
    hired_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    availability_token_hash CHAR(64) DEFAULT NULL,          -- persistent token for availability/hired feedback
    editable_until TIMESTAMP WITH TIME ZONE,                -- self-edit window (token valid until this instant)
    edit_token_hash CHAR(64),                               -- HMAC-SHA256 of the one-time self-edit token
    consent_given BOOLEAN DEFAULT FALSE,
    consent_version VARCHAR(20) NOT NULL DEFAULT 'v1',      -- version of the legal/privacy text accepted
    consent_ip VARCHAR(45),                                 -- IP captured at consent time
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Many-to-Many / Detailed lists
CREATE TABLE professional_certifications (
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    certification_id INTEGER NOT NULL REFERENCES certifications(id) ON DELETE CASCADE,
    issue_date DATE,
    PRIMARY KEY (professional_id, certification_id)
);

CREATE TABLE professional_languages (
    id SERIAL PRIMARY KEY,
    professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL, -- Basic, Intermediate, Advanced, Native
    CONSTRAINT uq_professional_language UNIQUE (professional_id, language)
);

-- Audits and Logs
CREATE TABLE searches_log (
    id SERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id),
    query_params JSONB NOT NULL,
    results_count INTEGER NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE contacts_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id),
    professional_id UUID NOT NULL REFERENCES professionals(id),
    message TEXT NOT NULL,
    status contact_status DEFAULT 'pending_admin',
    result contact_result DEFAULT 'pending',
    feedback_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail: records every time an admin decrypts/views candidate PII
CREATE TABLE pii_access_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admins(id),
    professional_id UUID NOT NULL REFERENCES professionals(id),
    fields_accessed TEXT[] NOT NULL,          -- e.g., {document_number, phone}
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Auto-refresh updated_at on raw-SQL UPDATEs (Prisma also enforces this app-side via @updatedAt).
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_professionals_updated_at BEFORE UPDATE ON professionals
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes for Search Performance
-- Search only ever returns approved profiles → partial indexes stay small and hot.
CREATE INDEX idx_professionals_area_subarea ON professionals(area_id, subarea_id) WHERE status = 'approved';
CREATE INDEX idx_professionals_experience ON professionals(experience_years) WHERE status = 'approved';
CREATE INDEX idx_professionals_location ON professionals(state, city) WHERE status = 'approved';
CREATE INDEX idx_professionals_relocation ON professionals(relocation_willing) WHERE status = 'approved';
CREATE INDEX idx_professionals_status ON professionals(status);

-- GIN Trigram indexes for text searching
CREATE INDEX idx_professionals_last_position_trgm ON professionals USING gin (last_position gin_trgm_ops);
CREATE INDEX idx_professionals_bio_summary_trgm ON professionals USING gin (bio_summary gin_trgm_ops);

-- Foreign-key support indexes for admin/reporting views
CREATE INDEX idx_contacts_log_professional ON contacts_log(professional_id);
CREATE INDEX idx_contacts_log_company ON contacts_log(company_id);
CREATE INDEX idx_searches_log_company ON searches_log(company_id);

-- Prevent a company from spamming the same professional (only one open request per pair)
CREATE UNIQUE INDEX uq_open_contact_per_pair ON contacts_log(company_id, professional_id)
  WHERE status IN ('pending_admin', 'sent');
```

---

## 4. API Contracts (REST API v1)

All success responses return JSON. Error responses follow a standard structure:
`{ "error": "Bad Request", "message": "Validation failed", "fields": { "field_name": "error detail" } }`

```carousel
### 1. Register Professional (Public)
**POST** `/api/v1/professionals`
*No auth required, protected by Rate Limiting + Captcha.*

**Request Headers**:
`Content-Type: application/json`

**Request Body**:
```json
{
  "first_name": "José",
  "last_name": "Pérez",
  "document_type": "V",
  "document_number": "12345678",
  "email": "jose.perez@example.com",
  "phone": "+584123456789",
  "city": "Maracaibo",
  "state": "Zulia",
  "area_id": 1,
  "subarea_id": 3,
  "experience_years": 8,
  "last_position": "Ingeniero de Yacimientos Senior",
  "bio_summary": "Especialista en simulación numérica de reservorios y recuperación secundaria...",
  "sector_id": 2,
  "education_level": "Universitario",
  "relocation_willing": true,
  "job_types_willing": ["Tiempo Completo", "Por Proyecto"],
  "immediate_availability": true,
  "salary_expectation": 2500.00,
  "consent_given": true,
  "captcha_token": "cf-turnstile-token-xyz-123",
  "languages": [
    { "language": "Inglés", "level": "Advanced" }
  ],
  "certifications": [1, 2]
}
```

**Response (201 Created)**:
```json
{
  "id": "a82b9dc3-718e-4a6f-b258-c2901dbd667c",
  "status": "pending",
  "message": "Registro completado con éxito. Su perfil está en proceso de revisión por parte de la CPV."
}
```

**Response (400 Bad Request - Validation Error)**:
```json
{
  "error": "Bad Request",
  "message": "Validation failed",
  "fields": {
    "document_number": "Cédula o pasaporte inválido",
    "email": "El correo ya está registrado"
  }
}
```
<!-- slide -->
### 2. Company Register & Login
**POST** `/api/v1/companies/register`
*Public registration for companies.*

**Request Body**:
```json
{
  "name": "PetroServicios Zulianos C.A.",
  "rif": "J-31234567-8",
  "email": "contacto@petroservicios.com",
  "phone": "+582617000000",
  "password": "Password123!"
}
```
**Response (201 Created)**:
```json
{
  "id": "bf589d87-3d92-4411-bc6e-57de53bd3c7a",
  "message": "Registro exitoso. Un administrador debe aprobar su cuenta para poder realizar búsquedas."
}
```

---

**POST** `/api/v1/companies/login`
*Public login for approved companies.*

**Request Body**:
```json
{
  "email": "contacto@petroservicios.com",
  "password": "Password123!"
}
```
**Response (200 OK)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "company": {
    "id": "bf589d87-3d92-4411-bc6e-57de53bd3c7a",
    "name": "PetroServicios Zulianos C.A."
  }
}
```
<!-- slide -->
### 3. Professional Search (Company Portal)
**GET** `/api/v1/professionals/search`
*Authenticated via JWT (Company). The middleware rejects the request with **403** if the company's `is_verified = false`. Results are **always restricted to `status = 'approved'`** professionals; contact fields (email/phone) are never included.*

**Query Parameters**:
* `area_id` (optional, integer)
* `subarea_id` (optional, integer)
* `min_experience` (optional, integer)
* `state` (optional, string)
* `relocation` (optional, boolean)
* `keyword` (optional, string, searches last_position and bio_summary)
* `page` (optional, default: 1)
* `limit` (optional, default: 20)

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "a82b9dc3-718e-4a6f-b258-c2901dbd667c",
      "first_name": "José",
      "last_name": "P.",
      "city": "Maracaibo",
      "state": "Zulia",
      "area": "Exploración y Producción",
      "subarea": "Ingeniería de Yacimientos",
      "experience_years": 8,
      "last_position": "Ingeniero de Yacimientos Senior",
      "bio_summary": "Especialista en simulación numérica de reservorios...",
      "education_level": "Universitario",
      "relocation_willing": true,
      "job_types_willing": ["Tiempo Completo", "Por Proyecto"],
      "immediate_availability": true,
      "languages": ["Inglés (Avanzado)"],
      "certifications": ["Certificación Well Control IFC"],
      "created_at": "2026-07-09T13:00:00Z"
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "has_more": false
  }
}
```
<!-- slide -->
### 4. Candidate Contact Request (Company)
**POST** `/api/v1/professionals/:id/contact`
*Authenticated via JWT (Company).*

**Request Body**:
```json
{
  "message": "Hola, estamos interesados en conversar contigo sobre una vacante en Maracaibo para perforación."
}
```
**Response (200 OK)**:
```json
{
  "contact_request_id": "ee489370-d731-419b-ab29-657bd31a980b",
  "status": "pending_admin",
  "message": "Solicitud de contacto registrada. El administrador revisará y facilitará el contacto."
}
```
<!-- slide -->
### 5. Admin Catalog & Profile Moderation
**GET** `/api/v1/admin/professionals?status=pending`
*Authenticated via JWT (Admin).*

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "a82b9dc3-718e-4a6f-b258-c2901dbd667c",
      "first_name": "José",
      "last_name": "Pérez",
      "document_type": "V",
      "document_number": "12345678", -- Decrypted for admin; access recorded in pii_access_log
      "email": "jose.perez@example.com",
      "phone": "+584123456789", -- Decrypted for admin; access recorded in pii_access_log
      "status": "pending",
      "created_at": "2026-07-09T13:00:00Z"
    }
  ]
}
```
*Every response that decrypts PII writes a `pii_access_log` row (admin id, professional id, fields, IP).*

---

**PATCH** `/api/v1/admin/professionals/:id/status`
*Authenticated via JWT (Admin).*

**Request Body**:
```json
{
  "status": "approved"
}
```
**Response (200 OK)**:
```json
{
  "id": "a82b9dc3-718e-4a6f-b258-c2901dbd667c",
  "status": "approved"
}
```
<!-- slide -->
### 6. Public Catalogs (feeds the wizard selects)
**GET** `/api/v1/catalogs`
*No auth. Cached (ETag / `Cache-Control: public, max-age=3600`). Returns every list the registration wizard needs so the frontend never hardcodes them.*

**Response (200 OK)**:
```json
{
  "areas": [{ "id": 1, "name": "Exploración y Producción" }],
  "subareas": [{ "id": 3, "area_id": 1, "name": "Ingeniería de Yacimientos" }],
  "sectors": [{ "id": 2, "name": "Privado" }],
  "certifications": [{ "id": 1, "name": "Well Control IFC" }],
  "states": [{ "name": "Zulia", "cities": ["Maracaibo", "Cabimas"] }]
}
```
*Individual scoped endpoints (`GET /api/v1/catalogs/subareas?area_id=1`) are also available for lazy loading.*
<!-- slide -->
### 7. Professional Self-Edit (Token)
*Backs the "self-correction" flow. The token is emailed on submission, stored only as `edit_token_hash`, and expires at `editable_until`.*

**GET** `/api/v1/professionals/edit/:token`
Validates the token (hash match + not expired) and returns the current profile to pre-fill the wizard.

**PUT** `/api/v1/professionals/edit/:token`
Applies the correction. On success the token is single-use invalidated (`edit_token_hash = NULL`) and the profile returns to `status = 'pending'` for re-moderation.

**Response (200 OK)**:
```json
{ "id": "a82b9dc3-...", "status": "pending", "message": "Perfil actualizado. Será revisado nuevamente por la CPV." }
```
**Response (410 Gone)**:
```json
{ "error": "Gone", "message": "El enlace de edición expiró o ya fue utilizado." }
```
<!-- slide -->
### 8. Professional Availability & Hired Feedback (Public/Token)
*Allows candidates to mark themselves as hired or update availability via a persistent token link received upon profile approval.*

**GET** `/api/v1/professionals/availability/:token`
Validates the persistent availability token and returns basic professional info (name, availability status).

**POST** `/api/v1/professionals/availability/:token`
Updates the availability and hired status. If marked as hired, the profile availability is set to false and is hidden from companies.
*Request Body:*
```json
{
  "hired_status": "hired_via_portal"
}
```
*Response (200 OK):*
```json
{
  "message": "Estado de disponibilidad actualizado correctamente. ¡Gracias por reportar su contratación!"
}
```

<!-- slide -->
### 9. Company Contact Feedback
*Companies can log in and submit feedback for professionals they contacted.*

**POST** `/api/v1/companies/feedback/:contact_id`
*Request Body:*
```json
{
  "result": "hired"
}
```
*Response (200 OK):*
```json
{
  "message": "Feedback registrado con éxito. Gracias por ayudarnos a medir la efectividad de la plataforma."
}
```

<!-- slide -->
### 10. Admin Statistics Dashboard
*Authenticated via JWT (Admin). Returns aggregated stats for portal effectiveness and usage.*

**GET** `/api/v1/admin/stats`
*Response (200 OK):*
```json
{
  "total_professionals": 245,
  "total_companies": 34,
  "total_contacts": 112,
  "hires_reported": {
    "via_portal": 18,
    "externally": 12,
    "total": 30
  },
  "success_rate_percent": 16.07,
  "most_requested_areas": [
    { "area_id": 1, "area_name": "Exploración y Producción", "contacts_count": 56 },
    { "area_id": 2, "area_name": "Refinación", "contacts_count": 22 }
  ],
  "top_contacting_companies": [
    { "company_id": "bf589d87-...", "company_name": "PetroServicios Zulianos C.A.", "contacts_count": 14 }
  ],
  "registrations_over_time": [
    { "month": "2026-06", "professionals": 120, "companies": 15 },
    { "month": "2026-07", "professionals": 125, "companies": 19 }
  ]
}
```

<!-- slide -->
### 11. Admin Catalog CRUD
*Authenticated via JWT (Admin). Covers areas, subareas, sectors, certifications.*

**POST** `/api/v1/admin/catalogs/areas`
```json
{ "name": "Petroquímica" }
```
**Response (201 Created)**:
```json
{ "id": 4, "name": "Petroquímica", "created_by": "admin_user" }
```
*Also: `PATCH /api/v1/admin/catalogs/areas/:id`, `DELETE .../:id` (blocked with **409** if referenced by professionals), and the equivalent routes for `subareas`, `sectors`, `certifications`.*
```

---

## 5. Prisma Schema Model

This Prisma schema reflects the PostgreSQL relational model. Save to [schema.prisma](file:///c:/Users/EstebanVasquez/OneDrive%20-%20MSFT/Documents/GitHub/BolsaEmpleoCPV/apps/backend/prisma/schema.prisma) in execution.

```prisma
datasource db {
  provider  = "postgresql"
  // Runtime: Supabase Supavisor transaction pooler (port 6543), accelerated by Cloudflare Hyperdrive.
  url       = env("DATABASE_URL")
  // Migrations: Supabase direct/session connection (port 5432) — pooler can't run DDL.
  directUrl = env("DIRECT_URL")
}

generator client {
  provider        = "prisma-client-js"
  // driverAdapters lets Prisma run on the Cloudflare Workers runtime via @prisma/adapter-pg over Hyperdrive.
  previewFeatures = ["driverAdapters"]
}

enum ProfessionalStatus {
  pending
  approved
  rejected
}

enum HiredStatus {
  looking
  hired_via_portal
  hired_externally
}

enum UserRole {
  superadmin
  moderator
}

enum ContactStatus {
  pending_admin
  sent
  blocked
}

enum ContactResult {
  pending
  hired
  not_hired
  in_progress
}

model Area {
  id           Int           @id @default(autoincrement())
  name         String        @unique @db.VarChar(100)
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")
  createdBy    String        @default("system") @map("created_by")
  subareas     Subarea[]
  professionals Professional[]

  @@map("areas")
}

model Subarea {
  id           Int           @id @default(autoincrement())
  areaId       Int           @map("area_id")
  area         Area          @relation(fields: [areaId], references: [id], onDelete: Cascade)
  name         String        @db.VarChar(100)
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")
  createdBy    String        @default("system") @map("created_by")
  professionals Professional[]

  @@unique([areaId, name], name: "uq_subarea_per_area")
  @@map("subareas")
}

model Sector {
  id           Int           @id @default(autoincrement())
  name         String        @unique @db.VarChar(100)
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")
  createdBy    String        @default("system") @map("created_by")
  professionals Professional[]

  @@map("sectors")
}

model Certification {
  id           Int                         @id @default(autoincrement())
  name         String                      @unique @db.VarChar(100)
  createdAt    DateTime                    @default(now()) @map("created_at")
  updatedAt    DateTime                    @updatedAt @map("updated_at")
  createdBy    String                      @default("system") @map("created_by")
  professionals ProfessionalCertification[]

  @@map("certifications")
}

model Company {
  id           String        @id @default(uuid()) @db.Uuid
  name         String        @db.VarChar(150)
  rif          String        @unique @db.VarChar(20)
  email        String        @unique @db.VarChar(150)
  phone        String        @db.VarChar(50)
  passwordHash String        @map("password_hash") @db.VarChar(255)
  isVerified   Boolean       @default(false) @map("is_verified")
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")
  searches     SearchLog[]
  contacts     ContactLog[]

  @@map("companies")
}

model Admin {
  id           String        @id @default(uuid()) @db.Uuid
  username     String        @unique @db.VarChar(50)
  email        String        @unique @db.VarChar(150)
  passwordHash String        @map("password_hash") @db.VarChar(255)
  role         UserRole      @default(moderator)
  createdAt    DateTime      @default(now()) @map("created_at")
  updatedAt    DateTime      @updatedAt @map("updated_at")
  piiAccesses  PiiAccessLog[]

  @@map("admins")
}

model Professional {
  id                     String                      @id @default(uuid()) @db.Uuid
  firstName              String                      @map("first_name") @db.VarChar(100)
  lastName               String                      @map("last_name") @db.VarChar(100)
  documentType           String                      @map("document_type") @db.VarChar(10)
  documentNumberEncrypted String                     @map("document_number_encrypted") @db.VarChar(255)
  documentNumberHash     String                      @unique @map("document_number_hash") @db.Char(64)
  email                  String                      @unique @db.VarChar(150)
  emailVerified          Boolean                     @default(false) @map("email_verified")
  phoneEncrypted         String                      @map("phone_encrypted") @db.VarChar(255)
  city                   String                      @db.VarChar(100)
  state                  String                      @db.VarChar(100)
  areaId                 Int                         @map("area_id")
  area                   Area                        @relation(fields: [areaId], references: [id])
  subareaId              Int                         @map("subarea_id")
  subarea                Subarea                     @relation(fields: [subareaId], references: [id])
  experienceYears        Int                         @map("experience_years")
  lastPosition           String                      @map("last_position") @db.VarChar(150)
  bioSummary             String                      @map("bio_summary") @db.Text
  sectorId               Int                         @map("sector_id")
  sector                 Sector                      @relation(fields: [sectorId], references: [id])
  educationLevel         String                      @map("education_level") @db.VarChar(50)
  relocationWilling      Boolean                     @default(false) @map("relocation_willing")
  jobTypesWilling        String[]                    @map("job_types_willing")
  immediateAvailability  Boolean                     @default(false) @map("immediate_availability")
  salaryExpectation      Decimal?                    @map("salary_expectation") @db.Decimal(12, 2)
  status                 ProfessionalStatus          @default(pending)
  hiredStatus            HiredStatus                 @default(looking) @map("hired_status")
  hiredAt                DateTime?                   @map("hired_at")
  availabilityTokenHash  String?                     @map("availability_token_hash") @db.Char(64)
  editableUntil          DateTime?                   @map("editable_until")
  editTokenHash          String?                     @map("edit_token_hash") @db.Char(64)
  consentGiven           Boolean                     @default(false) @map("consent_given")
  consentVersion         String                      @default("v1") @map("consent_version") @db.VarChar(20)
  consentIp              String?                     @map("consent_ip") @db.VarChar(45)
  consentDate            DateTime                    @default(now()) @map("consent_date")
  createdAt              DateTime                    @default(now()) @map("created_at")
  updatedAt              DateTime                    @updatedAt @map("updated_at")
  certifications         ProfessionalCertification[]
  languages              ProfessionalLanguage[]
  contacts               ContactLog[]
  piiAccesses            PiiAccessLog[]

  @@map("professionals")
}

model ProfessionalCertification {
  professionalId String        @map("professional_id") @db.Uuid
  professional   Professional  @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  certificationId Int          @map("certification_id")
  certification  Certification @relation(fields: [certificationId], references: [id], onDelete: Cascade)
  issueDate      DateTime?     @map("issue_date") @db.Date

  @@id([professionalId, certificationId])
  @@map("professional_certifications")
}

model ProfessionalLanguage {
  id             Int          @id @default(autoincrement())
  professionalId String       @map("professional_id") @db.Uuid
  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  language       String       @db.VarChar(50)
  level          String       @db.VarChar(20)

  @@unique([professionalId, language], name: "uq_professional_language")
  @@map("professional_languages")
}

model SearchLog {
  id           Int           @id @default(autoincrement())
  companyId    String        @map("company_id") @db.Uuid
  company      Company       @relation(fields: [companyId], references: [id])
  queryParams  Json          @map("query_params")
  resultsCount Int           @map("results_count")
  ipAddress    String        @map("ip_address") @db.VarChar(45)
  createdAt    DateTime      @default(now()) @map("created_at")

  @@map("searches_log")
}

model ContactLog {
  id                String        @id @default(uuid()) @db.Uuid
  companyId         String        @map("company_id") @db.Uuid
  company           Company       @relation(fields: [companyId], references: [id])
  professionalId    String        @map("professional_id") @db.Uuid
  professional      Professional  @relation(fields: [professionalId], references: [id])
  message           String        @db.Text
  status            ContactStatus @default(pending_admin)
  result            ContactResult @default(pending)
  feedbackUpdatedAt DateTime?     @map("feedback_updated_at")
  createdAt         DateTime      @default(now()) @map("created_at")

  @@map("contacts_log")
}

model PiiAccessLog {
  id             String       @id @default(uuid()) @db.Uuid
  adminId        String       @map("admin_id") @db.Uuid
  admin          Admin        @relation(fields: [adminId], references: [id])
  professionalId String       @map("professional_id") @db.Uuid
  professional   Professional @relation(fields: [professionalId], references: [id])
  fieldsAccessed String[]     @map("fields_accessed")
  ipAddress      String       @map("ip_address") @db.VarChar(45)
  createdAt      DateTime     @default(now()) @map("created_at")

  @@map("pii_access_log")
}
```

---

## 6. Frontend Mock & Form Flows (4-Step Wizard)

The wizard is designed to prevent friction. We will use a premium layout: Dark mode, HSL tailored primary blue (`#0284c7` / `sky-600`), and smooth transitions. Form validation uses React Hook Form + Zod.

```carousel
### Screen 1: Información Personal y de Contacto
*   **Encabezado**: Paso 1 de 4: Información Personal.
*   **Campos**:
    *   *Nombres* (Texto, obligatorio).
    *   *Apellidos* (Texto, obligatorio).
    *   *Tipo de Documento* (Select: Cédula Venezolana V, Extranjero E, Pasaporte P).
    *   *Número de Documento* (Texto, obligatorio, RegExp: `^[0-9]{5,9}$` para V/E).
    *   *Correo Electrónico* (Email, obligatorio).
    *   *Teléfono Celular* (Texto, obligatorio, prefijo internacional automático +58).
    *   *Estado* (Select autocompletado de estados de Venezuela).
    *   *Ciudad* (Select dinámico filtrado por estado).
*   **Validaciones Visuales**:
    *   Si el correo existe o el formato del teléfono es erróneo, muestra un borde rojo y un micro-mensaje de ayuda: *"Ingrese un correo válido"*.
*   **Botón**: *"Siguiente"* (Habilitado solo si los campos requeridos de la sección están validados localmente).
<!-- slide -->
### Screen 2: Perfil Profesional
*   **Encabezado**: Paso 2 de 4: Perfil Técnico.
*   **Campos**:
    *   *Área Principal del Sector* (Select de catálogo: e.g., Exploración y Producción, Refinación, Gas, Mantenimiento).
    *   *Subespecialidad / Subárea* (Select dinámico filtrado por Área).
    *   *Sector de Trabajo Principal* (Select: Privado, Público, Mixto).
    *   *Años de Experiencia en el Sector* (Número, obligatorio, >0).
    *   *Último Cargo Desempeñado* (Texto, obligatorio).
    *   *Resumen Profesional* (Textarea, obligatorio, mín. 100 caracteres, máx. 1000). Muestra un contador de caracteres en tiempo real.
*   **Botones**: *"Atrás"* | *"Siguiente"*.
<!-- slide -->
### Screen 3: Preferencias y Competencias
*   **Encabezado**: Paso 3 de 4: Competencias y Disponibilidad.
*   **Campos**:
    *   *Nivel de Formación Académica* (Select: Técnico Medio, Técnico Superior, Universitario, Especialización, Maestría, Doctorado).
    *   *Disponibilidad para Reubicación/Traslado* (Radio buttons: Sí / No).
    *   *Tipo de Jornada Deseada* (Multi-select: Tiempo Completo, Por Proyecto, Asesoría/Consultoría).
    *   *Disponibilidad Inmediata* (Checkbox: Sí / No).
    *   *Idiomas* (Form repetible: Idioma + Nivel [Básico, Intermedio, Avanzado, Nativo]).
    *   *Certificaciones Especializadas* (Multi-select del catálogo de certificaciones del sector: Well Control, ASME, API, etc.).
    *   *Expectativa Salarial Mensual (USD)* (Numérico, opcional).
*   **Botones**: *"Atrás"* | *"Siguiente"*.
<!-- slide -->
### Screen 4: Revisión, Consentimiento y Envío
*   **Encabezado**: Paso 4 de 4: Confirmación y Consentimiento Legal.
*   **Contenido**:
    *   Muestra un resumen estilizado de todos los datos ingresados en formato de "tarjeta de perfil" para que el profesional revise antes de guardar.
    *   Muestra un cuadro de texto legal destacando que **esta información no podrá ser editada directamente** y será visible únicamente por empresas afiliadas a la Cámara Petrolera de Venezuela.
    *   *Checkbox Obligatorio*: *"Acepto los términos de privacidad y doy mi consentimiento para que la CPV publique mis datos de perfil profesional a las empresas miembro."*
    *   *Widget de Captcha* (Cloudflare Turnstile).
*   **Botones**: *"Atrás"* | *"Finalizar Registro"* (Deshabilitado hasta que se marque el consentimiento y se resuelva el Captcha).
*   **Comportamiento del Guardado**:
    *   Muestra un spinner interactivo.
    *   Si hay un error en el servidor (ej. cédula duplicada), vuelve al Paso 1 y resalta el campo de la Cédula con el error retornado por la API: *"Esta cédula ya está registrada."*
```

---

## 7. Initial Tests (Backend)

We write the initial test specs as JSON descriptions of payload and expected execution responses. These test definitions are designed to be run using a framework like Jest/Supertest against the REST endpoints.

```json
[
  {
    "name": "TC-001: Register Professional - Success with minimum fields",
    "endpoint": "POST /api/v1/professionals",
    "payload": {
      "first_name": "Pedro",
      "last_name": "Gómez",
      "document_type": "V",
      "document_number": "87654321",
      "email": "pedro.gomez@example.com",
      "phone": "+584149999999",
      "city": "Caracas",
      "state": "Distrito Capital",
      "area_id": 1,
      "subarea_id": 2,
      "experience_years": 5,
      "last_position": "Ingeniero Mecánico",
      "bio_summary": "Experiencia en mantenimiento de tuberías y estaciones de compresión por más de 5 años.",
      "sector_id": 1,
      "education_level": "Universitario",
      "consent_given": true,
      "captcha_token": "valid-test-token"
    },
    "expected_status": 201,
    "expected_response": {
      "id": "VALID_UUID",
      "status": "pending",
      "message": "Registro completado con éxito. Su perfil está en proceso de revisión por parte de la CPV."
    }
  },
  {
    "name": "TC-002: Register Professional - Failure on missing required fields",
    "endpoint": "POST /api/v1/professionals",
    "payload": {
      "first_name": "Pedro",
      "last_name": "",
      "email": "invalid-email-format",
      "consent_given": false
    },
    "expected_status": 400,
    "expected_response": {
      "error": "Bad Request",
      "message": "Validation failed",
      "fields": {
        "last_name": "Required",
        "email": "Invalid email address",
        "document_type": "Required",
        "document_number": "Required",
        "phone": "Required",
        "consent_given": "Consent must be accepted"
      }
    }
  },
  {
    "name": "TC-003: Company Search - Authenticated Search with filters",
    "endpoint": "GET /api/v1/professionals/search?area_id=1&min_experience=5",
    "headers": {
      "Authorization": "Bearer VALID_COMPANY_JWT_TOKEN"
    },
    "expected_status": 200,
    "expected_response_structure": {
      "data": "array",
      "meta": {
        "total": "number",
        "page": 1,
        "limit": 20
      }
    }
  },
  {
    "name": "TC-004: Company Search - Denied access if unauthorized/no token",
    "endpoint": "GET /api/v1/professionals/search?area_id=1",
    "headers": {},
    "expected_status": 401,
    "expected_response": {
      "error": "Unauthorized",
      "message": "Access token is missing or invalid"
    }
  },
  {
    "name": "TC-005: Admin Action - Create Catalog Item (Area)",
    "endpoint": "POST /api/v1/admin/catalogs/areas",
    "headers": {
      "Authorization": "Bearer VALID_ADMIN_JWT_TOKEN"
    },
    "payload": {
      "name": "Petroquímica"
    },
    "expected_status": 201,
    "expected_response": {
      "id": 4,
      "name": "Petroquímica",
      "createdBy": "admin_user"
    }
  }
]
```

---

## 8. Sprint Planning — AI-Accelerated Estimate

The estimate below is **AI-assisted**, not pure manual coding. The team drives the build with AI pair-programming (Claude Code / Copilot) for the high-boilerplate work that dominates a CRUD + forms MVP: Prisma schema and migrations, Zod schemas shared front/back, Hono controllers and DTOs, the 4-step wizard scaffolding, catalog seeds, and the test suites. AI does **not** replace engineering judgment on security (encryption/HMAC, auth, PII audit), UX polish, or integration debugging — those stay human-reviewed, which is why they shrink less below.

**Two columns are shown**: `Trad.` = a conventional all-manual estimate; `AI` = the AI-accelerated estimate we commit to. The scope here is also **larger** than the original plan (it now includes public catalog endpoints, the self-edit token flow, email verification, the transactional-email service, and PII auditing) yet still lands well under the old budget.

| Task ID | Task Description | Role | Trad. | AI | Priority | Dependencies |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| **INF-1** | Provision Supabase (pg_trgm/uuid-ossp), author Prisma schema + first migration, configure Hyperdrive + pooler/direct connection strings. | DevOps | 10 | 8 | P0 | None |
| **INF-2** | CI/CD (GitHub Actions + Wrangler), Cloudflare Pages/Workers deploy config, DNS subdomain, transactional email provider. | DevOps | 10 | 9 | P0 | INF-1 |
| **BE-1** | Backend scaffold on Cloudflare Workers (Hono + TS, routing, linting, error handler, Prisma driver adapter). | Backend | 11 | 7 | P0 | INF-1 |
| **BE-2** | Seed script: catalogs (areas/subareas/sectors/certifications) + Venezuela geography. | Backend | 8 | 3 | P0 | BE-1 |
| **BE-3** | Professional registration: AES-256-GCM encryption + HMAC dedupe + Turnstile + email verification. | Backend | 18 | 10 | P0 | BE-2 |
| **BE-4** | Company auth (register/login/JWT) + `is_verified` enforcement middleware. | Backend | 12 | 7 | P0 | BE-1 |
| **BE-5** | Search endpoint: trigram + filters, approved-only, offset pagination, masked fields, and registration date/seniority. | Backend | 12 | 7 | P0 | BE-3 |
| **BE-6** | Admin moderation + catalog CRUD + `pii_access_log` auditing. | Backend | 14 | 8 | P1 | BE-3, BE-4 |
| **BE-7** | Contact request + transactional email service (edit token, contact, verification templates). | Backend | 10 | 6 | P1 | BE-3, BE-4 |
| **BE-8** | Public catalogs endpoint (`GET /api/v1/catalogs`) with caching + self-edit token routes. | Backend | 6 | 3 | P0 | BE-2, BE-3 |
| **BE-9** | Admin statistics endpoint (`GET /api/v1/admin/stats`) aggregating most requested professions, top contacts, registration rates, and hired ratios. | Backend | 8 | 5 | P1 | BE-6 |
| **BE-10** | Feedback loop endpoints (candidate availability status update by token + company feedback on contacts). | Backend | 10 | 6 | P1 | BE-7 |
| **FE-1** | Next.js scaffold (Tailwind, React Hook Form, Zod, typed API client). | Frontend | 12 | 5 | P0 | None |
| **FE-2** | 4-step wizard UI + step nav + localStorage + catalogs integration. | Frontend | 24 | 14 | P0 | FE-1, BE-8 |
| **FE-3** | Wizard ↔ API integration, error mapping, self-edit page. | Frontend | 10 | 6 | P0 | FE-2, BE-3 |
| **FE-4** | Company login + search dashboard (filters + registration seniority + contact modal + hiring feedback prompts). | Frontend | 18 | 12 | P1 | FE-1, BE-5 |
| **FE-5** | Admin dashboard (moderation queue, catalog editor). | Frontend | 14 | 9 | P1 | FE-1, BE-6 |
| **FE-6** | Admin statistics dashboard view (charts, KPI cards, visual indicators). | Frontend | 12 | 8 | P1 | FE-5 |
| **FE-7** | Feedback interfaces: candidate availability/hired landing page (secure token). | Frontend | 8 | 5 | P1 | FE-3 |
| **QA-1** | Test env (Vitest) + unit tests for validators/models. | QA | 8 | 5 | P0 | BE-1, FE-1 |
| **QA-2** | API contract/integration tests + regression suite. | QA | 14 | 8 | P0 | BE-3, BE-5 |
| **QA-3** | Playwright E2E smoke of the 3 critical flows (register, search, moderate, stats/feedback). | QA | 10 | 5 | P1 | FE-3, FE-4 |
| **TOTAL** | | | **281** | **155** | | |

* **Priority Key**: P0 = Critical (basic flow), P1 = Important.
* **Effective saving**: ~**45%** fewer hours vs. the conventional estimate **while delivering a wider scope**, with no reduction in security or QA depth (those tasks are deliberately discounted the least). At a competitive blended rate this is the lever that makes the final quote materially cheaper.
* **Calendar**: with 2 engineers (1 BE-leaning, 1 FE-leaning) + part-time QA, 155 h ≈ **2.5 working weeks** end-to-end, including the deployment runbook in Section 10.

---

## 9. Security & Operations Recommendations

1. **Field-Level Data Encryption**:
   * Encrypt candidate identifiers (`document_number`) and phone numbers before writing to the database using `aes-256-gcm` (random IV per record → ciphertext is **non-deterministic**, so it cannot be uniquely indexed or searched directly).
   * Store the encryption key **and** a separate HMAC pepper in secure environment variables / a secrets manager (never in source control).
   * For duplicate detection, store **`HMAC-SHA256(document_number, pepper)`** in the dedicated `document_number_hash` column (unique index). Do **not** use a plain `sha256`: a Venezuelan cédula has only ~10⁸ possible values, so an unsalted digest is trivially brute-forced from a DB leak. The keyed HMAC prevents that while remaining deterministic for lookups.
   * **Admin PII access is audited**: every decryption of `document_number`/`phone` writes a `pii_access_log` row (admin id, professional id, fields, IP, timestamp).

2. **Spam & Abuse Protection**:
   * **CAPTCHA**: Integrate Cloudflare Turnstile (privacy-friendly, no-interaction alternative to reCAPTCHA) on the frontend wizard step 4. Validate the token on the backend before completing database writes.
   * **Rate-limiting**: Enforce **Cloudflare WAF rate-limiting rules at the edge** on the registration API (`POST /api/v1/professionals` limited to 3/IP/hour) and search API (`GET /api/v1/professionals/search` limited to 100/company/hour), with a defensive in-Worker limiter (Hono middleware backed by a KV/Durable Object counter) as a second layer.

3. **Protection of Sensitive Candidate Contacts**:
   * Do not return candidate emails or phones to companies directly in the search API.
   * Return a masked email (e.g., `j***z@example.com`) and require the company to trigger the `contact_request` endpoint.
   * The contact request logs the request in `contacts_log` and sends an automated template email via SMTP to the candidate, alerting them that *"Company X is interested in your profile"* with instructions to get in touch.

4. **Production Staging & Backups**:
   * **Backups**: Supabase provides automated **daily backups + point-in-time recovery** on the Pro plan (production should run on Pro, since Free projects pause after ~7 days of inactivity).
   * **HTTPS**: Enforce HTTPS-only traffic via Cloudflare **Always Use HTTPS** + HSTS headers.

5. **Consent Records (Habeas Data / GDPR-like)**:
   * Keep a legal consent log for each professional. `consent_given` must be true; `consent_date` captures the exact UTC timestamp; `consent_ip` stores the originating IP; and `consent_version` records **which version of the privacy text** was accepted, so future changes to the terms remain auditable per record.
   * Define a **log retention policy**: purge or anonymize `searches_log` and `pii_access_log` rows older than 12 months (aligns with the "GDPR-like" posture invoked above).

---

## 10. Deployment Plan & Hosting Strategy

### 10.1 Domain strategy using talento.camarapetrolera.app

The domain **talento.camarapetrolera.app** is already registered and loaded in Cloudflare. This is the ideal option because:
* It completely isolates the Talent Platform from the existing **camarapetrolera.org** infrastructure.
* **Zero risk** to the main brochure website (Apache host `51.81.48.12`) or institutional emails on **Google Workspace** (`aspmx.l.google.com`).
* No need to change nameservers or modify DNS zone files for `camarapetrolera.org`.
* Since the `.app` domain is already in Cloudflare, we can leverage Cloudflare Pages, Workers, WAF, rate-limiting, and Turnstile natively without extra DNS configuration delay.

### 10.2 Target architecture — Cloudflare + Supabase

```
                           ┌────────────────────────────────────────┐
   DNS (camarapetrolera.org) │ camarapetrolera.org  (A 51.81.48.12)   │─► Existing Apache site (UNCHANGED)
   (EXTERNAL DNS)            │ MX → Google Workspace                  │─► Institutional email (UNCHANGED)
                           └────────────────────────────────────────┘
                           
                           ┌────────────────────────────────────────┐
   DNS (Cloudflare zone)     │ talento.camarapetrolera.app   → Pages   │─► Next.js frontend  (Cloudflare Pages)
   (camarapetrolera.app or   │ api.talento.camarapetrolera.app → Worker│─► Hono API          (Cloudflare Workers)
    talento.camarapetrolera.app)                                    │
                           └────────────────────────────────────────┘
                                         │  Hyperdrive (connection cache/pooling)
                                         ▼
                               Supabase  (managed PostgreSQL: pg_trgm, arrays, enums) + daily backups
                                         │
                               Transactional email (Resend / Brevo)
```

* **Frontend** (`talento.camarapetrolera.app`): **Cloudflare Pages** running the Next.js App Router (via the OpenNext Cloudflare adapter). Global CDN, per-PR preview deploys, automatic HTTPS.
* **Backend API** (`api.talento.camarapetrolera.app`): **Cloudflare Workers** with the **Hono** framework. Custom domain attached in Cloudflare to route API traffic directly to the Worker.
* **Database**: **Supabase** — managed PostgreSQL, so the entire schema (Section 3) and Prisma model (Section 5) are used **unchanged**: `pg_trgm` trigram search, `TEXT[]` arrays, enums, partial indexes all supported.
* **DB connectivity from Workers**: **Cloudflare Hyperdrive** in front of Supabase's **Supavisor pooler**, using Prisma's driver adapter (`@prisma/adapter-pg` with `driverAdapters` enabled). Two connection strings are needed:
  * **Runtime queries** → Supavisor *transaction* pooler (port `6543`), fronted by Hyperdrive.
  * **`prisma migrate`** → Supabase *direct/session* connection (port `5432`).
* **Anti-abuse**: **Turnstile** (CAPTCHA) + **Cloudflare WAF rate-limiting rules** at the edge, plus a defensive limiter inside the Worker.
* **Transactional email**: **Resend** or **Brevo** (free tier). Configure SPF/DKIM/DMARC as a sender directly on the `talento.camarapetrolera.app` zone (e.g. `mail.talento.camarapetrolera.app` or `talento.camarapetrolera.app`), keeping it completely isolated from the existing Google Workspace records on `camarapetrolera.org`.
* **Secrets**: encryption key + HMAC pepper + JWT secret + email API key stored as **Workers/Pages secrets** (Wrangler `secret put`) — never in git.

### 10.3 DNS setup — cloudflare configuration

Since the domain `talento.camarapetrolera.app` is already active in Cloudflare, setting up DNS is extremely straightforward:

* **No delegation required**: We do not touch registrar nameservers.
* **Custom Domains**: In the Cloudflare Pages settings, we associate `talento.camarapetrolera.app` as a custom domain (Cloudflare automatically adds the corresponding CNAME record). In the Worker settings, we associate `api.talento.camarapetrolera.app` as a custom domain.
* **Security & Routing**: Cloudflare automatically provisions SSL/TLS certificates and applies WAF/Turnstile settings at the zone edge.

### 10.4 Environments

| Environment | Frontend (Pages) | Backend (Workers) | Database | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Preview** | Pages preview URL (per PR) | Workers preview | Supabase branch/schema | Review each PR in isolation |
| **Staging** | `staging.talento.camarapetrolera.app` | `api-staging.camarapetrolera.app` | Supabase `staging` | QA + client UAT |
| **Production** | `talento.camarapetrolera.app` | `api.talento.camarapetrolera.app` | Supabase `production` | Live |

### 10.5 CI/CD pipeline (GitHub Actions → Cloudflare)

1. **On PR**: lint + typecheck + `prisma validate` + unit tests (Vitest) + Playwright smoke against a Supabase preview schema. Cloudflare Pages/Workers build preview deploys automatically.
2. **On merge to `main`**: `prisma migrate deploy` (direct connection) against staging, then `wrangler deploy` (Worker) + Pages deploy to staging; run the regression suite.
3. **Promote to production**: manual approval gate → `prisma migrate deploy` on prod → `wrangler deploy` + Pages production deploy. Cloudflare keeps previous versions for **instant rollback**.
4. **Migrations are forward-only and reviewed**; never `prisma db push` to production.

### 10.6 Go-live runbook (zero downtime to the old site & email)

1. **DNS check**: Confirm that `talento.camarapetrolera.app` is active in the Cloudflare dashboard.
2. Provision the Supabase **production** project; enable `pg_trgm`/`uuid-ossp`; run `prisma migrate deploy` + seed catalogs. Note the direct (5432) and pooler (6543) URLs.
3. Create a **Hyperdrive** config pointing at the Supabase pooler; bind it to the Worker.
4. Deploy the Worker (`api.talento.camarapetrolera.app`); set secrets (encryption key, HMAC pepper, JWT secret, Turnstile secret, email API key).
5. Deploy Pages (`talento.camarapetrolera.app`); set `NEXT_PUBLIC_API_URL` and the Turnstile site key.
6. Configure email DNS in the Cloudflare zone (SPF/DKIM/DMARC) using `mail.talento.camarapetrolera.app` as the sender subdomain; send test emails through every template.
7. Enable Cloudflare **Always Use HTTPS**, HSTS, WAF managed rules, and rate-limit rules mirroring the app limits (3 registrations/IP/hour, 100 searches/company/hour).
8. Add a "Bolsa de Talento" link from the existing Apache site on `camarapetrolera.org` pointing to `https://talento.camarapetrolera.app`.
9. Smoke-test the three critical flows in production; enable uptime + error monitoring.

### 10.7 Backups, monitoring & operations

* **Backups**: Supabase **daily automated backups** + point-in-time recovery (on the Pro plan). Document the restore procedure.
* **Reliability note**: Supabase **Free** projects pause after ~7 days of inactivity — acceptable for validation, but **production should run on Supabase Pro** to avoid pausing and to get daily backups.
* **Monitoring**: Cloudflare Workers analytics + **Sentry** (free) for error tracking; **UptimeRobot**/Better Stack pinging `api.camarapetrolera.org/health` and `talento.camarapetrolera.org`.
* **Logs**: Cloudflare Logpush / Workers tail; retain `pii_access_log` per the retention policy in Section 9.

### 10.8 Estimated monthly infrastructure cost (MVP)

| Component | Provider | MVP tier | Est. cost/mo |
| :--- | :--- | :--- | :---: |
| Frontend (Pages) + API (Workers) | Cloudflare | Free → Paid ($5) | $0 – $5 |
| PostgreSQL | Supabase | Free → Pro | $0 – $25 |
| Connection acceleration | Cloudflare Hyperdrive | Included | $0 |
| Transactional email | Resend/Brevo | Free tier | $0 |
| DNS / WAF / Turnstile | Cloudflare | Free | $0 |
| Error monitoring | Sentry | Free | $0 |
| **Total** | | | **≈ $0 – $30 /mo** |

Validation can run entirely on **free tiers (~$0/mo)**; a stable production posture (Supabase Pro + Workers paid) is **≈ $30/mo**. No upfront server purchase and no disruption to the client's existing hosting or email.

---

## 11. Open Decisions for Client Approval

Please review the following open architectural and design decisions:

1. **Self-Service Corrections**:
   > [!IMPORTANT]
   > Since there is no "candidate login", how should a professional correct an error in their profile?
   > * **Option A (Recommended)**: Send an email confirmation containing a unique token link valid for 48 hours that bypasses auth and re-opens the wizard for that specific record.
   > * **Option B**: No self-service; errors must be emailed to a support inbox (`soporte@cpv.org.ve`) and modified by an administrator.

2. **Candidate Contact Flow**:
   > [!IMPORTANT]
   > When a company requests to contact a candidate, how should they proceed?
   > * **Option A (Recommended)**: The system automatically sends an email to the candidate containing the company details and the company's message, letting the candidate make the first move.
   > * **Option B**: The system notifies the admin panel, and a CPV operator manually emails both parties (concierge service).

3. **Captcha Provider**:
   > [!NOTE]
   > Which Captcha system should we adopt for the MVP?
   > * **Option A (Recommended)**: Cloudflare Turnstile (free, high privacy, requires no user interaction/puzzles).
   > * **Option B**: Google reCAPTCHA v3.

4. **RIF Verification (Companies)**:
   > [!NOTE]
   > How should we verify that registered companies are legitimate CPV members?
   > * **Option A (Recommended)**: Manual approval queue in the admin panel. Every new company registration starts as `is_verified = false`, and an admin must verify the RIF/membership manually.
   > * **Option B**: Automated check against a static list of authorized CPV RIF numbers loaded into the database.

5. **Profile Expiration/Retention Policy**:
   > [!NOTE]
   > Do profiles expire? (e.g., in a year, a professional might be employed or no longer looking).
   > * **Option A**: Send an automated email check after 6 months. If they don't click "Renew", the profile status is changed to "inactive".
   > * **Option B (Recommended for MVP)**: No expiration; profiles remain indefinitely until requested to be removed by support.

6. **Salary Range Visibility**:
   > [!NOTE]
   > Should salary expectations be visible in the search results to companies?
   > * **Option A (Recommended)**: Yes, as a filterable search parameter.
   > * **Option B**: Hide it and use it only for internal matchmaking matching by admins.

7. **Multi-state Autocomplete**:
   > [!NOTE]
   > Should the location inputs be free-text or locked to a pre-defined Venezuelan administrative geography?
   > * **Option A (Recommended)**: Pre-load the database with Venezuela's 23 States, Capital District, and their major Cities.
   > * **Option B**: Use simple text fields (adds spelling errors, complicates search).

8. **Admin Security/MFA**:
   > [!NOTE]
   > Is multi-factor authentication (MFA) required for admin accounts for the MVP?
   > * **Option A (Recommended for MVP)**: No, standard secure passwords + JWT sessions.
   > * **Option B**: Add basic email-based 2FA tokens.

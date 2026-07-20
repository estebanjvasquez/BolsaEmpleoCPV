/** Public-facing shapes returned by the API. Mirrors the Prisma models in
 * apps/backend/prisma/schema.prisma, minus internal/encrypted-only fields. */

export type ProfessionalStatus = "pending" | "approved" | "rejected";
export type HiredStatus = "looking" | "hired_via_portal" | "hired_externally";
export type UserRole = "superadmin" | "moderator";
export type ContactStatus = "pending_admin" | "sent" | "blocked";
export type ContactResult = "pending" | "hired" | "not_hired" | "in_progress";

export interface Area {
  id: number;
  name: string;
}

export interface Subarea {
  id: number;
  areaId: number;
  name: string;
}

export interface Sector {
  id: number;
  name: string;
}

export interface Certification {
  id: number;
  name: string;
}

/** Shape returned by GET /api/v1/professionals/search (implementation_plan.md §4.3) — no PII. */
export interface ProfessionalSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  city: string;
  state: string;
  area: string;
  subarea: string;
  experience_years: number;
  last_position: string;
  bio_summary: string;
  education_level: string;
  relocation_willing: boolean;
  job_types_willing: string[];
  immediate_availability: boolean;
  languages: string[];
  certifications: string[];
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  rif: string;
  email: string;
  phone: string;
  isVerified: boolean;
  createdAt: string;
}

export interface ApiError {
  error: string;
  message: string;
  fields?: Record<string, string>;
}

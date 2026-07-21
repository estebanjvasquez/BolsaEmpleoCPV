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

/** Shape returned by POST /api/v1/professionals/:id/contact (implementation_plan.md §4.4). */
export interface ContactRequestResult {
  contact_request_id: string;
  status: ContactStatus;
  message: string;
}

/** Row shape returned by GET /api/v1/companies/contacts, feeding the "Mis Contactos" feedback UI. */
export interface CompanyContactSummary {
  id: string;
  professional_id: string;
  professional_name: string;
  message: string;
  status: ContactStatus;
  result: ContactResult;
  created_at: string;
}

/** Shape returned by GET /api/v1/admin/stats (implementation_plan.md §4.10). */
export interface AdminStats {
  total_professionals: number;
  total_companies: number;
  total_contacts: number;
  hires_reported: {
    via_portal: number;
    externally: number;
    total: number;
  };
  success_rate_percent: number;
  most_requested_areas: Array<{ area_id: number; area_name: string; contacts_count: number }>;
  top_contacting_companies: Array<{ company_id: string; company_name: string; contacts_count: number }>;
  registrations_over_time: Array<{ month: string; professionals: number; companies: number }>;
}

import { z } from "zod";

export const documentTypeSchema = z.enum(["V", "E", "P"]);

export const educationLevelSchema = z.enum([
  "Técnico Medio",
  "Técnico Superior",
  "Universitario",
  "Especialización",
  "Maestría",
  "Doctorado",
]);

export const jobTypeSchema = z.enum([
  "Tiempo Completo",
  "Por Proyecto",
  "Asesoría/Consultoría",
]);

export const languageLevelSchema = z.enum([
  "Basic",
  "Intermediate",
  "Advanced",
  "Native",
]);

export const professionalLanguageSchema = z.object({
  language: z.string().min(1),
  level: languageLevelSchema,
});

/** Mirrors POST /api/v1/professionals — implementation_plan.md §4.1 */
export const professionalRegistrationSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  document_type: documentTypeSchema,
  document_number: z.string().regex(/^[0-9]{5,9}$/, "Cédula o pasaporte inválido"),
  email: z.string().email(),
  phone: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  area_id: z.number().int().positive(),
  subarea_id: z.number().int().positive(),
  experience_years: z.number().int().min(0),
  last_position: z.string().min(1),
  bio_summary: z.string().min(100).max(1000),
  sector_id: z.number().int().positive(),
  education_level: educationLevelSchema,
  relocation_willing: z.boolean().default(false),
  job_types_willing: z.array(jobTypeSchema).default([]),
  immediate_availability: z.boolean().default(false),
  salary_expectation: z.number().positive().nullable().optional(),
  consent_given: z.literal(true, {
    errorMap: () => ({ message: "Consent must be accepted" }),
  }),
  captcha_token: z.string().min(1),
  languages: z.array(professionalLanguageSchema).default([]),
  certifications: z.array(z.number().int().positive()).default([]),
});

export type ProfessionalRegistrationInput = z.infer<typeof professionalRegistrationSchema>;

export const professionalCorrectionSchema = professionalRegistrationSchema.pick({
  first_name: true, last_name: true, email: true, phone: true, city: true, state: true,
  experience_years: true, last_position: true, bio_summary: true,
}).extend({ phone: z.string().min(6).max(50).optional() });
export type ProfessionalCorrectionInput = z.infer<typeof professionalCorrectionSchema>;

/** Mirrors GET /api/v1/professionals/search query params — implementation_plan.md §4.3 */
export const professionalSearchQuerySchema = z.object({
  area_id: z.coerce.number().int().positive().optional(),
  subarea_id: z.coerce.number().int().positive().optional(),
  min_experience: z.coerce.number().int().min(0).optional(),
  state: z.string().min(1).optional(),
  relocation: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  keyword: z.string().min(1).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ProfessionalSearchQuery = z.infer<typeof professionalSearchQuerySchema>;

/** Mirrors POST /api/v1/professionals/:id/contact — implementation_plan.md §4.4 */
export const contactRequestSchema = z.object({
  message: z.string().min(1).max(1000),
});

export type ContactRequestInput = z.infer<typeof contactRequestSchema>;

export const hiredStatusSchema = z.enum(["looking", "hired_via_portal", "hired_externally"]);

/** Mirrors POST /api/v1/professionals/availability/:token — implementation_plan.md §4.8 */
export const availabilityUpdateSchema = z.object({
  hired_status: hiredStatusSchema,
});

export type AvailabilityUpdateInput = z.infer<typeof availabilityUpdateSchema>;

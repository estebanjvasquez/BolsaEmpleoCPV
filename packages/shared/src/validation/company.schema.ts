import { z } from "zod";

export const energyBusinessAreaSchema = z.enum(["Oil & Gas", "Generación eléctrica", "Energías renovables", "Servicios industriales", "Ingeniería y proyectos", "Tecnología y automatización"]);
const optionalWebsiteSchema = z.union([z.literal(""), z.string().url().max(500)]).transform((value) => value || null);
export const companySectorProfileSchema = z.object({
  business_areas: z.array(energyBusinessAreaSchema).min(1, "Seleccione al menos una línea de negocio").max(6),
  energy_services: z.array(z.string().trim().min(2).max(80)).max(8).default([]),
  business_description: z.string().trim().min(100, "Describa sus actividades en al menos 100 caracteres").max(2000),
  website: optionalWebsiteSchema.optional().default(""),
});

/** Mirrors POST /api/v1/companies/register — implementation_plan.md §4.2 */
export const companyRegistrationSchema = z.object({
  name: z.string().min(1),
  rif: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  password: z.string().min(8),
}).merge(companySectorProfileSchema).extend({
  captcha_token: z.string().min(1),
});

/** Mirrors POST /api/v1/companies/login — implementation_plan.md §4.2 */
export const companyLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type CompanyRegistrationInput = z.infer<typeof companyRegistrationSchema>;
export type CompanyLoginInput = z.infer<typeof companyLoginSchema>;

export const companyProfileUpdateSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email(),
  phone: z.string().min(5).max(50),
}).merge(companySectorProfileSchema);

export const companyPasswordResetRequestSchema = z.object({ email: z.string().email() });
export const companyPasswordResetSchema = z.object({ password: z.string().min(12).max(128) });
export type CompanyProfileUpdateInput = z.infer<typeof companyProfileUpdateSchema>;

/** Mirrors POST /api/v1/companies/feedback/:contact_id — implementation_plan.md §4.9 */
export const companyFeedbackSchema = z.object({
  result: z.enum(["hired", "not_hired", "in_progress"]),
});

export type CompanyFeedbackInput = z.infer<typeof companyFeedbackSchema>;

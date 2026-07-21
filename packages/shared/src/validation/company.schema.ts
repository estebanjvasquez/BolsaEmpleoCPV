import { z } from "zod";

/** Mirrors POST /api/v1/companies/register — implementation_plan.md §4.2 */
export const companyRegistrationSchema = z.object({
  name: z.string().min(1),
  rif: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  password: z.string().min(8),
});

/** Mirrors POST /api/v1/companies/login — implementation_plan.md §4.2 */
export const companyLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type CompanyRegistrationInput = z.infer<typeof companyRegistrationSchema>;
export type CompanyLoginInput = z.infer<typeof companyLoginSchema>;

/** Mirrors POST /api/v1/companies/feedback/:contact_id — implementation_plan.md §4.9 */
export const companyFeedbackSchema = z.object({
  result: z.enum(["hired", "not_hired", "in_progress"]),
});

export type CompanyFeedbackInput = z.infer<typeof companyFeedbackSchema>;

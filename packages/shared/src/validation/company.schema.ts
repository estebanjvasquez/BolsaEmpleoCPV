import { z } from "zod";

/** Mirrors POST /api/v1/companies/register — implementation_plan.md §4.2 */
export const companyRegistrationSchema = z.object({
  name: z.string().min(1),
  rif: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  password: z.string().min(8),
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
});

export const companyPasswordResetRequestSchema = z.object({ email: z.string().email() });
export const companyPasswordResetSchema = z.object({ password: z.string().min(12).max(128) });
export type CompanyProfileUpdateInput = z.infer<typeof companyProfileUpdateSchema>;

/** Mirrors POST /api/v1/companies/feedback/:contact_id — implementation_plan.md §4.9 */
export const companyFeedbackSchema = z.object({
  result: z.enum(["hired", "not_hired", "in_progress"]),
});

export type CompanyFeedbackInput = z.infer<typeof companyFeedbackSchema>;

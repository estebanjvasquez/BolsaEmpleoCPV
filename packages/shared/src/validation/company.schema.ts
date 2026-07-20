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

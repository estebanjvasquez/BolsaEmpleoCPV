import { z } from "zod";

/** Admin login — no public registration; accounts are provisioned out-of-band. */
export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const professionalStatusUpdateSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

/** Mirrors POST /api/v1/admin/catalogs/{areas,subareas,sectors,certifications} — implementation_plan.md §11 */
export const catalogItemSchema = z.object({
  name: z.string().min(1).max(100),
});

export const subareaItemSchema = z.object({
  name: z.string().min(1).max(100),
  area_id: z.number().int().positive(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type ProfessionalStatusUpdateInput = z.infer<typeof professionalStatusUpdateSchema>;
export type CatalogItemInput = z.infer<typeof catalogItemSchema>;
export type SubareaItemInput = z.infer<typeof subareaItemSchema>;

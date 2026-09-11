import { z } from "zod";

/** Admin login — no public registration; accounts are provisioned out-of-band. */
export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const professionalStatusUpdateSchema = z
  .object({
    status: z.enum(["pending", "approved", "rejected"]),
    reason: z.string().min(10).max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "rejected" && !value.reason) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reason"], message: "Indique el motivo del rechazo" });
    }
  });

export const activeStateUpdateSchema = z.object({ is_active: z.boolean() });

export const contactModerationSchema = z.object({ action: z.enum(["send", "block"]) });
export const contactListQuerySchema = z.object({ status: z.enum(["pending_admin", "sent", "blocked"]).default("pending_admin") });

export const professionalAdminUpdateSchema = z.object({
  city: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional(),
  experience_years: z.number().int().min(0).max(60).optional(),
  last_position: z.string().min(1).max(150).optional(),
  bio_summary: z.string().min(100).max(1000).optional(),
}).refine((data) => Object.keys(data).length > 0, "Indique al menos un campo para modificar");

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

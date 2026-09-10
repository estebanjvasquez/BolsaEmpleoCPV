import { z } from "zod";

export const vacancyStatusSchema = z.enum(["pending", "approved", "rejected", "closed"]);

export const vacancyCreateSchema = z
  .object({
    title: z.string().min(5).max(150),
    description: z.string().min(80).max(5000),
    location: z.string().min(2).max(150),
    area_id: z.number().int().positive(),
    employment_type: z.enum(["Tiempo Completo", "Por Proyecto", "Asesoría/Consultoría"]),
    experience_years: z.number().int().min(0).max(60),
    salary_min: z.number().positive().nullable().optional(),
    salary_max: z.number().positive().nullable().optional(),
    deadline: z.string().date().optional(),
    external_application_url: z.string().url().max(500).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.salary_min && value.salary_max && value.salary_min > value.salary_max) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["salary_max"], message: "El máximo debe ser mayor o igual al mínimo" });
    }
  });

export const vacancyStatusUpdateSchema = z
  .object({
    status: z.enum(["approved", "rejected", "closed"]),
    reason: z.string().min(10).max(1000).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "rejected" && !value.reason) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["reason"], message: "Indique el motivo del rechazo" });
    }
  });

export type VacancyCreateInput = z.infer<typeof vacancyCreateSchema>;
export const vacancyUpdateSchema = z.object({
  title: z.string().min(5).max(150), description: z.string().min(80).max(5000), location: z.string().min(2).max(150),
  area_id: z.number().int().positive(), employment_type: z.enum(["Tiempo Completo", "Por Proyecto", "Asesoría/Consultoría"]),
  experience_years: z.number().int().min(0).max(60), salary_min: z.number().positive().nullable(), salary_max: z.number().positive().nullable(),
  deadline: z.string().date(), external_application_url: z.string().url().max(500).nullable(),
}).partial().refine((value) => Object.keys(value).length > 0, "Indique al menos un campo para actualizar");
export type VacancyUpdateInput = z.infer<typeof vacancyUpdateSchema>;

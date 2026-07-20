import type { z } from "zod";

/** Flattens Zod issues into the { field_name: message } shape (CLAUDE.md error contract). */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_root";
    if (!(key in fields)) fields[key] = issue.message;
  }
  return fields;
}

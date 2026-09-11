import type { ErrorHandler } from "hono";
import { HttpError } from "../lib/http-error";

/** Standard error shape per CLAUDE.md: { error, message, fields? } */
export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HttpError) {
    return c.json(
      { error: err.error, message: err.message, ...(err.fields ? { fields: err.fields } : {}) },
      err.status,
    );
  }
  console.error(JSON.stringify({ event: "request_failed", type: err.name }));
  return c.json(
    {
      error: "Internal Server Error",
      message: "No se pudo procesar la solicitud. Inténtelo de nuevo más tarde.",
    },
    500,
  );
};

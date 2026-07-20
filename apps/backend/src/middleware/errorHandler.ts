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
  console.error(err);
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message ?? "Unexpected error",
    },
    500,
  );
};

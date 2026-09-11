/** Thrown from services/controllers to produce the standard { error, message, fields? } shape (CLAUDE.md). */
export class HttpError extends Error {
  constructor(
    public readonly status: 400 | 401 | 403 | 404 | 409 | 410 | 422 | 429,
    public readonly error: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
  }
}

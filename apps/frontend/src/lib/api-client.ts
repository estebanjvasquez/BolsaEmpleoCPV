import type { ApiError } from "@cpv/shared";
import { readLocale } from "./i18n";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8787";

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public body: ApiError,
  ) {
    super(body.message);
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": readLocale(),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed", message: "No se pudo procesar la solicitud. Inténtelo de nuevo." })) as ApiError;
    if (res.status === 401 && typeof window !== "undefined" && new Headers(init?.headers).has("Authorization")) {
      const isAdmin = path.startsWith("/api/v1/admin");
      window.localStorage.removeItem(isAdmin ? "cpv_admin_token" : "cpv_company_token");
      window.dispatchEvent(new Event("cpv-auth"));
    }
    throw new ApiRequestError(res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

"use client";
import Link from "next/link";
import { useState } from "react";
import { companyPasswordResetRequestSchema } from "@cpv/shared";
import { apiFetch, ApiRequestError } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function submit(form: FormData) {
    const parsed = companyPasswordResetRequestSchema.safeParse({ email: form.get("email") });
    if (!parsed.success) { setMessage("Introduzca un correo válido."); return; }
    setBusy(true);
    try { const r = await apiFetch<{ message: string }>("/api/v1/companies/password-resets", { method: "POST", body: JSON.stringify(parsed.data) }); setMessage(r.message); }
    catch (e) { setMessage(e instanceof ApiRequestError ? e.body.message : "No se pudo procesar la solicitud."); }
    finally { setBusy(false); }
  }
  return <section className="mx-auto w-full max-w-lg px-margin-mobile py-12"><h1 className="font-headline text-headline-lg text-primary-container">Recuperar acceso</h1><p className="mt-4">Introduzca el correo de su empresa para recibir las instrucciones.</p><form action={submit} className="my-6 grid gap-4"><label>Correo electrónico<input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded border p-3" /></label><button disabled={busy} className="rounded bg-primary-container px-4 py-3 text-on-primary disabled:opacity-50">{busy ? "Procesando…" : "Solicitar enlace"}</button></form>{message && <p role="status" className="my-4">{message}</p>}<Link href="/company/login" className="text-primary-container underline">Volver a iniciar sesión</Link></section>;
}

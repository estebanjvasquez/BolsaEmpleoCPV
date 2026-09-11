"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { professionalCorrectionSchema, type ProfessionalCorrectionInput } from "@cpv/shared";
import { apiFetch, ApiRequestError } from "@/lib/api-client";

export default function CorrectionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [profile, setProfile] = useState<(ProfessionalCorrectionInput & { moderation_reason: string }) | null>(null);
  const [message, setMessage] = useState<string | null>(null); const [done, setDone] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => { apiFetch<ProfessionalCorrectionInput & { moderation_reason: string }>(`/api/v1/professionals/resubmissions/${encodeURIComponent(token)}`).then(setProfile).catch((e) => setMessage(e instanceof ApiRequestError ? e.body.message : "No se pudo cargar el perfil.")); }, [token]);
  async function submit(form: FormData) {
    const parsed = professionalCorrectionSchema.safeParse({ ...Object.fromEntries(form), experience_years: Number(form.get("experience_years")), phone: form.get("phone") || undefined });
    if (!parsed.success) { setMessage(parsed.error.issues.map((i) => i.message).join(". ")); return; }
    setBusy(true);
    try { const result = await apiFetch<{ message: string }>(`/api/v1/professionals/resubmissions/${encodeURIComponent(token)}`, { method: "POST", body: JSON.stringify(parsed.data) }); setMessage(result.message); setDone(true); }
    catch (e) { setMessage(e instanceof ApiRequestError ? e.body.message : "No se pudieron guardar los cambios."); }
    finally { setBusy(false); }
  }
  return <section className="mx-auto w-full max-w-2xl px-margin-mobile py-12"><h1 className="font-headline text-headline-lg text-primary-container">Corregir perfil</h1>{message && <p role="status" className="my-4 rounded border p-3">{message}</p>}{profile && !done && <><p className="my-4">Observación de la CPV: {profile.moderation_reason}</p><form action={submit} className="grid gap-4">{([
    ["first_name", "Nombre", "text"], ["last_name", "Apellido", "text"], ["email", "Correo", "email"], ["city", "Ciudad", "text"], ["state", "Estado", "text"], ["last_position", "Último cargo", "text"], ["experience_years", "Años de experiencia", "number"],
  ] as const).map(([name, label, type]) => <label key={name}>{label}<input required name={name} type={type} min={type === "number" ? 0 : undefined} defaultValue={profile[name]} className="mt-1 w-full rounded border p-3" /></label>)}<label>Teléfono nuevo (opcional)<input name="phone" type="tel" className="mt-1 w-full rounded border p-3" /></label><label>Resumen profesional<textarea required name="bio_summary" minLength={100} maxLength={1000} rows={6} defaultValue={profile.bio_summary} className="mt-1 w-full rounded border p-3" /></label><button disabled={busy} className="rounded bg-primary-container px-4 py-3 text-on-primary disabled:opacity-50">{busy ? "Guardando…" : "Guardar y reenviar a revisión"}</button></form></>}<Link href="/" className="mt-6 inline-block text-primary-container underline">Volver al inicio</Link></section>;
}

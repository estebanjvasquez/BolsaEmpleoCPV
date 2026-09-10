"use client";

import { useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api-client";

export default function ResubmissionPage({ params }: { params: Promise<{ token: string }> }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const submit = async () => { const { token } = await params; setState("loading"); try { await apiFetch(`/api/v1/professionals/resubmissions/${token}`, { method: "POST" }); setState("done"); } catch (error) { setState("error"); } };
  return <section className="mx-auto flex max-w-xl flex-1 flex-col justify-center px-margin-mobile py-24"><h1 className="font-headline text-headline-lg text-primary-container">Reenviar perfil a revisión</h1><p className="mt-3 font-body text-body-md text-on-surface-variant">Al confirmar, su perfil volverá a la cola de moderación de la Cámara Petrolera.</p>{state === "done" ? <p className="mt-6 rounded border border-secondary-fixed bg-secondary-fixed px-4 py-3 font-body text-body-md text-on-secondary-fixed">Perfil reenviado correctamente.</p> : <><button type="button" onClick={submit} disabled={state === "loading"} className="mt-8 rounded-full bg-primary-container px-6 py-3 font-label text-label-md text-on-primary disabled:opacity-50">{state === "loading" ? "Reenviando…" : "Reenviar a revisión"}</button>{state === "error" && <p className="mt-4 font-body text-body-sm text-error">El enlace no es válido o expiró. Solicite una nueva revisión al equipo CPV.</p>}</>}</section>;
}

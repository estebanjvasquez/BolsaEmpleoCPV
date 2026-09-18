"use client";

import Link from "next/link";
import { useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api-client";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const [message, setMessage] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  const submit = async (form: FormData) => {
    const password = String(form.get("password"));
    if (password.length < 12) {
      setMessage("Use al menos 12 caracteres.");
      return;
    }

    try {
      const { token } = await params;
      await apiFetch(`/api/v1/companies/password-resets/${encodeURIComponent(token.trim())}`, {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setCompleted(true);
      setMessage("Contraseña actualizada correctamente.");
    } catch (error) {
      setMessage(error instanceof ApiRequestError ? error.body.message : "El enlace no es válido o expiró.");
    }
  };

  return (
    <section className="mx-auto max-w-md px-margin-mobile py-20">
      <h1 className="font-headline text-headline-lg text-primary-container">Restablecer acceso</h1>
      <p className="mt-3 font-body text-body-sm text-on-surface-variant">El enlace dura una hora. Si solicitó más de uno, solo el correo más reciente es válido.</p>
      {completed ? (
        <div className="mt-6 rounded-xl border border-border-subtle bg-surface-container-lowest p-6">
          <p className="font-body text-body-md text-on-surface">{message}</p>
          <p className="mt-2 font-body text-body-sm text-on-surface-variant">Ingrese con el correo registrado de la empresa y la nueva contraseña.</p>
          <Link href="/company/login" className="mt-5 inline-flex rounded-full bg-primary-container px-5 py-3 font-label text-label-md text-on-primary">Ir a iniciar sesión</Link>
        </div>
      ) : (
        <form action={submit} className="mt-6 grid gap-4">
          <input name="password" type="password" minLength={12} required placeholder="Nueva contraseña" className="rounded border border-outline-variant px-3 py-2" />
          <button className="rounded-full bg-primary-container px-5 py-3 font-label text-on-primary">Guardar contraseña</button>
          {message && <p className="font-body text-body-sm text-error">{message}</p>}
        </form>
      )}
    </section>
  );
}

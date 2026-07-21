"use client";

import { use, useEffect, useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api-client";

interface AvailabilityInfo {
  first_name: string;
  last_name: string;
  hired_status: "looking" | "hired_via_portal" | "hired_externally";
}

export default function AvailabilityPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [info, setInfo] = useState<AvailabilityInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AvailabilityInfo>(`/api/v1/professionals/availability/${token}`)
      .then(setInfo)
      .catch((err) => {
        setError(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
      });
  }, [token]);

  const update = async (hired_status: AvailabilityInfo["hired_status"]) => {
    setBusy(true);
    setError(null);
    try {
      const result = await apiFetch<{ message: string }>(`/api/v1/professionals/availability/${token}`, {
        method: "POST",
        body: JSON.stringify({ hired_status }),
      });
      setConfirmation(result.message);
      setInfo((prev) => (prev ? { ...prev, hired_status } : prev));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <section className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-margin-mobile py-24 text-center">
        <h1 className="font-headline text-headline-lg text-primary-container">Enlace no válido</h1>
        <p className="mt-4 font-body text-body-md text-on-surface-variant">{error}</p>
      </section>
    );
  }

  if (!info) {
    return (
      <section className="mx-auto flex flex-1 flex-col items-center justify-center px-margin-mobile py-24 text-center">
        <p className="font-body text-body-md text-on-surface-variant">Cargando…</p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-margin-mobile py-24 text-center">
      <h1 className="font-headline text-headline-lg text-primary-container">
        Hola, {info.first_name} {info.last_name}
      </h1>
      <p className="mt-4 font-body text-body-md text-on-surface-variant">
        {info.hired_status === "looking"
          ? "Su perfil está activo y visible para las empresas registradas."
          : "Su perfil está marcado como contratado y no aparece en las búsquedas de empresas."}
      </p>

      {confirmation ? (
        <p className="mt-6 rounded-xl border border-border-subtle bg-surface-container-lowest px-6 py-4 font-body text-body-sm text-on-surface">
          {confirmation}
        </p>
      ) : (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {info.hired_status === "looking" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => update("hired_via_portal")}
              className="rounded-full bg-primary-container px-8 py-3.5 font-headline text-headline-md text-on-primary transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Ya conseguí empleo
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => update("looking")}
              className="rounded-full bg-secondary-container px-8 py-3.5 font-headline text-headline-md text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Sigo buscando — reactivar mi perfil
            </button>
          )}
        </div>
      )}
    </section>
  );
}

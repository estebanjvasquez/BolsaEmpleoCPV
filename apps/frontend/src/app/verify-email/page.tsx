"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch, ApiRequestError } from "@/lib/api-client";

type VerificationState = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const [state, setState] = useState<VerificationState>("loading");
  const [message, setMessage] = useState("Validando su correo electrónico...");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("El enlace de verificación no incluye un token válido.");
      return;
    }

    apiFetch<{ message: string }>(`/api/v1/professionals/verify/${encodeURIComponent(token)}`)
      .then((result) => {
        setState("success");
        setMessage(result.message);
      })
      .catch((err) => {
        setState("error");
        setMessage(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
      });
  }, [token]);

  return (
    <section className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-margin-mobile py-24 text-center">
      <p className="mb-4 font-label text-label-sm uppercase tracking-wide text-secondary-container">
        Verificación de perfil
      </p>
      <h1 className="font-headline text-headline-lg text-primary-container">
        {state === "success" ? "Correo verificado" : state === "error" ? "Enlace no válido" : "Verificando correo"}
      </h1>
      <p className="mt-4 font-body text-body-md text-on-surface-variant">{message}</p>

      {state !== "loading" ? (
        <Link
          href="/"
          className="mt-8 rounded-full bg-primary-container px-8 py-3.5 font-headline text-headline-md text-on-primary transition-opacity hover:opacity-90"
        >
          Volver al inicio
        </Link>
      ) : null}
    </section>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <section className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-margin-mobile py-24 text-center">
          <p className="font-body text-body-md text-on-surface-variant">Cargando...</p>
        </section>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

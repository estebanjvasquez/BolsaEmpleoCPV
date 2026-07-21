"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema, type AdminLoginInput } from "@cpv/shared";
import { apiFetch, ApiRequestError } from "@/lib/api-client";
import { setAdminToken } from "@/lib/admin-auth";
import { PasswordInput } from "@/components/password-input";

const inputClass =
  "w-full rounded border border-outline-variant bg-surface-container-lowest px-4 py-2.5 font-body text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container";
const labelClass = "mb-1.5 block font-label text-label-md text-on-surface-variant";
const errorClass = "mt-1 font-body text-body-sm text-error";

export default function AdminLoginPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AdminLoginInput>({ resolver: zodResolver(adminLoginSchema) });

  const onSubmit = async (data: AdminLoginInput) => {
    setServerError(null);
    try {
      const result = await apiFetch<{ token: string }>("/api/v1/admin/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setAdminToken(result.token);
      router.push("/admin");
    } catch (err) {
      setServerError(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-margin-mobile py-24">
      <h1 className="font-headline text-headline-lg text-primary-container">Panel de Administración</h1>
      <p className="mt-2 font-body text-body-md text-on-surface-variant">
        Acceso exclusivo para personal de la Cámara Petrolera de Venezuela.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-container-lowest p-6"
      >
        <div>
          <label className={labelClass}>Correo Electrónico</label>
          <input type="email" className={inputClass} {...register("email")} />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Contraseña</label>
          <PasswordInput className={inputClass} {...register("password")} />
          {errors.password && <p className={errorClass}>{errors.password.message}</p>}
        </div>

        {serverError && <p className={errorClass}>{serverError}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-full bg-primary-container px-8 py-3.5 font-headline text-headline-md text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </section>
  );
}

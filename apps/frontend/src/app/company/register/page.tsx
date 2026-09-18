"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companyRegistrationSchema, type CompanyRegistrationInput } from "@cpv/shared";
import { apiFetch, ApiRequestError } from "@/lib/api-client";
import { PasswordInput } from "@/components/password-input";
import { TurnstileWidget } from "@/components/turnstile-widget";

const inputClass =
  "w-full rounded border border-outline-variant bg-surface-container-lowest px-4 py-2.5 font-body text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container";
const labelClass = "mb-1.5 block font-label text-label-md text-on-surface-variant";
const errorClass = "mt-1 font-body text-body-sm text-error";
const businessAreas = ["Oil & Gas", "Generación eléctrica", "Energías renovables", "Servicios industriales", "Ingeniería y proyectos", "Tecnología y automatización"] as const;

export default function CompanyRegisterPage() {
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success">("idle");
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaRefresh, setCaptchaRefresh] = useState(0);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CompanyRegistrationInput>({
    resolver: zodResolver(companyRegistrationSchema),
    defaultValues: { business_areas: [], energy_services: [], website: "" },
  });

  const onVerify = useCallback((token: string) => {
    setCaptchaToken(token);
    setValue("captcha_token", token, { shouldValidate: true });
  }, [setValue]);

  const onSubmit = async (data: CompanyRegistrationInput) => {
    setServerError(null);
    setSubmitState("loading");
    try {
      const result = await apiFetch<{ id: string; message: string }>("/api/v1/companies/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setSuccessMessage(result.message);
      setSubmitState("success");
    } catch (err) {
      onVerify("");
      setCaptchaRefresh((value) => value + 1);
      setSubmitState("idle");
      if (err instanceof ApiRequestError) {
        setServerError(err.body.message);
        for (const [field, message] of Object.entries(err.body.fields ?? {})) {
          setError(field as keyof CompanyRegistrationInput, { message });
        }
      } else {
        setServerError("No se pudo conectar con el servidor. Intente de nuevo.");
      }
    }
  };

  if (submitState === "success") {
    return (
      <section className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-margin-mobile py-24 text-center">
        <h1 className="font-headline text-headline-lg text-primary-container">¡Registro recibido!</h1>
        <p className="mt-4 font-body text-body-lg text-on-surface-variant">{successMessage}</p>
        <Link href="/company/login" className="mt-6 underline">Volver a iniciar sesión</Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-xl px-margin-mobile py-16 md:py-20">
      <h1 className="font-headline text-headline-lg-mobile text-primary-container md:text-headline-lg">
        Registro de Empresa
      </h1>
      <p className="mt-3 font-body text-body-md text-on-surface-variant">
        Cree su cuenta para buscar profesionales del sector petrolero. Un administrador de la Cámara Petrolera
        deberá aprobar su cuenta antes de poder realizar búsquedas.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-8 flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface-container-lowest p-6 md:p-8"
      >
        <div>
          <label className={labelClass}>Razón Social</label>
          <input className={inputClass} {...register("name")} />
          {errors.name && <p className={errorClass}>{errors.name.message}</p>}
        </div>
        <div>
          <label className={labelClass}>RIF</label>
          <input placeholder="J-31234567-8" className={inputClass} {...register("rif")} />
          {errors.rif && <p className={errorClass}>{errors.rif.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Correo Electrónico</label>
          <input type="email" className={inputClass} {...register("email")} />
          {errors.email && <p className={errorClass}>{errors.email.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Teléfono</label>
          <input placeholder="+58 261 7000000" className={inputClass} {...register("phone")} />
          {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
        </div>
        <fieldset>
          <legend className={labelClass}>Líneas de negocio relacionadas con energía</legend>
          <div className="grid gap-2 sm:grid-cols-2">{businessAreas.map((area) => <label key={area} className="flex items-center gap-2 font-body text-body-sm"><input type="checkbox" value={area} {...register("business_areas")} />{area}</label>)}</div>
          {errors.business_areas && <p className={errorClass}>{errors.business_areas.message}</p>}
        </fieldset>
        <div>
          <label className={labelClass}>Servicios o capacidades técnicas</label>
          <input placeholder="Ej.: mantenimiento de pozos, SCADA, ingeniería EPC" className={inputClass} onChange={(event) => setValue("energy_services", event.target.value.split(",").map((value) => value.trim()).filter(Boolean), { shouldValidate: true })} />
          <p className="mt-1 font-body text-body-sm text-on-surface-variant">Separe los servicios con comas.</p>
          {errors.energy_services && <p className={errorClass}>{errors.energy_services.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Descripción de actividades y experiencia sectorial</label>
          <textarea rows={5} className={inputClass} {...register("business_description")} />
          {errors.business_description && <p className={errorClass}>{errors.business_description.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Sitio web (opcional)</label>
          <input type="url" placeholder="https://empresa.com" className={inputClass} {...register("website")} />
          {errors.website && <p className={errorClass}>{errors.website.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Contraseña</label>
          <PasswordInput className={inputClass} {...register("password")} />
          {errors.password && <p className={errorClass}>{errors.password.message}</p>}
        </div>

        {serverError && <p className={errorClass}>{serverError}</p>}
        <TurnstileWidget key={captchaRefresh} action="company_signup" siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""} onVerify={onVerify} />
        {errors.captcha_token && <p className={errorClass}>{errors.captcha_token.message}</p>}

        <button
          type="submit"
          disabled={isSubmitting || submitState === "loading" || !captchaToken}
          className="mt-2 w-full rounded-full bg-primary-container px-8 py-4 font-headline text-headline-md text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitState === "loading" ? "Enviando…" : "Crear Cuenta"}
        </button>
      </form>
    </section>
  );
}

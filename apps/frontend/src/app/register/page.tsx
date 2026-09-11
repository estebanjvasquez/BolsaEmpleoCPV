"use client";

import { useCallback, useEffect, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  documentTypeSchema,
  educationLevelSchema,
  jobTypeSchema,
  languageLevelSchema,
  professionalRegistrationSchema,
  type ProfessionalRegistrationInput,
} from "@cpv/shared";
import { apiFetch, ApiRequestError } from "@/lib/api-client";
import { TurnstileWidget } from "@/components/turnstile-widget";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

interface Catalogs {
  areas: { id: number; name: string }[];
  subareas: { id: number; area_id: number; name: string }[];
  sectors: { id: number; name: string }[];
  certifications: { id: number; name: string }[];
  states: { name: string; cities: string[] }[];
}

const LEVEL_LABELS: Record<string, string> = {
  Basic: "Básico",
  Intermediate: "Intermedio",
  Advanced: "Avanzado",
  Native: "Nativo",
};

const inputClass =
  "w-full rounded border border-outline-variant bg-surface-container-lowest px-4 py-2.5 font-body text-body-md text-on-surface focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container";
const labelClass = "mb-1.5 block font-label text-label-md text-on-surface-variant";
const errorClass = "mt-1 font-body text-body-sm text-error";
const sectionClass = "rounded-xl border border-border-subtle bg-surface-container-lowest p-6 md:p-8";

export default function RegisterPage() {
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [catalogsError, setCatalogsError] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaRefresh, setCaptchaRefresh] = useState(0);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success">("idle");
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Catalogs>("/api/v1/catalogs")
      .then(setCatalogs)
      .catch(() => setCatalogsError(true));
  }, []);

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfessionalRegistrationInput>({
    resolver: zodResolver(professionalRegistrationSchema),
    defaultValues: {
      relocation_willing: false,
      job_types_willing: [],
      immediate_availability: false,
      languages: [],
      certifications: [],
    },
  });

  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control,
    name: "languages",
  });

  const selectedAreaId = useWatch({ control, name: "area_id" });
  const selectedState = useWatch({ control, name: "state" });

  const handleVerify = useCallback(
    (token: string) => {
      setCaptchaToken(token);
      setValue("captcha_token", token, { shouldValidate: true });
    },
    [setValue],
  );

  const onSubmit = async (data: ProfessionalRegistrationInput) => {
    setServerError(null);
    setSubmitState("loading");
    try {
      const result = await apiFetch<{ id: string; status: string; message: string }>("/api/v1/professionals", {
        method: "POST",
        body: JSON.stringify({ ...data, captcha_token: captchaToken }),
      });
      setSuccessMessage(result.message);
      setSubmitState("success");
    } catch (err) {
      handleVerify("");
      setCaptchaRefresh((value) => value + 1);
      setSubmitState("idle");
      if (err instanceof ApiRequestError) {
        setServerError(err.body.message);
        for (const [field, message] of Object.entries(err.body.fields ?? {})) {
          setError(field as keyof ProfessionalRegistrationInput, { message });
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
      </section>
    );
  }

  const cities = catalogs?.states.find((s) => s.name === selectedState)?.cities ?? [];
  const subareas = catalogs?.subareas.filter((s) => s.area_id === Number(selectedAreaId)) ?? [];

  return (
    <section className="mx-auto w-full max-w-3xl px-margin-mobile py-16 md:py-20">
      <h1 className="font-headline text-headline-lg-mobile text-primary-container md:text-headline-lg">
        Registro de Profesionales
      </h1>
      <p className="mt-3 font-body text-body-md text-on-surface-variant">
        Complete su perfil para ser visible ante las empresas afiliadas a la Cámara Petrolera de Venezuela.
      </p>

      {catalogsError && (
        <p className="mt-6 rounded border border-error-container bg-error-container px-4 py-3 font-body text-body-sm text-on-error-container">
          No se pudieron cargar los catálogos. Recargue la página.
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-8">
        {/* Datos personales */}
        <fieldset className={sectionClass}>
          <legend className="mb-4 font-headline text-headline-md text-primary-container">Datos Personales</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Nombre</label>
              <input className={inputClass} {...register("first_name")} />
              {errors.first_name && <p className={errorClass}>{errors.first_name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Apellido</label>
              <input className={inputClass} {...register("last_name")} />
              {errors.last_name && <p className={errorClass}>{errors.last_name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Tipo de Documento</label>
              <select className={inputClass} {...register("document_type")}>
                {documentTypeSchema.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errors.document_type && <p className={errorClass}>{errors.document_type.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Número de Documento</label>
              <input className={inputClass} placeholder="12345678" {...register("document_number")} />
              {errors.document_number && <p className={errorClass}>{errors.document_number.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Correo Electrónico</label>
              <input type="email" className={inputClass} {...register("email")} />
              {errors.email && <p className={errorClass}>{errors.email.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input placeholder="+58 412 1234567" className={inputClass} {...register("phone")} />
              {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <select className={inputClass} {...register("state")}>
                <option value="">Seleccione…</option>
                {catalogs?.states.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.state && <p className={errorClass}>{errors.state.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Ciudad</label>
              <select className={inputClass} {...register("city")} disabled={!selectedState}>
                <option value="">Seleccione…</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.city && <p className={errorClass}>{errors.city.message}</p>}
            </div>
          </div>
        </fieldset>

        {/* Perfil profesional */}
        <fieldset className={sectionClass}>
          <legend className="mb-4 font-headline text-headline-md text-primary-container">Perfil Profesional</legend>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Área</label>
              <select className={inputClass} {...register("area_id", { valueAsNumber: true })}>
                <option value="">Seleccione…</option>
                {catalogs?.areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              {errors.area_id && <p className={errorClass}>{errors.area_id.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Subárea</label>
              <select
                className={inputClass}
                disabled={!selectedAreaId}
                {...register("subarea_id", { valueAsNumber: true })}
              >
                <option value="">Seleccione…</option>
                {subareas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.subarea_id && <p className={errorClass}>{errors.subarea_id.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Sector</label>
              <select className={inputClass} {...register("sector_id", { valueAsNumber: true })}>
                <option value="">Seleccione…</option>
                {catalogs?.sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.sector_id && <p className={errorClass}>{errors.sector_id.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Años de Experiencia</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                {...register("experience_years", { valueAsNumber: true })}
              />
              {errors.experience_years && <p className={errorClass}>{errors.experience_years.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Nivel Educativo</label>
              <select className={inputClass} {...register("education_level")}>
                {educationLevelSchema.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {errors.education_level && <p className={errorClass}>{errors.education_level.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Último Cargo</label>
              <input className={inputClass} {...register("last_position")} />
              {errors.last_position && <p className={errorClass}>{errors.last_position.message}</p>}
            </div>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Resumen Profesional (100–1000 caracteres)</label>
            <textarea rows={5} className={inputClass} {...register("bio_summary")} />
            {errors.bio_summary && <p className={errorClass}>{errors.bio_summary.message}</p>}
          </div>
        </fieldset>

        {/* Preferencias */}
        <fieldset className={sectionClass}>
          <legend className="mb-4 font-headline text-headline-md text-primary-container">Preferencias</legend>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 font-body text-body-md">
              <input type="checkbox" className="h-4 w-4" {...register("relocation_willing")} />
              Dispuesto/a a reubicarse
            </label>
            <label className="flex items-center gap-2 font-body text-body-md">
              <input type="checkbox" className="h-4 w-4" {...register("immediate_availability")} />
              Disponibilidad inmediata
            </label>
          </div>
          <div className="mt-4">
            <label className={labelClass}>Tipo de Empleo Deseado</label>
            <div className="flex flex-wrap gap-4">
              {jobTypeSchema.options.map((opt) => (
                <label key={opt} className="flex items-center gap-2 font-body text-body-sm">
                  <input type="checkbox" value={opt} className="h-4 w-4" {...register("job_types_willing")} />
                  {opt}
                </label>
              ))}
            </div>
          </div>
          <div className="mt-4 max-w-xs">
            <label className={labelClass}>Expectativa Salarial (USD, opcional)</label>
            <input
              type="number"
              min={0}
              className={inputClass}
              {...register("salary_expectation", {
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
            />
            {errors.salary_expectation && <p className={errorClass}>{errors.salary_expectation.message}</p>}
          </div>
        </fieldset>

        {/* Idiomas */}
        <fieldset className={sectionClass}>
          <legend className="mb-4 font-headline text-headline-md text-primary-container">Idiomas</legend>
          <div className="flex flex-col gap-3">
            {languageFields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap items-end gap-3">
                <div className="flex-1 min-w-[140px]">
                  <label className={labelClass}>Idioma</label>
                  <input className={inputClass} {...register(`languages.${index}.language` as const)} />
                </div>
                <div className="w-40">
                  <label className={labelClass}>Nivel</label>
                  <select className={inputClass} {...register(`languages.${index}.level` as const)}>
                    {languageLevelSchema.options.map((opt) => (
                      <option key={opt} value={opt}>
                        {LEVEL_LABELS[opt]}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeLanguage(index)}
                  className="mb-0.5 rounded border border-outline-variant px-3 py-2.5 font-body text-body-sm text-on-surface-variant hover:bg-surface-container"
                >
                  Quitar
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => appendLanguage({ language: "", level: "Basic" })}
              className="self-start font-label text-label-md text-secondary hover:underline"
            >
              + Agregar idioma
            </button>
          </div>
        </fieldset>

        {/* Certificaciones */}
        <fieldset className={sectionClass}>
          <legend className="mb-4 font-headline text-headline-md text-primary-container">Certificaciones</legend>
          <Controller
            control={control}
            name="certifications"
            render={({ field }) => (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {catalogs?.certifications.map((cert) => {
                  const checked = field.value?.includes(cert.id) ?? false;
                  return (
                    <label key={cert.id} className="flex items-center gap-2 font-body text-body-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={checked}
                        onChange={(e) => {
                          const current = field.value ?? [];
                          field.onChange(
                            e.target.checked ? [...current, cert.id] : current.filter((id) => id !== cert.id),
                          );
                        }}
                      />
                      {cert.name}
                    </label>
                  );
                })}
              </div>
            )}
          />
        </fieldset>

        {/* Consentimiento + captcha */}
        <fieldset className={sectionClass}>
          <label className="flex items-start gap-3 font-body text-body-sm text-on-surface-variant">
            <input type="checkbox" className="mt-1 h-4 w-4" {...register("consent_given")} />
            Autorizo a la Cámara Petrolera de Venezuela a tratar mis datos personales para fines de intermediación
            laboral, conforme a los términos de privacidad.
          </label>
          {errors.consent_given && <p className={errorClass}>{errors.consent_given.message}</p>}

          <div className="mt-6">
            <TurnstileWidget key={captchaRefresh} action="professional_signup" siteKey={TURNSTILE_SITE_KEY} onVerify={handleVerify} />
          </div>

          {serverError && <p className={`${errorClass} mt-4`}>{serverError}</p>}

          <button
            type="submit"
            disabled={isSubmitting || submitState === "loading" || !captchaToken}
            className="mt-6 w-full rounded-full bg-primary-container px-8 py-4 font-headline text-headline-md text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {submitState === "loading" ? "Enviando…" : "Completar Registro"}
          </button>
        </fieldset>
      </form>
    </section>
  );
}

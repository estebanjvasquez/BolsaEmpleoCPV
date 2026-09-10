"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";

interface Vacancy { id: string; title: string; description: string; location: string; area: string; employment_type: string; experience_years: number; company_name?: string; deadline: string | null }

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState<Vacancy[] | null>(null);
  useEffect(() => { apiFetch<{ data: Vacancy[] }>("/api/v1/vacancies").then((r) => setVacancies(r.data)).catch(() => setVacancies([])); }, []);
  return <section className="mx-auto w-full max-w-container-max px-margin-mobile py-16 md:px-margin-desktop">
    <h1 className="font-headline text-headline-lg text-primary-container">Vacantes del sector petrolero</h1>
    <p className="mt-3 font-body text-body-md text-on-surface-variant">Oportunidades aprobadas por la Cámara Petrolera de Venezuela.</p>
    {vacancies === null ? <p className="mt-8 font-body text-body-md text-on-surface-variant">Cargando vacantes…</p> : vacancies.length === 0 ? <p className="mt-8 rounded-xl border border-border-subtle p-6 font-body text-body-md text-on-surface-variant">No hay vacantes activas por ahora.</p> : <div className="mt-8 grid gap-4 md:grid-cols-2">{vacancies.map((v) => <article key={v.id} className="rounded-xl border border-border-subtle bg-surface-container-lowest p-6"><p className="font-label text-label-sm text-secondary">{v.area} · {v.employment_type}</p><h2 className="mt-2 font-headline text-headline-md text-primary-container">{v.title}</h2><p className="mt-1 font-body text-body-sm text-on-surface-variant">{v.company_name} · {v.location} · {v.experience_years} años de experiencia</p><p className="mt-4 line-clamp-4 font-body text-body-md text-on-surface">{v.description}</p>{v.deadline && <p className="mt-4 font-label text-label-sm text-on-surface-variant">Cierre: {v.deadline}</p>}</article>)}</div>}
  </section>;
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiRequestError } from "@/lib/api-client";
import { getCompanyToken } from "@/lib/company-auth";

interface Profile { name: string; rif: string; email: string; phone: string; businessAreas: string[]; energyServices: string[]; businessDescription: string | null; website: string | null }
const input = "mt-1 w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-body-md";
const businessAreas = ["Oil & Gas", "Generación eléctrica", "Energías renovables", "Servicios industriales", "Ingeniería y proyectos", "Tecnología y automatización"];

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null); const [message, setMessage] = useState<string | null>(null);
  const headers = () => ({ Authorization: `Bearer ${getCompanyToken()}` });
  useEffect(() => { apiFetch<Profile>("/api/v1/companies/me", { headers: headers() }).then(setProfile).catch(() => setMessage("No fue posible cargar el perfil.")); }, []);
  const save = async (form: FormData) => {
    try {
      const payload = { name: String(form.get("name") ?? ""), email: String(form.get("email") ?? ""), phone: String(form.get("phone") ?? ""), business_areas: form.getAll("business_areas"), energy_services: String(form.get("energy_services") ?? "").split(",").map((value) => value.trim()).filter(Boolean), business_description: String(form.get("business_description") ?? ""), website: String(form.get("website") ?? "") };
      const updated = await apiFetch<Profile>("/api/v1/companies/me", { method: "PATCH", headers: headers(), body: JSON.stringify(payload) }); setProfile({ ...profile!, ...updated }); setMessage("Perfil actualizado.");
    } catch (error) { setMessage(error instanceof ApiRequestError ? error.body.message : "No se pudo actualizar el perfil."); }
  };
  if (!profile) return <section className="mx-auto max-w-xl px-margin-mobile py-16 font-body text-on-surface-variant">{message ?? "Cargando…"}</section>;
  return <section className="mx-auto max-w-xl px-margin-mobile py-12"><div className="flex justify-between"><h1 className="font-headline text-headline-lg text-primary-container">Perfil de empresa</h1><Link href="/company/vacancies" className="font-label text-label-md text-primary-container">Vacantes</Link></div>{message && <p className="mt-4 rounded border border-border-subtle p-3 font-body text-body-sm">{message}</p>}<form action={save} className="mt-6 grid gap-4 rounded-xl border border-border-subtle p-6"><label className="font-label text-label-sm">Razón social<input name="name" defaultValue={profile.name} className={input} /></label><label className="font-label text-label-sm">RIF<input disabled value={profile.rif} className={`${input} opacity-60`} /></label><label className="font-label text-label-sm">Correo<input name="email" type="email" defaultValue={profile.email} className={input} /></label><label className="font-label text-label-sm">Teléfono<input name="phone" defaultValue={profile.phone} className={input} /></label><fieldset><legend className="font-label text-label-sm">Líneas de negocio</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{businessAreas.map((area) => <label key={area} className="flex items-center gap-2 font-body text-body-sm"><input name="business_areas" type="checkbox" value={area} defaultChecked={profile.businessAreas.includes(area)} />{area}</label>)}</div></fieldset><label className="font-label text-label-sm">Servicios o capacidades técnicas<input name="energy_services" defaultValue={profile.energyServices.join(", ")} className={input} /></label><label className="font-label text-label-sm">Descripción de actividades<textarea name="business_description" rows={5} defaultValue={profile.businessDescription ?? ""} className={input} /></label><label className="font-label text-label-sm">Sitio web<input name="website" type="url" defaultValue={profile.website ?? ""} className={input} /></label><button className="rounded-full bg-primary-container px-5 py-3 font-label text-label-md text-on-primary">Guardar cambios</button></form></section>;
}

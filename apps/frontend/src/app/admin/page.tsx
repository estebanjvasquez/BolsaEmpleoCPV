"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CompanyStatus, ProfessionalStatus } from "@cpv/shared";
import { apiFetch, ApiRequestError } from "@/lib/api-client";
import { clearAdminToken, getAdminToken } from "@/lib/admin-auth";
import { CatalogSection } from "@/components/catalog-editor";

interface Catalogs {
  areas: { id: number; name: string }[];
  subareas: { id: number; area_id: number; name: string }[];
  sectors: { id: number; name: string }[];
  certifications: { id: number; name: string }[];
}

interface AdminProfessional {
  id: string;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  email: string;
  email_verified: boolean;
  phone: string;
  status: ProfessionalStatus;
  is_active: boolean;
  created_at: string;
  city: string; state: string; experience_years: number; last_position: string; bio_summary: string; education_level: string;
  relocation_willing: boolean; immediate_availability: boolean; job_types_willing: string[]; sector: string; area: string; subarea: string; certifications: string[]; languages: string[];
  sector_fit: SectorFit;
}

interface SectorFit { score: number; band: "Alta" | "Media" | "Inicial"; signals: string[]; considerations: string[] }

interface AdminCompany {
  id: string;
  name: string;
  rif: string;
  email: string;
  phone: string;
  is_verified: boolean;
  is_active: boolean;
  status: CompanyStatus;
  created_at: string;
  business_areas: string[]; energy_services: string[]; business_description: string | null; website: string | null; sector_fit: SectorFit;
}

interface AdminVacancy {
  id: string; title: string; description: string; company_name?: string; area: string; location: string;
  status: "pending" | "approved" | "rejected" | "closed"; moderation_reason: string | null;
}

const STATUS_TABS: { value: ProfessionalStatus; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobados" },
  { value: "rejected", label: "Rechazados" },
];

const STATUS_BADGE: Record<ProfessionalStatus, string> = {
  pending: "bg-secondary-fixed text-on-secondary-fixed",
  approved: "bg-secondary-container text-white",
  rejected: "bg-error-container text-on-error-container",
};

const COMPANY_STATUS_TABS: { value: CompanyStatus; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "approved", label: "Aprobadas" },
  { value: "rejected", label: "Rechazadas" },
];

const COMPANY_STATUS_BADGE: Record<CompanyStatus, string> = {
  pending: "bg-secondary-fixed text-on-secondary-fixed",
  approved: "bg-secondary-container text-white",
  rejected: "bg-error-container text-on-error-container",
};

function SectorFitBadge({ fit }: { fit: SectorFit }) {
  const color = fit.band === "Alta" ? "bg-secondary-container text-white" : fit.band === "Media" ? "bg-secondary-fixed text-on-secondary-fixed" : "bg-surface-container text-on-surface-variant";
  return <div><span className={`rounded-full px-2.5 py-1 font-label text-label-sm ${color}`}>{fit.score}% · {fit.band}</span><p className="mt-1 font-body text-xs text-on-surface-variant">Afinidad estimada, no decisión automática</p></div>;
}

function AdminContent() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedTab = params.get("tab");
  const tab = selectedTab === "companies" || selectedTab === "vacancies" || selectedTab === "catalogs" ? selectedTab : "moderation";
  const [status, setStatus] = useState<ProfessionalStatus>("pending");
  const [items, setItems] = useState<AdminProfessional[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [companies, setCompanies] = useState<AdminCompany[] | null>(null);
  const [companyStatus, setCompanyStatus] = useState<CompanyStatus>("pending");
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [companyActionId, setCompanyActionId] = useState<string | null>(null);
  const [vacancyStatus, setVacancyStatus] = useState<AdminVacancy["status"]>("pending");
  const [vacancies, setVacancies] = useState<AdminVacancy[] | null>(null);
  const [vacancyError, setVacancyError] = useState<string | null>(null);

  const loadCatalogs = () => {
    apiFetch<Catalogs>("/api/v1/catalogs").then(setCatalogs).catch(() => undefined);
  };

  useEffect(() => {
    if (tab === "catalogs" && catalogs === null) loadCatalogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadCompanies = useCallback((selectedStatus = companyStatus) => {
    const token = getAdminToken();
    if (!token) return;
    apiFetch<{ data: AdminCompany[] }>(`/api/v1/admin/companies?status=${selectedStatus}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => { setCompanies(res.data); setCompaniesError(null); })
      .catch((err) => {
        setCompaniesError(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
      });
  }, [companyStatus]);

  const loadVacancies = useCallback((selectedStatus = vacancyStatus) => {
    const token = getAdminToken();
    if (!token) return;
    apiFetch<{ data: AdminVacancy[] }>(`/api/v1/admin/vacancies?status=${selectedStatus}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => { setVacancies(res.data); setVacancyError(null); })
      .catch((err) => setVacancyError(err instanceof ApiRequestError ? err.body.message : "No se pudieron cargar las vacantes."));
  }, [vacancyStatus]);

  useEffect(() => {
    if (tab === "companies") {
      loadCompanies();
    }
  }, [tab, loadCompanies]);

  useEffect(() => { if (tab === "vacancies") loadVacancies(); }, [tab, loadVacancies]);

  const updateVacancyStatus = async (id: string, nextStatus: "approved" | "rejected" | "closed") => {
    const token = getAdminToken(); if (!token) return;
    const reason = nextStatus === "rejected" ? window.prompt("Indique el motivo del rechazo (mínimo 10 caracteres):")?.trim() : undefined;
    if (nextStatus === "rejected" && (!reason || reason.length < 10)) { setVacancyError("El rechazo requiere una observación de al menos 10 caracteres."); return; }
    try { await apiFetch(`/api/v1/admin/vacancies/${id}/status`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: nextStatus, reason }) }); setVacancies((prev) => prev?.filter((v) => v.id !== id) ?? null); }
    catch (err) { setVacancyError(err instanceof ApiRequestError ? err.body.message : "No se pudo actualizar la vacante."); }
  };

  const updateCompanyStatus = async (id: string, nextStatus: Extract<CompanyStatus, "approved" | "rejected">) => {
    const token = getAdminToken();
    if (!token) return;
    setCompanyActionId(id);
    try {
      await apiFetch(`/api/v1/admin/companies/${id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus }),
      });
      setCompanies((prev) => prev?.filter((c) => c.id !== id) ?? null);
    } catch (err) {
      setCompaniesError(err instanceof ApiRequestError ? err.body.message : "No se pudo actualizar la empresa.");
    } finally {
      setCompanyActionId(null);
    }
  };

  const setCompanyActive = async (id: string, isActive: boolean) => {
    const token = getAdminToken(); if (!token) return;
    try { await apiFetch(`/api/v1/admin/companies/${id}/active`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ is_active: isActive }) }); setCompanies((prev) => prev?.map((company) => company.id === id ? { ...company, is_active: isActive } : company) ?? null); }
    catch (err) { setCompaniesError(err instanceof ApiRequestError ? err.body.message : "No se pudo actualizar el acceso de la empresa."); }
  };

  const sendCompanyReset = async (id: string) => {
    const token = getAdminToken(); if (!token) return;
    try { const result = await apiFetch<{ message: string }>(`/api/v1/admin/companies/${id}/password-reset`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); setCompaniesError(result.message); }
    catch (err) { setCompaniesError(err instanceof ApiRequestError ? err.body.message : "No se pudo enviar el restablecimiento."); }
  };

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    let cancelled = false;
    // Resetting stale error state before a refetch is a standard, correct
    // pattern; react-hooks/set-state-in-effect flags any setState in an
    // effect body regardless of async boundaries, with no clean alternative
    // short of pulling in a data-fetching library.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);

    apiFetch<{ data: AdminProfessional[] }>(`/api/v1/admin/professionals?status=${status}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((result) => {
        if (!cancelled) setItems(result.data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiRequestError && err.status === 401) {
          clearAdminToken();
          router.replace("/admin/login");
          return;
        }
        setError(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
      });

    return () => {
      cancelled = true;
    };
  }, [status, router]);

  const updateStatus = async (id: string, newStatus: ProfessionalStatus) => {
    const token = getAdminToken();
    if (!token) return;
    const reason = newStatus === "rejected" ? window.prompt("Indique el motivo del rechazo (mínimo 10 caracteres):")?.trim() : undefined;
    if (newStatus === "rejected" && (!reason || reason.length < 10)) {
      setError("El rechazo requiere una observación de al menos 10 caracteres.");
      return;
    }
    setActionId(id);
    try {
      await apiFetch(`/api/v1/admin/professionals/${id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, reason }),
      });
      setItems((prev) => prev?.filter((p) => p.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.message : "No se pudo actualizar el estado.");
    } finally {
      setActionId(null);
    }
  };

  const setProfessionalActive = async (id: string, isActive: boolean) => {
    const token = getAdminToken(); if (!token) return;
    try { await apiFetch(`/api/v1/admin/professionals/${id}/active`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify({ is_active: isActive }) }); setItems((prev) => prev?.map((item) => item.id === id ? { ...item, is_active: isActive } : item) ?? null); }
    catch (err) { setError(err instanceof ApiRequestError ? err.body.message : "No se pudo actualizar el acceso del profesional."); }
  };

  const resendVerification = async (id: string) => {
    setActionId(id);
    try {
      const result = await apiFetch<{ message: string }>(`/api/v1/admin/professionals/${id}/verification`, { method: "POST", headers: { Authorization: `Bearer ${getAdminToken()}` } });
      setError(result.message);
    } catch (e) { setError(e instanceof ApiRequestError ? e.body.message : "No se pudo solicitar la verificación."); }
    finally { setActionId(null); }
  };

  return (
    <section className="mx-auto w-full max-w-container-max px-margin-mobile py-8 md:px-margin-desktop">
      <h1 className="font-headline text-headline-lg-mobile text-primary-container md:text-headline-lg">Panel de Administración</h1>

      {tab === "moderation" && (
        <>
          <div className="mt-6 flex gap-2 border-b border-border-subtle">
            {STATUS_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setStatus(t.value)}
                className={`px-4 py-2.5 font-label text-label-md ${
                  status === t.value
                    ? "border-b-2 border-primary-container text-primary-container"
                    : "text-on-surface-variant"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-6 rounded border border-error-container bg-error-container px-4 py-3 font-body text-body-sm text-on-error-container">
              {error}
            </p>
          )}

          <div className="mt-6 overflow-x-auto rounded-xl border border-border-subtle">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-surface-container">
            <tr>
              <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Nombre</th>
              <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Documento</th>
              <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Contacto</th>
              <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Afinidad sectorial</th>
              <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Estado</th>
              <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items === null && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-body text-body-sm text-on-surface-variant">
                  Cargando…
                </td>
              </tr>
            )}
            {items?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-body text-body-sm text-on-surface-variant">
                  No hay profesionales en este estado.
                </td>
              </tr>
            )}
            {items?.map((p) => (
              <tr key={p.id} className="border-t border-border-subtle">
                <td className="px-4 py-3 font-body text-body-sm text-on-surface">
                  {p.first_name} {p.last_name}
                </td>
                <td className="px-4 py-3 font-body text-body-sm text-on-surface-variant">
                  {p.document_type}-{p.document_number}
                </td>
                <td className="px-4 py-3"><SectorFitBadge fit={p.sector_fit} /></td>
                <td className="px-4 py-3 font-body text-body-sm text-on-surface-variant">
                  <div>{p.email}</div>
                  <div className={p.email_verified ? "text-secondary" : "text-error"}>{p.email_verified ? "Correo verificado" : "Correo sin verificar"}</div>
                  {!p.email_verified && p.is_active && <button type="button" disabled={actionId === p.id} onClick={() => resendVerification(p.id)} className="mt-1 underline disabled:opacity-50">Reenviar verificación</button>}
                  <div>{p.phone}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 font-label text-label-sm ${STATUS_BADGE[p.status]}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <details className="mb-3 max-w-md rounded border border-border-subtle p-2 font-body text-body-sm"><summary className="cursor-pointer font-label text-label-sm text-primary-container">Ver resumen para moderar</summary><div className="mt-3 space-y-2"><p><strong>Sector:</strong> {p.sector} · {p.area} / {p.subarea}</p><p><strong>Experiencia:</strong> {p.experience_years} años · {p.last_position}</p><p><strong>Formación:</strong> {p.education_level}</p><p><strong>Resumen:</strong> {p.bio_summary}</p><p><strong>Certificaciones:</strong> {p.certifications.join(", ") || "No informadas"}</p><p><strong>Idiomas:</strong> {p.languages.join(", ") || "No informados"}</p><p><strong>Disponibilidad:</strong> {p.immediate_availability ? "Inmediata" : "A convenir"}{p.relocation_willing ? " · Disponible para reubicación" : ""}</p>{p.sector_fit.signals.length > 0 && <p><strong>Señales:</strong> {p.sector_fit.signals.join(" · ")}</p>}{p.sector_fit.considerations.map((item) => <p className="text-on-surface-variant" key={item}>{item}</p>)}</div></details>
                  {status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actionId === p.id || !p.email_verified}
                        onClick={() => updateStatus(p.id, "approved")}
                        className="rounded bg-secondary-container px-3 py-1.5 font-label text-label-sm text-white disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                      <button
                        type="button"
                        disabled={actionId === p.id}
                        onClick={() => updateStatus(p.id, "rejected")}
                        className="rounded border border-outline-variant px-3 py-1.5 font-label text-label-sm text-on-surface-variant disabled:opacity-50"
                      >
                        Rechazar
                      </button>
                    </div>
                  )}
                  {status !== "pending" && <button type="button" onClick={() => setProfessionalActive(p.id, !p.is_active)} className="rounded border border-outline-variant px-3 py-1.5 font-label text-label-sm text-on-surface-variant">{p.is_active ? "Desactivar" : "Activar"}</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        </>
      )}

      {tab === "companies" && (
        <div className="mt-6">
          {companiesError && (
            <p className="mb-4 rounded border border-error-container bg-error-container px-4 py-3 font-body text-body-sm text-on-error-container">
              {companiesError}
            </p>
          )}
          <div className="mb-4 flex flex-wrap gap-2 border-b border-border-subtle">
            {COMPANY_STATUS_TABS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setCompanyStatus(item.value);
                  setCompanies(null);
                              }}
                className={`px-4 py-2.5 font-label text-label-md ${
                  companyStatus === item.value
                    ? "border-b-2 border-primary-container text-primary-container"
                    : "text-on-surface-variant"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-surface-container">
                <tr>
                  <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Empresa</th>
                  <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">RIF</th>
                  <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Contacto</th>
                  <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Afinidad sectorial</th>
                  <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Estado</th>
                  <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {companies === null && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center font-body text-body-sm text-on-surface-variant">
                      Cargando…
                    </td>
                  </tr>
                )}
                {companies?.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center font-body text-body-sm text-on-surface-variant">
                      No hay empresas {COMPANY_STATUS_TABS.find((item) => item.value === companyStatus)?.label.toLowerCase()}.
                    </td>
                  </tr>
                )}
                {companies?.map((c) => (
                  <tr key={c.id} className="border-t border-border-subtle">
                    <td className="px-4 py-3 font-body text-body-sm text-on-surface">{c.name}</td>
                    <td className="px-4 py-3 font-body text-body-sm text-on-surface-variant">{c.rif}</td>
                    <td className="px-4 py-3 font-body text-body-sm text-on-surface-variant">
                      <div>{c.email}</div>
                      <div>{c.phone}</div>
                    </td>
                    <td className="px-4 py-3"><SectorFitBadge fit={c.sector_fit} /></td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 font-label text-label-sm ${COMPANY_STATUS_BADGE[c.status]}`}>
                        {COMPANY_STATUS_TABS.find((item) => item.value === c.status)?.label.slice(0, -1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <details className="mb-3 max-w-md rounded border border-border-subtle p-2 font-body text-body-sm"><summary className="cursor-pointer font-label text-label-sm text-primary-container">Ver resumen para moderar</summary><div className="mt-3 space-y-2"><p><strong>Líneas:</strong> {c.business_areas.join(" · ") || "No informadas"}</p><p><strong>Servicios:</strong> {c.energy_services.join(", ") || "No informados"}</p><p><strong>Actividad:</strong> {c.business_description || "No informada"}</p>{c.website && <a className="block text-primary-container underline" href={c.website} target="_blank" rel="noreferrer">Sitio web corporativo</a>}{c.sector_fit.signals.length > 0 && <p><strong>Señales:</strong> {c.sector_fit.signals.join(" · ")}</p>}{c.sector_fit.considerations.map((item) => <p className="text-on-surface-variant" key={item}>{item}</p>)}</div></details>
                      {c.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={companyActionId === c.id}
                            onClick={() => updateCompanyStatus(c.id, "approved")}
                            className="rounded bg-secondary-container px-3 py-1.5 font-label text-label-sm text-white disabled:opacity-50"
                          >
                            Aprobar
                          </button>
                          <button
                            type="button"
                            disabled={companyActionId === c.id}
                            onClick={() => updateCompanyStatus(c.id, "rejected")}
                            className="rounded border border-error px-3 py-1.5 font-label text-label-sm text-error disabled:opacity-50"
                          >
                            Rechazar
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setCompanyActive(c.id, !c.is_active)} className="rounded border border-outline-variant px-3 py-1.5 font-label text-label-sm text-on-surface-variant">{c.is_active ? "Desactivar" : "Activar"}</button>{c.is_active && <button type="button" onClick={() => sendCompanyReset(c.id)} className="rounded border border-outline-variant px-3 py-1.5 font-label text-label-sm text-on-surface-variant">Restablecer acceso</button>}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "vacancies" && (
        <div className="mt-6">
          <div className="flex gap-2 border-b border-border-subtle">{(["pending", "approved", "rejected", "closed"] as const).map((value) => <button key={value} type="button" onClick={() => { setVacancyStatus(value); setVacancies(null); }} className={`px-4 py-2.5 font-label text-label-md ${vacancyStatus === value ? "border-b-2 border-primary-container text-primary-container" : "text-on-surface-variant"}`}>{({ pending: "Pendientes", approved: "Aprobadas", rejected: "Rechazadas", closed: "Cerradas" })[value]}</button>)}</div>
          {vacancyError && <p className="mt-4 rounded border border-error-container bg-error-container px-4 py-3 font-body text-body-sm text-on-error-container">{vacancyError}</p>}
          <div className="mt-4 space-y-3">{vacancies === null ? <p className="font-body text-body-sm text-on-surface-variant">Cargando…</p> : vacancies.length === 0 ? <p className="font-body text-body-sm text-on-surface-variant">No hay vacantes en este estado.</p> : vacancies.map((vacancy) => <article key={vacancy.id} className="rounded-xl border border-border-subtle bg-surface-container-lowest p-5"><p className="font-label text-label-sm text-secondary">{vacancy.company_name} · {vacancy.area} · {vacancy.location}</p><h2 className="mt-1 font-headline text-headline-md text-primary-container">{vacancy.title}</h2><p className="mt-2 font-body text-body-sm text-on-surface-variant">{vacancy.description}</p>{vacancy.status === "pending" && <div className="mt-4 flex gap-2"><button type="button" onClick={() => updateVacancyStatus(vacancy.id, "approved")} className="rounded bg-secondary-container px-3 py-1.5 font-label text-label-sm text-white">Aprobar</button><button type="button" onClick={() => updateVacancyStatus(vacancy.id, "rejected")} className="rounded border border-error px-3 py-1.5 font-label text-label-sm text-error">Rechazar</button></div>}</article>)}</div>
        </div>
      )}

      {tab === "catalogs" && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CatalogSection title="Áreas" endpoint="areas" items={catalogs?.areas ?? []} onChange={loadCatalogs} />
          <CatalogSection title="Sectores" endpoint="sectors" items={catalogs?.sectors ?? []} onChange={loadCatalogs} />
          <CatalogSection
            title="Subáreas"
            endpoint="subareas"
            items={catalogs?.subareas ?? []}
            onChange={loadCatalogs}
            areaOptions={catalogs?.areas ?? []}
          />
          <CatalogSection
            title="Certificaciones"
            endpoint="certifications"
            items={catalogs?.certifications ?? []}
            onChange={loadCatalogs}
          />
        </div>
      )}
    </section>
  );
}

export default function AdminPage() { return <Suspense fallback={<p className="p-8">Cargando panel…</p>}><AdminContent /></Suspense>; }

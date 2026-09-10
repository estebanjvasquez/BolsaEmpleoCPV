"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProfessionalSearchResult, CompanyContactSummary, ContactResult } from "@cpv/shared";
import { apiFetch, ApiRequestError } from "@/lib/api-client";
import { clearCompanyToken, getCompanyToken } from "@/lib/company-auth";

interface Catalogs {
  areas: { id: number; name: string }[];
  subareas: { id: number; area_id: number; name: string }[];
  states: { name: string; cities: string[] }[];
}

interface Filters {
  area_id: string;
  subarea_id: string;
  min_experience: string;
  state: string;
  relocation: boolean;
  keyword: string;
}

const EMPTY_FILTERS: Filters = {
  area_id: "",
  subarea_id: "",
  min_experience: "",
  state: "",
  relocation: false,
  keyword: "",
};

const inputClass =
  "w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-body-sm text-on-surface focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container";
const labelClass = "mb-1 block font-label text-label-sm text-on-surface-variant";

const RESULT_LABEL: Record<ContactResult, string> = {
  pending: "Pendiente",
  hired: "Contratado",
  not_hired: "No contratado",
  in_progress: "En proceso",
};

function buildQuery(filters: Filters, page: number): string {
  const params = new URLSearchParams();
  if (filters.area_id) params.set("area_id", filters.area_id);
  if (filters.subarea_id) params.set("subarea_id", filters.subarea_id);
  if (filters.min_experience) params.set("min_experience", filters.min_experience);
  if (filters.state) params.set("state", filters.state);
  if (filters.relocation) params.set("relocation", "true");
  if (filters.keyword) params.set("keyword", filters.keyword);
  params.set("page", String(page));
  return params.toString();
}

export default function SearchPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"search" | "contacts">("search");
  const [ready, setReady] = useState(false);
  const [forbidden, setForbidden] = useState(false);

  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<ProfessionalSearchResult[] | null>(null);
  const [meta, setMeta] = useState<{ total: number; has_more: boolean } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [contactTarget, setContactTarget] = useState<ProfessionalSearchResult | null>(null);
  const [contactMessage, setContactMessage] = useState("");
  const [contactState, setContactState] = useState<"idle" | "sending" | "sent">("idle");
  const [contactError, setContactError] = useState<string | null>(null);

  const [contacts, setContacts] = useState<CompanyContactSummary[] | null>(null);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [feedbackBusyId, setFeedbackBusyId] = useState<string | null>(null);

  const authHeader = () => ({ Authorization: `Bearer ${getCompanyToken()}` });

  const handleAuthError = (err: unknown): boolean => {
    if (err instanceof ApiRequestError && err.status === 401) {
      clearCompanyToken();
      router.replace("/company/login");
      return true;
    }
    if (err instanceof ApiRequestError && err.status === 403) {
      setForbidden(true);
      return true;
    }
    return false;
  };

  const runSearch = (targetPage: number) => {
    setSearchError(null);
    apiFetch<{ data: ProfessionalSearchResult[]; meta: { total: number; has_more: boolean } }>(
      `/api/v1/professionals/search?${buildQuery(filters, targetPage)}`,
      { headers: authHeader() },
    )
      .then((res) => {
        setResults(res.data);
        setMeta(res.meta);
        setPage(targetPage);
      })
      .catch((err) => {
        if (handleAuthError(err)) return;
        setSearchError(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
      });
  };

  useEffect(() => {
    const token = getCompanyToken();
    if (!token) {
      router.replace("/company/login");
      return;
    }
    // Mounts once the token is confirmed present; the initial catalogs/search
    // fetches below need it read before they can run, so there's no way to
    // split this into a "no setState" effect (mirrors admin/page.tsx).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);

    apiFetch<Catalogs>("/api/v1/catalogs").then(setCatalogs).catch(() => undefined);
    runSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadContacts = () => {
    setContactsError(null);
    apiFetch<{ data: CompanyContactSummary[] }>("/api/v1/companies/contacts", { headers: authHeader() })
      .then((res) => setContacts(res.data))
      .catch((err) => {
        if (handleAuthError(err)) return;
        setContactsError(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
      });
  };

  useEffect(() => {
    if (ready && tab === "contacts" && contacts === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, tab]);

  const submitContact = async () => {
    if (!contactTarget) return;
    setContactState("sending");
    setContactError(null);
    try {
      await apiFetch(`/api/v1/professionals/${contactTarget.id}/contact`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ message: contactMessage }),
      });
      setContactState("sent");
    } catch (err) {
      setContactState("idle");
      if (handleAuthError(err)) return;
      setContactError(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
    }
  };

  const closeContactModal = () => {
    setContactTarget(null);
    setContactMessage("");
    setContactState("idle");
    setContactError(null);
  };

  const submitFeedback = async (contactId: string, result: ContactResult) => {
    setFeedbackBusyId(contactId);
    try {
      await apiFetch(`/api/v1/companies/feedback/${contactId}`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify({ result }),
      });
      setContacts((prev) => prev?.map((c) => (c.id === contactId ? { ...c, result } : c)) ?? null);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setFeedbackBusyId(null);
    }
  };

  const logout = () => {
    clearCompanyToken();
    router.push("/company/login");
  };

  const subareasForArea = catalogs?.subareas.filter((s) => String(s.area_id) === filters.area_id) ?? [];

  if (!ready) return null;

  if (forbidden) {
    return (
      <section className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-margin-mobile py-24 text-center">
        <h1 className="font-headline text-headline-lg text-primary-container">Cuenta pendiente de aprobación</h1>
        <p className="mt-4 font-body text-body-md text-on-surface-variant">
          Su cuenta debe ser aprobada por un administrador de la Cámara Petrolera antes de poder buscar
          profesionales. Intente nuevamente más tarde.
        </p>
        <button type="button" onClick={logout} className="mt-6 font-label text-label-md text-primary-container hover:underline">
          Cerrar sesión
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-container-max px-margin-mobile py-10 md:px-margin-desktop">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-headline-lg-mobile text-primary-container md:text-headline-lg">
          Buscador de Profesionales
        </h1>
        <div className="flex flex-wrap items-center justify-end gap-4">
          <Link href="/company/profile" className="font-label text-label-md text-primary-container hover:underline">Perfil de empresa</Link>
          <Link href="/company/vacancies" className="font-label text-label-md text-primary-container hover:underline">Mis vacantes</Link>
          <button type="button" onClick={logout} className="font-label text-label-md text-on-surface-variant hover:text-secondary">Cerrar sesión</button>
        </div>
      </div>

      <div className="mt-6 flex gap-2 border-b border-border-subtle">
        <button
          type="button"
          onClick={() => setTab("search")}
          className={`px-4 py-2.5 font-label text-label-md ${tab === "search" ? "border-b-2 border-primary-container text-primary-container" : "text-on-surface-variant"}`}
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={() => setTab("contacts")}
          className={`px-4 py-2.5 font-label text-label-md ${tab === "contacts" ? "border-b-2 border-primary-container text-primary-container" : "text-on-surface-variant"}`}
        >
          Mis Contactos
        </button>
      </div>

      {tab === "search" && (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(1);
            }}
            className="flex h-fit flex-col gap-4 rounded-xl border border-border-subtle bg-surface-container-lowest p-5"
          >
            <div>
              <label className={labelClass}>Área</label>
              <select
                className={inputClass}
                value={filters.area_id}
                onChange={(e) => setFilters({ ...filters, area_id: e.target.value, subarea_id: "" })}
              >
                <option value="">Todas</option>
                {catalogs?.areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Subárea</label>
              <select
                className={inputClass}
                value={filters.subarea_id}
                onChange={(e) => setFilters({ ...filters, subarea_id: e.target.value })}
                disabled={!filters.area_id}
              >
                <option value="">Todas</option>
                {subareasForArea.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <select className={inputClass} value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value })}>
                <option value="">Todos</option>
                {catalogs?.states.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Experiencia mínima (años)</label>
              <input
                type="number"
                min={0}
                className={inputClass}
                value={filters.min_experience}
                onChange={(e) => setFilters({ ...filters, min_experience: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Palabra clave</label>
              <input
                className={inputClass}
                placeholder="Cargo o especialidad"
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 font-label text-label-sm text-on-surface-variant">
              <input
                type="checkbox"
                checked={filters.relocation}
                onChange={(e) => setFilters({ ...filters, relocation: e.target.checked })}
              />
              Dispuesto a reubicarse
            </label>
            <button
              type="submit"
              className="mt-2 w-full rounded-full bg-primary-container px-6 py-2.5 font-headline text-headline-md text-on-primary transition-opacity hover:opacity-90"
            >
              Filtrar
            </button>
          </form>

          <div>
            {searchError && (
              <p className="mb-4 rounded border border-error-container bg-error-container px-4 py-3 font-body text-body-sm text-on-error-container">
                {searchError}
              </p>
            )}

            {results === null && <p className="font-body text-body-sm text-on-surface-variant">Cargando…</p>}
            {results?.length === 0 && (
              <p className="font-body text-body-sm text-on-surface-variant">No se encontraron profesionales con esos filtros.</p>
            )}

            <div className="flex flex-col gap-4">
              {results?.map((p) => (
                <div key={p.id} className="rounded-xl border border-border-subtle bg-surface-container-lowest p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-headline text-headline-md text-on-surface">
                        {p.first_name} {p.last_name}
                      </h3>
                      <p className="font-body text-body-sm text-on-surface-variant">
                        {p.last_position} · {p.area} / {p.subarea}
                      </p>
                      <p className="mt-1 font-body text-body-sm text-on-surface-variant">
                        {p.city}, {p.state} · {p.experience_years} años de experiencia
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setContactTarget(p)}
                      className="shrink-0 rounded-full bg-secondary-container px-5 py-2 font-label text-label-md text-white hover:opacity-90"
                    >
                      Contactar
                    </button>
                  </div>
                  <p className="mt-3 font-body text-body-sm text-on-surface">{p.bio_summary}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {p.job_types_willing.map((t) => (
                      <span key={t} className="rounded-full bg-surface-container px-3 py-1 font-label text-label-sm text-on-surface-variant">
                        {t}
                      </span>
                    ))}
                    {p.relocation_willing && (
                      <span className="rounded-full bg-surface-container px-3 py-1 font-label text-label-sm text-on-surface-variant">
                        Reubicación
                      </span>
                    )}
                    {p.immediate_availability && (
                      <span className="rounded-full bg-surface-container px-3 py-1 font-label text-label-sm text-on-surface-variant">
                        Disponibilidad inmediata
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {meta && (results?.length ?? 0) > 0 && (
              <div className="mt-6 flex items-center justify-between font-label text-label-sm text-on-surface-variant">
                <span>{meta.total} resultado(s)</span>
                <div className="flex gap-3">
                  <button type="button" disabled={page <= 1} onClick={() => runSearch(page - 1)} className="disabled:opacity-40">
                    Anterior
                  </button>
                  <span>Página {page}</span>
                  <button type="button" disabled={!meta.has_more} onClick={() => runSearch(page + 1)} className="disabled:opacity-40">
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "contacts" && (
        <div className="mt-6">
          {contactsError && (
            <p className="mb-4 rounded border border-error-container bg-error-container px-4 py-3 font-body text-body-sm text-on-error-container">
              {contactsError}
            </p>
          )}
          {contacts === null && <p className="font-body text-body-sm text-on-surface-variant">Cargando…</p>}
          {contacts?.length === 0 && (
            <p className="font-body text-body-sm text-on-surface-variant">Aún no ha contactado a ningún profesional.</p>
          )}
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            {contacts && contacts.length > 0 && (
              <table className="w-full min-w-[720px] text-left">
                <thead className="bg-surface-container">
                  <tr>
                    <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Profesional</th>
                    <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Mensaje</th>
                    <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Resultado</th>
                    <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Reportar</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((c) => (
                    <tr key={c.id} className="border-t border-border-subtle">
                      <td className="px-4 py-3 font-body text-body-sm text-on-surface">{c.professional_name}</td>
                      <td className="px-4 py-3 font-body text-body-sm text-on-surface-variant">{c.message}</td>
                      <td className="px-4 py-3 font-body text-body-sm text-on-surface-variant">{RESULT_LABEL[c.result]}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {(["hired", "not_hired", "in_progress"] as ContactResult[]).map((r) => (
                            <button
                              key={r}
                              type="button"
                              disabled={feedbackBusyId === c.id || c.result === r}
                              onClick={() => submitFeedback(c.id, r)}
                              className="rounded border border-outline-variant px-2.5 py-1 font-label text-label-sm text-on-surface-variant hover:border-primary-container hover:text-primary-container disabled:opacity-40"
                            >
                              {RESULT_LABEL[r]}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {contactTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-surface p-6">
            {contactState === "sent" ? (
              <>
                <h2 className="font-headline text-headline-md text-primary-container">Solicitud enviada</h2>
                <p className="mt-3 font-body text-body-sm text-on-surface-variant">
                  El administrador revisará su solicitud y facilitará el contacto con {contactTarget.first_name}{" "}
                  {contactTarget.last_name}.
                </p>
                <button
                  type="button"
                  onClick={closeContactModal}
                  className="mt-6 w-full rounded-full bg-primary-container px-6 py-2.5 font-headline text-headline-md text-on-primary hover:opacity-90"
                >
                  Cerrar
                </button>
              </>
            ) : (
              <>
                <h2 className="font-headline text-headline-md text-primary-container">
                  Contactar a {contactTarget.first_name} {contactTarget.last_name}
                </h2>
                <textarea
                  className={`${inputClass} mt-4 min-h-32`}
                  placeholder="Escriba un mensaje breve sobre la vacante u oportunidad…"
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                />
                {contactError && <p className="mt-2 font-body text-body-sm text-error">{contactError}</p>}
                <div className="mt-4 flex justify-end gap-3">
                  <button type="button" onClick={closeContactModal} className="font-label text-label-md text-on-surface-variant">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={contactState === "sending" || contactMessage.trim().length === 0}
                    onClick={submitContact}
                    className="rounded-full bg-primary-container px-6 py-2.5 font-headline text-headline-md text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {contactState === "sending" ? "Enviando…" : "Enviar Solicitud"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

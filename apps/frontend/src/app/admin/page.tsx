"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ProfessionalStatus } from "@cpv/shared";
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
  phone: string;
  status: ProfessionalStatus;
  created_at: string;
}

interface AdminCompany {
  id: string;
  name: string;
  rif: string;
  email: string;
  phone: string;
  is_verified: boolean;
  created_at: string;
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

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"moderation" | "companies" | "catalogs">("moderation");
  const [status, setStatus] = useState<ProfessionalStatus>("pending");
  const [items, setItems] = useState<AdminProfessional[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [catalogs, setCatalogs] = useState<Catalogs | null>(null);
  const [companies, setCompanies] = useState<AdminCompany[] | null>(null);
  const [companiesError, setCompaniesError] = useState<string | null>(null);
  const [companyActionId, setCompanyActionId] = useState<string | null>(null);

  const loadCatalogs = () => {
    apiFetch<Catalogs>("/api/v1/catalogs").then(setCatalogs).catch(() => undefined);
  };

  useEffect(() => {
    if (tab === "catalogs" && catalogs === null) loadCatalogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadCompanies = () => {
    const token = getAdminToken();
    if (!token) return;
    setCompaniesError(null);
    apiFetch<{ data: AdminCompany[] }>("/api/v1/admin/companies?verified=false", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => setCompanies(res.data))
      .catch((err) => {
        setCompaniesError(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
      });
  };

  useEffect(() => {
    if (tab === "companies") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadCompanies();
    }
  }, [tab]);

  const approveCompany = async (id: string) => {
    const token = getAdminToken();
    if (!token) return;
    setCompanyActionId(id);
    try {
      await apiFetch(`/api/v1/admin/companies/${id}/verify`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanies((prev) => prev?.filter((c) => c.id !== id) ?? null);
    } catch (err) {
      setCompaniesError(err instanceof ApiRequestError ? err.body.message : "No se pudo aprobar la empresa.");
    } finally {
      setCompanyActionId(null);
    }
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
    setActionId(id);
    try {
      await apiFetch(`/api/v1/admin/professionals/${id}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      setItems((prev) => prev?.filter((p) => p.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.message : "No se pudo actualizar el estado.");
    } finally {
      setActionId(null);
    }
  };

  const logout = () => {
    clearAdminToken();
    router.push("/admin/login");
  };

  return (
    <section className="mx-auto w-full max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-headline-lg-mobile text-primary-container md:text-headline-lg">
          Panel de Administración
        </h1>
        <button
          type="button"
          onClick={logout}
          className="font-label text-label-md text-on-surface-variant hover:text-secondary"
        >
          Cerrar sesión
        </button>
      </div>

      <div className="mt-6 flex gap-2 border-b border-border-subtle">
        <button
          type="button"
          onClick={() => setTab("moderation")}
          className={`px-4 py-2.5 font-label text-label-md ${tab === "moderation" ? "border-b-2 border-primary-container text-primary-container" : "text-on-surface-variant"}`}
        >
          Moderación
        </button>
        <button
          type="button"
          onClick={() => setTab("companies")}
          className={`px-4 py-2.5 font-label text-label-md ${tab === "companies" ? "border-b-2 border-primary-container text-primary-container" : "text-on-surface-variant"}`}
        >
          Empresas
        </button>
        <button
          type="button"
          onClick={() => setTab("catalogs")}
          className={`px-4 py-2.5 font-label text-label-md ${tab === "catalogs" ? "border-b-2 border-primary-container text-primary-container" : "text-on-surface-variant"}`}
        >
          Catálogos
        </button>
        <Link href="/admin/stats" className="px-4 py-2.5 font-label text-label-md text-on-surface-variant hover:text-primary-container">
          Estadísticas
        </Link>
      </div>

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
              <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Estado</th>
              <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items === null && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center font-body text-body-sm text-on-surface-variant">
                  Cargando…
                </td>
              </tr>
            )}
            {items?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center font-body text-body-sm text-on-surface-variant">
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
                <td className="px-4 py-3 font-body text-body-sm text-on-surface-variant">
                  <div>{p.email}</div>
                  <div>{p.phone}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-3 py-1 font-label text-label-sm ${STATUS_BADGE[p.status]}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={actionId === p.id}
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
          <div className="overflow-x-auto rounded-xl border border-border-subtle">
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-surface-container">
                <tr>
                  <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Empresa</th>
                  <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">RIF</th>
                  <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Contacto</th>
                  <th className="px-4 py-3 font-label text-label-sm text-on-surface-variant">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {companies === null && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center font-body text-body-sm text-on-surface-variant">
                      Cargando…
                    </td>
                  </tr>
                )}
                {companies?.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center font-body text-body-sm text-on-surface-variant">
                      No hay empresas pendientes de aprobación.
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
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        disabled={companyActionId === c.id}
                        onClick={() => approveCompany(c.id)}
                        className="rounded bg-secondary-container px-3 py-1.5 font-label text-label-sm text-white disabled:opacity-50"
                      >
                        Aprobar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

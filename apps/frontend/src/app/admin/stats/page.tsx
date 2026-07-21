"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminStats } from "@cpv/shared";
import { apiFetch, ApiRequestError } from "@/lib/api-client";
import { clearAdminToken, getAdminToken } from "@/lib/admin-auth";

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-container-lowest p-5">
      <p className="font-label text-label-sm text-on-surface-variant">{label}</p>
      <p className="mt-2 font-headline text-headline-lg text-primary-container">{value}</p>
    </div>
  );
}

function BarList({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) {
    return <p className="font-body text-body-sm text-on-surface-variant">Sin datos aún.</p>;
  }
  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex items-center justify-between font-body text-body-sm text-on-surface">
            <span>{row.label}</span>
            <span className="text-on-surface-variant">{row.value}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-surface-container">
            <div
              className="h-2 rounded-full bg-primary-container"
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminStatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }

    apiFetch<AdminStats>("/api/v1/admin/stats", { headers: { Authorization: `Bearer ${token}` } })
      .then(setStats)
      .catch((err) => {
        if (err instanceof ApiRequestError && err.status === 401) {
          clearAdminToken();
          router.replace("/admin/login");
          return;
        }
        setError(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
      });
  }, [router]);

  const maxRegistrations = Math.max(
    1,
    ...(stats?.registrations_over_time.flatMap((r) => [r.professionals, r.companies]) ?? []),
  );

  return (
    <section className="mx-auto w-full max-w-container-max px-margin-mobile py-12 md:px-margin-desktop">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-headline-lg-mobile text-primary-container md:text-headline-lg">
          Estadísticas
        </h1>
        <Link href="/admin" className="font-label text-label-md text-on-surface-variant hover:text-secondary">
          ← Volver al panel
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded border border-error-container bg-error-container px-4 py-3 font-body text-body-sm text-on-error-container">
          {error}
        </p>
      )}

      {!stats && !error && <p className="mt-6 font-body text-body-sm text-on-surface-variant">Cargando…</p>}

      {stats && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard label="Profesionales" value={stats.total_professionals} />
            <KpiCard label="Empresas" value={stats.total_companies} />
            <KpiCard label="Contactos" value={stats.total_contacts} />
            <KpiCard label="Tasa de éxito" value={`${stats.success_rate_percent}%`} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <KpiCard label="Contratados vía portal" value={stats.hires_reported.via_portal} />
            <KpiCard label="Contratados externamente" value={stats.hires_reported.externally} />
            <KpiCard label="Total contratados" value={stats.hires_reported.total} />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border-subtle bg-surface-container-lowest p-5">
              <h2 className="font-headline text-headline-md text-on-surface">Áreas más solicitadas</h2>
              <div className="mt-4">
                <BarList
                  rows={stats.most_requested_areas.map((a) => ({ label: a.area_name, value: a.contacts_count }))}
                />
              </div>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface-container-lowest p-5">
              <h2 className="font-headline text-headline-md text-on-surface">Empresas más activas</h2>
              <div className="mt-4">
                <BarList
                  rows={stats.top_contacting_companies.map((c) => ({ label: c.company_name, value: c.contacts_count }))}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-border-subtle bg-surface-container-lowest p-5">
            <h2 className="font-headline text-headline-md text-on-surface">Registros por mes</h2>
            <div className="mt-4 flex items-end gap-4 overflow-x-auto pb-2">
              {stats.registrations_over_time.map((row) => (
                <div key={row.month} className="flex flex-col items-center gap-1">
                  <div className="flex h-32 items-end gap-1">
                    <div
                      className="w-4 rounded-t bg-primary-container"
                      style={{ height: `${(row.professionals / maxRegistrations) * 100}%` }}
                      title={`${row.professionals} profesionales`}
                    />
                    <div
                      className="w-4 rounded-t bg-secondary-container"
                      style={{ height: `${(row.companies / maxRegistrations) * 100}%` }}
                      title={`${row.companies} empresas`}
                    />
                  </div>
                  <span className="font-label text-label-sm text-on-surface-variant">{row.month}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-4 font-label text-label-sm text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary-container" /> Profesionales
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-secondary-container" /> Empresas
              </span>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

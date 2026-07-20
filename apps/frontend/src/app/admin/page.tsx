"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProfessionalStatus } from "@cpv/shared";
import { apiFetch, ApiRequestError } from "@/lib/api-client";
import { clearAdminToken, getAdminToken } from "@/lib/admin-auth";

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
  const [status, setStatus] = useState<ProfessionalStatus>("pending");
  const [items, setItems] = useState<AdminProfessional[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

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
          Moderación de Profesionales
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
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`px-4 py-2.5 font-label text-label-md ${
              status === tab.value
                ? "border-b-2 border-primary-container text-primary-container"
                : "text-on-surface-variant"
            }`}
          >
            {tab.label}
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
    </section>
  );
}

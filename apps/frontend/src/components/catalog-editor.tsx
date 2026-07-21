"use client";

import { useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api-client";
import { getAdminToken } from "@/lib/admin-auth";

interface CatalogItem {
  id: number;
  name: string;
  area_id?: number;
}

interface CatalogSectionProps {
  title: string;
  endpoint: "areas" | "subareas" | "sectors" | "certifications";
  items: CatalogItem[];
  onChange: () => void;
  areaOptions?: { id: number; name: string }[];
}

const inputClass =
  "w-full rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body text-body-sm text-on-surface focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container";

export function CatalogSection({ title, endpoint, items, onChange, areaOptions }: CatalogSectionProps) {
  const [newName, setNewName] = useState("");
  const [newAreaId, setNewAreaId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | "new" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

  const authHeader = () => ({
    Authorization: `Bearer ${getAdminToken()}`,
    "Content-Type": "application/json",
  });

  const create = async () => {
    if (!newName.trim()) return;
    setBusyId("new");
    setError(null);
    try {
      const body: Record<string, unknown> = { name: newName.trim() };
      if (endpoint === "subareas") body.area_id = Number(newAreaId);
      await apiFetch(`/api/v1/admin/catalogs/${endpoint}`, {
        method: "POST",
        headers: authHeader(),
        body: JSON.stringify(body),
      });
      setNewName("");
      setNewAreaId("");
      onChange();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
    } finally {
      setBusyId(null);
    }
  };

  const save = async (id: number) => {
    if (!editingName.trim()) return;
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/catalogs/${endpoint}/${id}`, {
        method: "PATCH",
        headers: authHeader(),
        body: JSON.stringify({ name: editingName.trim() }),
      });
      setEditingId(null);
      onChange();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: number) => {
    setBusyId(id);
    setError(null);
    try {
      await apiFetch(`/api/v1/admin/catalogs/${endpoint}/${id}`, {
        method: "DELETE",
        headers: authHeader(),
      });
      onChange();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.body.message : "No se pudo conectar con el servidor.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border-subtle bg-surface-container-lowest p-5">
      <h3 className="font-headline text-headline-md text-on-surface">{title}</h3>

      <ul className="mt-4 flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2 rounded border border-border-subtle px-3 py-2">
            {editingId === item.id ? (
              <>
                <input className={inputClass} value={editingName} onChange={(e) => setEditingName(e.target.value)} />
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => save(item.id)}
                  className="shrink-0 font-label text-label-sm text-primary-container hover:underline"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="shrink-0 font-label text-label-sm text-on-surface-variant hover:underline"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 font-body text-body-sm text-on-surface">
                  {item.name}
                  {endpoint === "subareas" && areaOptions && (
                    <span className="ml-2 font-label text-label-sm text-on-surface-variant">
                      ({areaOptions.find((a) => a.id === item.area_id)?.name ?? "—"})
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(item.id);
                    setEditingName(item.name);
                  }}
                  className="shrink-0 font-label text-label-sm text-primary-container hover:underline"
                >
                  Editar
                </button>
                <button
                  type="button"
                  disabled={busyId === item.id}
                  onClick={() => remove(item.id)}
                  className="shrink-0 font-label text-label-sm text-error hover:underline disabled:opacity-40"
                >
                  Eliminar
                </button>
              </>
            )}
          </li>
        ))}
        {items.length === 0 && <li className="font-body text-body-sm text-on-surface-variant">Sin elementos.</li>}
      </ul>

      <div className="mt-4 flex gap-2">
        {endpoint === "subareas" && (
          <select className={inputClass} value={newAreaId} onChange={(e) => setNewAreaId(e.target.value)}>
            <option value="">Área…</option>
            {areaOptions?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
        <input
          className={inputClass}
          placeholder="Nuevo nombre"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button
          type="button"
          disabled={busyId === "new" || !newName.trim() || (endpoint === "subareas" && !newAreaId)}
          onClick={create}
          className="shrink-0 rounded-full bg-primary-container px-4 py-2 font-label text-label-sm text-on-primary hover:opacity-90 disabled:opacity-40"
        >
          Agregar
        </button>
      </div>

      {error && <p className="mt-2 font-body text-body-sm text-error">{error}</p>}
    </div>
  );
}

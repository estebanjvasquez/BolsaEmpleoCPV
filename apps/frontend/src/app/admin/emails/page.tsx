"use client";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api-client";
import { getAdminToken } from "@/lib/admin-auth";

interface Job { id: string; status: string; attempts: number; createdAt: string; acceptedAt: string | null }
const labels: Record<string, string> = { queued: "En cola", processing: "Procesando", accepted: "Aceptado por el proveedor", failed: "Fallido", cancelled: "Cancelado" };
export default function EmailsPage() {
  const [jobs, setJobs] = useState<Job[]>([]); const [message, setMessage] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const load = useCallback(() => { apiFetch<{ data: Job[] }>("/api/v1/admin/emails", { headers: { Authorization: `Bearer ${getAdminToken()}` } }).then((r) => setJobs(r.data)).catch(() => setMessage("No se pudieron cargar los envíos.")); }, []);
  useEffect(() => { load(); }, [load]);
  const retry = async (id: string) => { setBusy(true); try { await apiFetch(`/api/v1/admin/emails/${id}/retry`, { method: "POST", headers: { Authorization: `Bearer ${getAdminToken()}` } }); load(); } catch (e) { setMessage(e instanceof ApiRequestError ? e.body.message : "No se pudo reintentar."); } finally { setBusy(false); } };
  return <section className="mx-auto w-full max-w-container-max px-margin-mobile py-8 md:px-margin-desktop"><h1 className="font-headline text-headline-lg text-primary-container">Correos transaccionales</h1><p className="mt-3">Los envíos fallidos se reintentan automáticamente hasta cinco veces. La aceptación del proveedor no confirma la llegada a la bandeja de entrada.</p><button onClick={load} className="my-4 rounded border px-4 py-2">Actualizar</button>{message && <p role="status">{message}</p>}<div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th className="p-3">Fecha</th><th>Estado</th><th>Intentos</th><th>Acción</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.id} className="border-t"><td className="p-3">{new Date(job.createdAt).toLocaleString("es")}</td><td>{labels[job.status] ?? job.status}</td><td>{job.attempts}</td><td>{job.status === "failed" && <button disabled={busy} onClick={() => retry(job.id)} className="rounded border px-3 py-2">Reintentar</button>}</td></tr>)}</tbody></table>{jobs.length === 0 && <p className="py-6">No hay envíos registrados.</p>}</div></section>;
}

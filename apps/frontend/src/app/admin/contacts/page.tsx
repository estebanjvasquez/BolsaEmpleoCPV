"use client";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiRequestError } from "@/lib/api-client";
import { getAdminToken } from "@/lib/admin-auth";

interface Contact { id: string; company_name: string; professional_name: string; message: string; status: string }
export default function ContactsPage() {
  const [status, setStatus] = useState("pending_admin");
  const [items, setItems] = useState<Contact[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => {
    apiFetch<{ data: Contact[] }>(`/api/v1/admin/contacts?status=${status}`, { headers: { Authorization: `Bearer ${getAdminToken()}` } }).then((r) => setItems(r.data)).catch(() => setMessage("No fue posible cargar los contactos."));
  }, [status]);
  useEffect(() => { load(); }, [load]);
  const act = async (id: string, action: "send" | "block") => {
    setBusy(id);
    try { const r = await apiFetch<{ message: string }>(`/api/v1/admin/contacts/${id}`, { method: "PATCH", headers: { Authorization: `Bearer ${getAdminToken()}` }, body: JSON.stringify({ action }) }); setMessage(r.message); load(); }
    catch (e) { setMessage(e instanceof ApiRequestError ? e.body.message : "No se pudo resolver la solicitud."); }
    finally { setBusy(null); }
  };
  return <section className="mx-auto w-full max-w-container-max px-margin-mobile py-8 md:px-margin-desktop">
    <h1 className="font-headline text-headline-lg text-primary-container">Solicitudes de contacto</h1>
    <p className="mt-3 font-body text-on-surface-variant">Revise el mensaje antes de notificar al profesional. Sus datos de contacto no se entregan a la empresa.</p>
    <label className="mt-5 block">Estado <select value={status} onChange={(e) => setStatus(e.target.value)} className="ml-2 rounded border p-2"><option value="pending_admin">Pendientes</option><option value="sent">Notificación aceptada</option><option value="blocked">Bloqueadas</option></select></label>
    {message && <p role="status" className="my-4 rounded border p-3">{message}</p>}
    <div className="mt-6 grid gap-4">{items.length === 0 && <p>No hay solicitudes en este estado.</p>}{items.map((item) => <article key={item.id} className="rounded-xl border border-border-subtle p-5">
      <h2 className="font-headline text-headline-md">{item.company_name} → {item.professional_name}</h2><p className="my-4 whitespace-pre-wrap">{item.message}</p>
      {status === "pending_admin" && <div className="flex flex-wrap gap-3"><button disabled={busy !== null} onClick={() => act(item.id, "send")} className="rounded bg-primary-container px-4 py-2 text-on-primary disabled:opacity-50">Notificar al profesional</button><button disabled={busy !== null} onClick={() => act(item.id, "block")} className="rounded border px-4 py-2 disabled:opacity-50">Bloquear</button></div>}
    </article>)}</div>
  </section>;
}

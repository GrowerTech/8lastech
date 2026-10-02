"use client";

import { useCallback, useEffect, useState } from "react";
import { api, qs, type Paged } from "@/lib/admin/api-client";
import { Badge, btnGhost, btnPrimary, inputCls, Modal, PageHeader, Pager, useDebounced } from "./ui";

const STATUSES = ["NEW", "CONTACTED", "IN_DISCUSSION", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST", "ARCHIVED"];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Inq = Record<string, any>;

export default function Inquiries({ permissions }: { permissions: string[] }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [res, setRes] = useState<Paged<Inq>>();
  const [open, setOpen] = useState<Inq | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(() => { api<Paged<Inq>>(`/inquiries${qs({ q: dq, status, page, pageSize: 20 })}`).then(setRes).catch((e) => setErr(e.message)); }, [dq, status, page]);
  useEffect(load, [load]);

  async function view(i: Inq) {
    setOpen(i);
    if (!i.read && permissions.includes("inquiries:write")) { await api(`/inquiries/${i.id}`, { method: "PATCH", json: { read: true } }).catch(() => {}); load(); }
  }

  return (
    <div>
      <PageHeader title="Inquiries" />
      <div className="flex flex-wrap gap-2 mb-4">
        <input className={`${inputCls} max-w-xs`} placeholder="Search…" aria-label="Search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select className={`${inputCls} max-w-[12rem]`} aria-label="Status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {err && <p role="alert" className="text-sm text-destructive mb-3">{err}</p>}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-muted"><tr>{["Name", "Email", "Service", "Status", "Received", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {res?.data.map((i) => (
              <tr key={i.id} className="border-t border-border hover:bg-card-hover/50">
                <td className={`px-4 py-3 ${i.read ? "" : "font-semibold"}`}>{i.read ? "" : "● "}{i.name}</td>
                <td className="px-4 py-3">{i.email}</td>
                <td className="px-4 py-3">{i.service?.name ?? i.projectType ?? "—"}</td>
                <td className="px-4 py-3"><Badge tone="blue">{i.status}</Badge></td>
                <td className="px-4 py-3">{new Date(i.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right"><button className={btnGhost} onClick={() => view(i)}>Open</button></td>
              </tr>
            ))}
            {res?.data.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">No inquiries.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager meta={res?.meta} onPage={setPage} />
      {open && <Detail i={open} canWrite={permissions.includes("inquiries:write")} onClose={() => setOpen(null)} onSaved={() => { setOpen(null); load(); }} />}
    </div>
  );
}

function Detail({ i, canWrite, onClose, onSaved }: { i: Inq; canWrite: boolean; onClose: () => void; onSaved: () => void }) {
  const [status, setStatus] = useState(i.status);
  const [notes, setNotes] = useState(i.internalNotes ?? "");
  const [err, setErr] = useState("");
  async function save() {
    try { await api(`/inquiries/${i.id}`, { method: "PATCH", json: { status, internalNotes: notes } }); onSaved(); } catch (e) { setErr((e as Error).message); }
  }
  return (
    <Modal title={`Inquiry from ${i.name}`} onClose={onClose} wide>
      <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
        {[["Email", i.email], ["Phone", i.phone], ["Company", i.company], ["Subject", i.subject], ["Service", i.service?.name], ["Project type", i.projectType], ["Budget", i.budget], ["Received", new Date(i.createdAt).toLocaleString()]]
          .filter(([, v]) => v).map(([k, v]) => <div key={k}><dt className="text-muted">{k}</dt><dd>{v}</dd></div>)}
      </dl>
      <p className="whitespace-pre-wrap rounded-lg border border-border bg-background p-4 text-sm mb-4">{i.message}</p>
      <div className="grid gap-3">
        <label className="text-sm flex flex-col gap-1.5">Status
          <select className={inputCls} disabled={!canWrite} value={status} onChange={(e) => setStatus(e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        </label>
        <label className="text-sm flex flex-col gap-1.5">Internal notes (never shown publicly)
          <textarea className={`${inputCls} min-h-24`} disabled={!canWrite} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
      </div>
      {err && <p role="alert" className="text-sm text-destructive mt-3">{err}</p>}
      <div className="flex justify-end gap-2 mt-5">
        <button className={btnGhost} onClick={onClose}>Close</button>
        {canWrite && <button className={btnPrimary} onClick={save}>Save</button>}
      </div>
    </Modal>
  );
}

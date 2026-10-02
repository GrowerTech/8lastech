"use client";

import { useCallback, useEffect, useState } from "react";
import { api, qs, type Paged } from "@/lib/admin/api-client";
import { inputCls, PageHeader, Pager, useDebounced } from "./ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type L = Record<string, any>;

export default function AuditLogs() {
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(1);
  const [res, setRes] = useState<Paged<L>>();
  const [err, setErr] = useState("");
  const load = useCallback(() => { api<Paged<L>>(`/audit-logs${qs({ q: dq, entity, page, pageSize: 30 })}`).then(setRes).catch((e) => setErr(e.message)); }, [dq, entity, page]);
  useEffect(load, [load]);
  return (
    <div>
      <PageHeader title="Audit log" />
      <div className="flex gap-2 mb-4">
        <input className={`${inputCls} max-w-xs`} placeholder="Search actor or action…" aria-label="Search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <select className={`${inputCls} max-w-[12rem]`} aria-label="Entity" value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }}>
          <option value="">All entities</option>
          {["AdminUser", "PROJECT", "CLIENT", "SERVICE", "TESTIMONIAL", "TECHNOLOGY", "PROJECT_CATEGORY", "Inquiry", "Media", "CompanySettings", "PageSeo"].map((e) => <option key={e}>{e}</option>)}
        </select>
      </div>
      {err && <p role="alert" className="text-sm text-destructive mb-3">{err}</p>}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-muted"><tr>{["When", "Actor", "Action", "Entity", "IP"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {res?.data.map((l) => (
              <tr key={l.id} className="border-t border-border">
                <td className="px-4 py-2.5 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2.5">{l.actorEmail ?? "—"}</td><td className="px-4 py-2.5 font-mono text-xs">{l.action}</td>
                <td className="px-4 py-2.5">{l.entity}{l.entityId ? ` · ${l.entityId.slice(0, 8)}` : ""}</td><td className="px-4 py-2.5">{l.ipAddress ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager meta={res?.meta} onPage={setPage} />
    </div>
  );
}

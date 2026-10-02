"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiFail, type Paged } from "@/lib/admin/api-client";
import { Badge, btnGhost, btnPrimary, inputCls, Modal, PageHeader, Pager } from "./ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type U = Record<string, any>;
const ROLES = ["SUPER_ADMIN", "ADMIN", "EDITOR"];

export default function AdminUsers({ currentId }: { currentId: string }) {
  const [page, setPage] = useState(1);
  const [res, setRes] = useState<Paged<U>>();
  const [edit, setEdit] = useState<U | "new" | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(() => { api<Paged<U>>(`/admin-users?page=${page}&pageSize=20&order=asc&sort=createdAt`).then(setRes).catch((e) => setErr(e.message)); }, [page]);
  useEffect(load, [load]);

  return (
    <div>
      <PageHeader title="Admin users"><button className={btnPrimary} onClick={() => setEdit("new")}>Add admin</button></PageHeader>
      {err && <p role="alert" className="text-sm text-destructive mb-3">{err}</p>}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-muted"><tr>{["Name", "Email", "Role", "Status", "Last login", ""].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {res?.data.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3">{u.name}</td><td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3"><Badge tone="blue">{u.role}</Badge></td>
                <td className="px-4 py-3">{u.active ? <Badge tone="green">Active</Badge> : <Badge tone="red">Inactive</Badge>}</td>
                <td className="px-4 py-3">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}</td>
                <td className="px-4 py-3 text-right"><button className={btnGhost} onClick={() => setEdit(u)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pager meta={res?.meta} onPage={setPage} />
      {edit && <Form u={edit === "new" ? null : edit} self={edit !== "new" && edit.id === currentId} onClose={() => setEdit(null)} onSaved={() => { setEdit(null); load(); }} />}
    </div>
  );
}

function Form({ u, self, onClose, onSaved }: { u: U | null; self: boolean; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState<U>(u ?? { role: "EDITOR", active: true });
  const [err, setErr] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (u) await api(`/admin-users/${u.id}`, { method: "PATCH", json: { name: v.name, ...(self ? {} : { role: v.role, active: v.active }), ...(v.password ? { password: v.password } : {}) } });
      else await api("/admin-users", { method: "POST", json: { email: v.email, name: v.name, role: v.role, password: v.password } });
      onSaved();
    } catch (e2) { const f = e2 as ApiFail; setErr(f.details?.map((d) => d.message).join("; ") || f.message); }
  }
  return (
    <Modal title={u ? "Edit admin" : "New admin"} onClose={onClose}>
      <form onSubmit={save} className="grid gap-4">
        {!u && <label className="text-sm flex flex-col gap-1.5">Email<input type="email" required className={inputCls} value={v.email ?? ""} onChange={(e) => setV({ ...v, email: e.target.value })} /></label>}
        <label className="text-sm flex flex-col gap-1.5">Name<input required className={inputCls} value={v.name ?? ""} onChange={(e) => setV({ ...v, name: e.target.value })} /></label>
        <label className="text-sm flex flex-col gap-1.5">Role
          <select className={inputCls} disabled={self} value={v.role} onChange={(e) => setV({ ...v, role: e.target.value })}>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        </label>
        {u && !self && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Active</label>}
        <label className="text-sm flex flex-col gap-1.5">{u ? "Reset password (optional)" : "Password"}
          <input type="password" autoComplete="new-password" required={!u} className={inputCls} value={v.password ?? ""} onChange={(e) => setV({ ...v, password: e.target.value })} />
          <span className="text-xs text-muted-2">Min 12 characters with upper case, lower case and a number.</span>
        </label>
        {err && <p role="alert" className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" className={btnGhost} onClick={onClose}>Cancel</button><button className={btnPrimary}>Save</button></div>
      </form>
    </Modal>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiFail, qs, type Paged } from "@/lib/admin/api-client";
import MediaPicker, { type MediaItem } from "./MediaPicker";
import { Badge, btnDanger, btnGhost, btnPrimary, inputCls, Modal, PageHeader, Pager, statusTone, useDebounced } from "./ui";

export type Field = {
  name: string; // payload key
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "select" | "url" | "date" | "list" | "media" | "media-multi" | "relation" | "relation-multi";
  options?: { value: string; label: string }[];
  relation?: { resource: string; label: string };
  required?: boolean;
  help?: string;
  half?: boolean;
  /** Initial form value from a fetched item (defaults to item[name]). */
  read?: (item: Row) => unknown;
  /** Hide for roles without this permission, e.g. status requires content:publish. */
  perm?: string;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;
export type Column = { key: string; label: string; render?: (row: Row) => React.ReactNode };

export type ManagerConfig = {
  resource: string;
  title: string;
  singular: string;
  columns: Column[];
  fields: Field[];
  defaults?: Row;
  hasStatus?: boolean;
  hasFeatured?: boolean;
  reorderable?: boolean;
  previewHref?: (row: Row) => string;
};

const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];

export default function ResourceManager({ config, permissions }: { config: ManagerConfig; permissions: string[] }) {
  const can = (p: string) => permissions.includes(p);
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [res, setRes] = useState<Paged<Row>>();
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  const sort = config.reorderable ? "displayOrder" : "createdAt";
  const load = useCallback(() => {
    api<Paged<Row>>(`/${config.resource}${qs({ q: dq, status, page, pageSize: 20, sort, order: config.reorderable ? "asc" : "desc" })}`)
      .then((r) => { setRes(r); setError(""); })
      .catch((e) => setError(e.message));
  }, [config.resource, dq, status, page, sort, config.reorderable]);
  useEffect(load, [load]);

  async function act(fn: () => Promise<unknown>) {
    setError("");
    try { await fn(); load(); } catch (e) { setError((e as Error).message); }
  }
  const patch = (row: Row, json: Row) => act(() => api(`/${config.resource}/${row.id}`, { method: "PATCH", json }));
  const remove = (row: Row) => confirm(`Delete this ${config.singular}? This cannot be undone.`) && act(() => api(`/${config.resource}/${row.id}`, { method: "DELETE" }));
  async function move(i: number, dir: -1 | 1) {
    if (!res) return;
    const ids = res.data.map((r) => r.id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    // Reorder only rewrites positions of the visible page; offset keeps pages consistent.
    const offsetIds = res.meta.page === 1 ? ids : null;
    if (!offsetIds) return setError("Reordering is available on the first page. Narrow with search/filter or increase usable space.");
    act(() => api(`/${config.resource}/reorder`, { method: "POST", json: { ids } }));
  }

  return (
    <div>
      <PageHeader title={config.title}>
        {can("content:write") && <button className={btnPrimary} onClick={() => setEditing("new")}>Add {config.singular}</button>}
      </PageHeader>
      <div className="flex flex-wrap gap-2 mb-4">
        <input className={`${inputCls} max-w-xs`} placeholder="Search…" aria-label="Search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        {config.hasStatus && (
          <select className={`${inputCls} max-w-[11rem]`} aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-destructive mb-3">{error}</p>}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-muted">
            <tr>
              {config.columns.map((c) => <th key={c.key} className="px-4 py-3 font-medium">{c.label}</th>)}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {res?.data.map((row, i) => (
              <tr key={row.id} className="border-t border-border hover:bg-card-hover/50">
                {config.columns.map((c) => (
                  <td key={c.key} className="px-4 py-3 align-middle">
                    {c.render ? c.render(row) : c.key === "status" ? <Badge tone={statusTone(row.status)}>{row.status}</Badge> : String(row[c.key] ?? "—")}
                  </td>
                ))}
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex justify-end gap-1.5">
                    {config.reorderable && can("content:write") && !q && !status && (
                      <>
                        <button className={btnGhost} aria-label="Move up" onClick={() => move(i, -1)}>↑</button>
                        <button className={btnGhost} aria-label="Move down" onClick={() => move(i, 1)}>↓</button>
                      </>
                    )}
                    {config.previewHref && <a className={btnGhost} href={config.previewHref(row)} target="_blank" rel="noopener noreferrer">Preview</a>}
                    {config.hasStatus && can("content:publish") && (
                      row.status === "PUBLISHED" ? <button className={btnGhost} onClick={() => patch(row, { status: "DRAFT" })}>Unpublish</button>
                      : row.status === "ARCHIVED" ? <button className={btnGhost} onClick={() => patch(row, { status: "DRAFT" })}>Restore</button>
                      : <button className={btnGhost} onClick={() => patch(row, { status: "PUBLISHED" })}>Publish</button>
                    )}
                    {config.hasStatus && can("content:publish") && row.status !== "ARCHIVED" && <button className={btnGhost} onClick={() => patch(row, { status: "ARCHIVED" })}>Archive</button>}
                    {config.hasFeatured && can("content:publish") && <button className={btnGhost} onClick={() => patch(row, { featured: !row.featured })}>{row.featured ? "Unfeature" : "Feature"}</button>}
                    {can("content:write") && <button className={btnGhost} onClick={() => setEditing(row)}>Edit</button>}
                    {can("content:delete") && <button className={btnDanger} onClick={() => remove(row)}>Delete</button>}
                  </div>
                </td>
              </tr>
            ))}
            {res && res.data.length === 0 && <tr><td colSpan={config.columns.length + 1} className="px-4 py-10 text-center text-muted">Nothing here yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <Pager meta={res?.meta} onPage={setPage} />
      {editing && (
        <RowForm
          config={config}
          row={editing === "new" ? null : editing}
          can={can}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

// ───────── Form ─────────

function initial(config: ManagerConfig, row: Row | null): Row {
  const v: Row = { ...(config.defaults ?? {}) };
  if (!row) return v;
  for (const f of config.fields) v[f.name] = f.read ? f.read(row) : row[f.name] ?? v[f.name];
  return v;
}

function RowForm({ config, row, can, onClose, onSaved }: { config: ManagerConfig; row: Row | null; can: (p: string) => boolean; onClose: () => void; onSaved: () => void }) {
  const [v, setV] = useState<Row>(() => initial(config, row));
  const [err, setErr] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const set = (k: string, val: unknown) => setV((s) => ({ ...s, [k]: val }));

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr([]);
    const payload: Row = {};
    for (const f of config.fields) {
      if (f.perm && !can(f.perm)) continue;
      let val = v[f.name];
      if (f.type === "media") val = val?.id ?? null;
      if (f.type === "media-multi") { payload[f.name] = (val ?? []).map((m: MediaItem) => ({ mediaId: m.id })); continue; }
      if (f.type === "number") val = val === "" || val == null ? undefined : Number(val);
      if (f.type === "date") val = val ? new Date(val).toISOString() : null;
      if ((f.type === "url" || f.type === "relation") && val === "") val = f.type === "url" ? null : null;
      if (val !== undefined) payload[f.name] = val;
    }
    try {
      await api(row ? `/${config.resource}/${row.id}` : `/${config.resource}`, { method: row ? "PATCH" : "POST", json: payload });
      onSaved();
    } catch (e) {
      const f = e as ApiFail;
      setErr(f.details?.map((d) => `${d.path}: ${d.message}`) ?? [f.message]);
      setBusy(false);
    }
  }

  return (
    <Modal title={`${row ? "Edit" : "New"} ${config.singular}`} onClose={onClose} wide>
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        {config.fields.filter((f) => !f.perm || can(f.perm)).map((f) => (
          <div key={f.name} className={f.half ? "" : "sm:col-span-2"}>
            <FieldInput f={f} value={v[f.name]} onChange={(x) => set(f.name, x)} />
            {f.help && <p className="text-xs text-muted-2 mt-1">{f.help}</p>}
          </div>
        ))}
        {err.length > 0 && <ul role="alert" className="sm:col-span-2 text-sm text-destructive list-disc pl-5">{err.map((m) => <li key={m}>{m}</li>)}</ul>}
        <div className="sm:col-span-2 flex justify-end gap-2">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button disabled={busy} className={btnPrimary}>{busy ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </Modal>
  );
}

function Label({ f, children }: { f: Field; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-foreground/90">{f.label}{f.required && <span className="text-destructive"> *</span>}</span>
      {children}
    </label>
  );
}

function FieldInput({ f, value, onChange }: { f: Field; value: unknown; onChange: (v: unknown) => void }) {
  const [picker, setPicker] = useState(false);
  const [opts, setOpts] = useState<{ value: string; label: string }[]>(f.options ?? []);
  useEffect(() => {
    if (f.relation)
      api<Paged<Row>>(`/${f.relation.resource}?pageSize=100&sort=${f.relation.label}&order=asc`)
        .then((r) => setOpts(r.data.map((x) => ({ value: x.id, label: x[f.relation!.label] }))))
        .catch(() => {});
  }, [f.relation]);

  switch (f.type) {
    case "textarea":
      return <Label f={f}><textarea className={`${inputCls} min-h-28`} required={f.required} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} /></Label>;
    case "boolean":
      return <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} /> {f.label}</label>;
    case "select":
      return <Label f={f}><select className={inputCls} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Label>;
    case "relation":
      return <Label f={f}><select className={inputCls} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value || null)}><option value="">— none —</option>{opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Label>;
    case "relation-multi": {
      const sel = (value as string[]) ?? [];
      return (
        <fieldset className="text-sm">
          <legend className="mb-1.5">{f.label}</legend>
          <div className="flex flex-wrap gap-2">
            {opts.map((o) => {
              const on = sel.includes(o.value);
              return <button type="button" key={o.value} aria-pressed={on} onClick={() => onChange(on ? sel.filter((x) => x !== o.value) : [...sel, o.value])} className={`rounded-full border px-3 py-1 ${on ? "border-accent bg-accent/15 text-accent-2" : "border-border text-muted"}`}>{o.label}</button>;
            })}
            {opts.length === 0 && <span className="text-muted-2">None available yet.</span>}
          </div>
        </fieldset>
      );
    }
    case "list": {
      const list = (value as string[]) ?? [];
      return <Label f={f}><textarea className={`${inputCls} min-h-24`} placeholder="One per line" value={list.join("\n")} onChange={(e) => onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean))} /></Label>;
    }
    case "media": {
      const m = value as MediaItem | null;
      return (
        <div className="text-sm">
          <p className="mb-1.5">{f.label}</p>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {m ? <img src={m.url} alt={m.alt || ""} className="h-16 w-16 rounded-lg object-cover border border-border" /> : <div className="h-16 w-16 rounded-lg border border-dashed border-border" />}
            <button type="button" className={btnGhost} onClick={() => setPicker(true)}>{m ? "Change" : "Choose"}</button>
            {m && <button type="button" className={btnGhost} onClick={() => onChange(null)}>Remove</button>}
          </div>
          {picker && <MediaPicker onClose={() => setPicker(false)} onPick={(x) => { onChange(x); setPicker(false); }} />}
        </div>
      );
    }
    case "media-multi": {
      const list = (value as MediaItem[]) ?? [];
      const mv = (i: number, d: number) => { const n = [...list]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
      return (
        <div className="text-sm">
          <p className="mb-1.5">{f.label}</p>
          <div className="flex flex-wrap gap-3">
            {list.map((m, i) => (
              <div key={m.id} className="w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt={m.alt || ""} className="h-24 w-24 rounded-lg object-cover border border-border" />
                <div className="flex justify-between mt-1 text-xs">
                  <button type="button" aria-label="Move earlier" onClick={() => mv(i, -1)}>←</button>
                  <button type="button" aria-label="Remove" onClick={() => onChange(list.filter((x) => x.id !== m.id))}>✕</button>
                  <button type="button" aria-label="Move later" onClick={() => mv(i, 1)}>→</button>
                </div>
              </div>
            ))}
            <button type="button" className={btnGhost} onClick={() => setPicker(true)}>Add image</button>
          </div>
          {picker && <MediaPicker onClose={() => setPicker(false)} onPick={(x) => { if (!list.some((l) => l.id === x.id)) onChange([...list, x]); setPicker(false); }} />}
        </div>
      );
    }
    case "date":
      return <Label f={f}><input type="date" className={inputCls} value={value ? String(value).slice(0, 10) : ""} onChange={(e) => onChange(e.target.value)} /></Label>;
    case "number":
      return <Label f={f}><input type="number" min={0} className={inputCls} value={(value as number) ?? ""} onChange={(e) => onChange(e.target.value)} /></Label>;
    default:
      return <Label f={f}><input type={f.type === "url" ? "url" : "text"} className={inputCls} required={f.required} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} /></Label>;
  }
}

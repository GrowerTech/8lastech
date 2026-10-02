"use client";

import { useCallback, useEffect, useState } from "react";
import { api, qs, type Paged } from "@/lib/admin/api-client";
import { uploadMedia, type MediaItem } from "./MediaPicker";
import { btnDanger, btnGhost, btnPrimary, inputCls, Modal, PageHeader, Pager, useDebounced } from "./ui";

export default function MediaLibrary({ permissions }: { permissions: string[] }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [page, setPage] = useState(1);
  const [res, setRes] = useState<Paged<MediaItem>>();
  const [sel, setSel] = useState<MediaItem | null>(null);
  const [err, setErr] = useState("");
  const canWrite = permissions.includes("media:write");

  const load = useCallback(() => { api<Paged<MediaItem>>(`/media${qs({ q: dq, page, pageSize: 24 })}`).then(setRes).catch((e) => setErr(e.message)); }, [dq, page]);
  useEffect(load, [load]);
  const run = async (fn: () => Promise<unknown>) => { setErr(""); try { await fn(); load(); } catch (e) { setErr((e as Error).message); } };

  return (
    <div>
      <PageHeader title="Media">
        {canWrite && (
          <label className={`${btnPrimary} cursor-pointer`}>
            Upload
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only"
              onChange={(e) => { const files = [...(e.target.files ?? [])]; e.target.value = ""; run(async () => { for (const f of files) await uploadMedia(f); }); }} />
          </label>
        )}
      </PageHeader>
      <input className={`${inputCls} max-w-xs mb-4`} placeholder="Search…" aria-label="Search media" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      {err && <p role="alert" className="text-sm text-destructive mb-3">{err}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {res?.data.map((m) => (
          <button key={m.id} onClick={() => setSel(m)} className="rounded-lg border border-border overflow-hidden hover:border-accent-2 text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.alt} loading="lazy" className="aspect-square w-full object-cover" />
            <span className="block truncate px-2 py-1 text-xs text-muted">{m.filename}</span>
          </button>
        ))}
      </div>
      {res?.data.length === 0 && <p className="text-muted text-sm py-10 text-center">No media uploaded yet.</p>}
      <Pager meta={res?.meta} onPage={setPage} />
      {sel && <Detail m={sel} canWrite={canWrite} canDelete={permissions.includes("content:delete")} onClose={() => setSel(null)} onChanged={() => { setSel(null); load(); }} />}
    </div>
  );
}

function Detail({ m, canWrite, canDelete, onClose, onChanged }: { m: MediaItem; canWrite: boolean; canDelete: boolean; onClose: () => void; onChanged: () => void }) {
  const [alt, setAlt] = useState(m.alt);
  const [caption, setCaption] = useState(m.caption ?? "");
  const [err, setErr] = useState("");
  const run = async (fn: () => Promise<unknown>) => { setErr(""); try { await fn(); onChanged(); } catch (e) { setErr((e as Error).message); } };
  return (
    <Modal title={m.filename} onClose={onClose}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={m.url} alt={m.alt} className="max-h-64 mx-auto rounded-lg mb-4" />
      <p className="text-xs text-muted mb-4">{m.width}×{m.height} · {m.size ? Math.round(m.size / 1024) : "?"} KB · <a className="underline" href={m.url} target="_blank" rel="noopener noreferrer">open</a></p>
      <div className="flex flex-col gap-3">
        <label className="text-sm flex flex-col gap-1.5">Alt text<input className={inputCls} value={alt} disabled={!canWrite} onChange={(e) => setAlt(e.target.value)} /></label>
        <label className="text-sm flex flex-col gap-1.5">Caption<input className={inputCls} value={caption} disabled={!canWrite} onChange={(e) => setCaption(e.target.value)} /></label>
      </div>
      {err && <p role="alert" className="text-sm text-destructive mt-3">{err}</p>}
      <div className="flex flex-wrap justify-between gap-2 mt-5">
        <div className="flex gap-2">
          {canWrite && (
            <label className={`${btnGhost} cursor-pointer`}>
              Replace file
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { const fd = new FormData(); fd.set("file", f); run(() => api(`/media/${m.id}`, { method: "PUT", body: fd })); } }} />
            </label>
          )}
          {canDelete && <button className={btnDanger} onClick={() => confirm("Delete this file?") && run(() => api(`/media/${m.id}`, { method: "DELETE" }))}>Delete</button>}
        </div>
        {canWrite && <button className={btnPrimary} onClick={() => run(() => api(`/media/${m.id}`, { method: "PATCH", json: { alt, caption } }))}>Save</button>}
      </div>
    </Modal>
  );
}

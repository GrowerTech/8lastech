"use client";

import { useCallback, useEffect, useState } from "react";
import { api, qs, type Paged } from "@/lib/admin/api-client";
import { btnGhost, btnPrimary, inputCls, Modal, Pager, useDebounced } from "./ui";

export type MediaItem = { id: string; url: string; alt: string; filename: string; width?: number | null; height?: number | null; size?: number; caption?: string };

export async function uploadMedia(file: File, alt = ""): Promise<MediaItem> {
  const fd = new FormData();
  fd.set("file", file);
  fd.set("alt", alt);
  const r = await api<{ data: MediaItem }>("/media", { method: "POST", body: fd });
  return r.data;
}

export default function MediaPicker({ onPick, onClose }: { onPick: (m: MediaItem) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const [page, setPage] = useState(1);
  const [res, setRes] = useState<Paged<MediaItem>>();
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    api<Paged<MediaItem>>(`/media${qs({ q: dq, page, pageSize: 24 })}`).then(setRes).catch((e) => setErr(e.message));
  }, [dq, page]);
  useEffect(load, [load]);

  async function onFile(f?: File) {
    if (!f) return;
    setErr("");
    try {
      onPick(await uploadMedia(f));
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  return (
    <Modal title="Choose media" onClose={onClose} wide>
      <div className="flex gap-2 mb-4">
        <input className={inputCls} placeholder="Search files…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        <label className={`${btnPrimary} cursor-pointer whitespace-nowrap`}>
          Upload
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
      </div>
      {err && <p role="alert" className="text-sm text-destructive mb-3">{err}</p>}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {res?.data.map((m) => (
          <button key={m.id} type="button" onClick={() => onPick(m)} className="group rounded-lg border border-border overflow-hidden hover:border-accent-2 text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.url} alt={m.alt} loading="lazy" className="aspect-square w-full object-cover" />
            <span className="block truncate px-2 py-1 text-xs text-muted">{m.filename}</span>
          </button>
        ))}
      </div>
      {res && res.data.length === 0 && <p className="text-sm text-muted py-6 text-center">No media yet. Upload an image.</p>}
      <Pager meta={res?.meta} onPage={setPage} />
      <div className="mt-4 flex justify-end"><button className={btnGhost} onClick={onClose}>Cancel</button></div>
    </Modal>
  );
}

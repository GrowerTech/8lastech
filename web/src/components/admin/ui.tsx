"use client";

import { useEffect, useState } from "react";

export const inputCls =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-2 focus:border-accent-2 focus:outline-none";
export const btn =
  "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50";
export const btnPrimary = `${btn} bg-accent text-on-accent hover:bg-accent-2`;
export const btnGhost = `${btn} border border-border text-foreground hover:bg-card-hover`;
export const btnDanger = `${btn} border border-destructive/50 text-destructive hover:bg-destructive/10`;

export function PageHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 className="font-heading text-2xl font-semibold">{title}</h1>
      <div className="flex gap-2">{children}</div>
    </div>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`w-full ${wide ? "max-w-3xl" : "max-w-xl"} max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-muted hover:text-foreground text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Pager({ meta, onPage }: { meta?: { page: number; totalPages: number; total: number }; onPage: (p: number) => void }) {
  if (!meta) return null;
  return (
    <div className="flex items-center justify-between mt-4 text-sm text-muted">
      <span>{meta.total} total</span>
      <div className="flex items-center gap-2">
        <button className={btnGhost} disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Prev</button>
        <span>{meta.page} / {meta.totalPages}</span>
        <button className={btnGhost} disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Next</button>
      </div>
    </div>
  );
}

export function Badge({ children, tone = "muted" }: { children: React.ReactNode; tone?: "muted" | "green" | "amber" | "red" | "blue" }) {
  const t = { muted: "bg-border text-muted", green: "bg-emerald-500/15 text-emerald-400", amber: "bg-amber-500/15 text-amber-400", red: "bg-red-500/15 text-red-400", blue: "bg-accent/15 text-accent-2" }[tone];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

export const statusTone = (s: string) => (s === "PUBLISHED" ? "green" : s === "ARCHIVED" ? "red" : "amber") as "green" | "red" | "amber";

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms, setV]);
  return v;
}

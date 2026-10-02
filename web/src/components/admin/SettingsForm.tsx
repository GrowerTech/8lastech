"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/admin/api-client";
import MediaPicker, { type MediaItem } from "./MediaPicker";
import { btnGhost, btnPrimary, inputCls, PageHeader } from "./ui";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type S = Record<string, any>;
const SOCIALS = ["linkedin", "twitter", "facebook", "instagram", "github"];
const SEO_PAGES = ["home"];

export default function SettingsForm({ permissions }: { permissions: string[] }) {
  const [s, setS] = useState<S>();
  const [seo, setSeo] = useState<Record<string, S>>({});
  const [msg, setMsg] = useState("");
  const [picker, setPicker] = useState<"logo" | "favicon" | null>(null);
  const canSettings = permissions.includes("settings:write");
  const canSeo = permissions.includes("seo:write");

  useEffect(() => {
    api<{ data: S }>("/settings").then((r) => setS(r.data)).catch((e) => setMsg(e.message));
    api<{ data: S[] }>("/seo").then((r) => setSeo(Object.fromEntries(r.data.map((x) => [x.key, x])))).catch(() => {});
  }, []);
  if (!s) return <p className="text-muted">{msg || "Loading…"}</p>;
  const set = (k: string, v: unknown) => setS((x) => ({ ...x!, [k]: v }));

  async function saveSettings() {
    setMsg("");
    try {
      const body = {
        companyName: s!.companyName, tagline: s!.tagline, description: s!.description, email: s!.email, whatsapp: s!.whatsapp,
        address: s!.address, businessHours: s!.businessHours, copyright: s!.copyright, phones: s!.phones,
        socialLinks: s!.socialLinks ?? {}, logoId: s!.logo?.id ?? null, faviconId: s!.favicon?.id ?? null,
      };
      await api("/settings", { method: "PUT", json: body });
      setMsg("Settings saved.");
    } catch (e) { setMsg((e as Error).message); }
  }
  async function saveSeo(key: string) {
    const x = seo[key] ?? {};
    try {
      await api(`/seo/${key}`, { method: "PUT", json: { seoTitle: x.seoTitle ?? "", metaDescription: x.metaDescription ?? "", canonicalUrl: x.canonicalUrl || null, ogTitle: x.ogTitle ?? "", ogDescription: x.ogDescription ?? "", robots: x.robots ?? "index,follow" } });
      setMsg(`SEO for "${key}" saved.`);
    } catch (e) { setMsg((e as Error).message); }
  }

  const T = (k: string, label: string, ta = false) => (
    <label className="text-sm flex flex-col gap-1.5">{label}
      {ta ? <textarea className={`${inputCls} min-h-20`} disabled={!canSettings} value={s[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
          : <input className={inputCls} disabled={!canSettings} value={s[k] ?? ""} onChange={(e) => set(k, e.target.value)} />}
    </label>
  );

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings & SEO" />
      {msg && <p role="status" className="text-sm text-accent-2 mb-4">{msg}</p>}
      <section className="rounded-2xl border border-border bg-card p-6 grid gap-4 sm:grid-cols-2 mb-6">
        <h2 className="sm:col-span-2 font-heading font-semibold">Company</h2>
        {T("companyName", "Company name")}{T("tagline", "Tagline")}
        <div className="sm:col-span-2">{T("description", "Description", true)}</div>
        {T("email", "Email")}{T("whatsapp", "WhatsApp")}
        <label className="text-sm flex flex-col gap-1.5">Phones (one per line)
          <textarea className={`${inputCls} min-h-20`} disabled={!canSettings} value={(s.phones ?? []).join("\n")} onChange={(e) => set("phones", e.target.value.split("\n").map((x) => x.trim()).filter(Boolean))} />
        </label>
        {T("address", "Address")}{T("businessHours", "Business hours")}{T("copyright", "Copyright line")}
        {SOCIALS.map((k) => (
          <label key={k} className="text-sm flex flex-col gap-1.5 capitalize">{k} URL
            <input className={inputCls} disabled={!canSettings} value={s.socialLinks?.[k] ?? ""} onChange={(e) => set("socialLinks", { ...(s.socialLinks ?? {}), [k]: e.target.value })} />
          </label>
        ))}
        {(["logo", "favicon"] as const).map((k) => (
          <div key={k} className="text-sm capitalize">
            <p className="mb-1.5">{k}</p>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {s[k]?.url ? <img src={s[k].url} alt="" className="h-12 w-12 rounded-lg object-contain border border-border" /> : <div className="h-12 w-12 rounded-lg border border-dashed border-border" />}
              {canSettings && <button type="button" className={btnGhost} onClick={() => setPicker(k)}>Choose</button>}
            </div>
          </div>
        ))}
        {canSettings && <div className="sm:col-span-2 flex justify-end"><button className={btnPrimary} onClick={saveSettings}>Save settings</button></div>}
      </section>
      {SEO_PAGES.map((key) => {
        const x = seo[key] ?? {};
        const up = (k: string, v: string) => setSeo((p) => ({ ...p, [key]: { ...(p[key] ?? {}), [k]: v } }));
        return (
          <section key={key} className="rounded-2xl border border-border bg-card p-6 grid gap-4 mb-6">
            <h2 className="font-heading font-semibold capitalize">SEO — {key} page</h2>
            {([["seoTitle", "SEO title"], ["metaDescription", "Meta description"], ["canonicalUrl", "Canonical URL"], ["ogTitle", "Open Graph title"], ["ogDescription", "Open Graph description"]] as const).map(([k, label]) => (
              <label key={k} className="text-sm flex flex-col gap-1.5">{label}
                <input className={inputCls} disabled={!canSeo} value={x[k] ?? ""} onChange={(e) => up(k, e.target.value)} />
              </label>
            ))}
            <label className="text-sm flex flex-col gap-1.5">Robots
              <select className={inputCls} disabled={!canSeo} value={x.robots ?? "index,follow"} onChange={(e) => up("robots", e.target.value)}>
                {["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"].map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            {canSeo && <div className="flex justify-end"><button className={btnPrimary} onClick={() => saveSeo(key)}>Save SEO</button></div>}
          </section>
        );
      })}
      {picker && <MediaPicker onClose={() => setPicker(null)} onPick={(m: MediaItem) => { set(picker, { id: m.id, url: m.url }); setPicker(null); }} />}
    </div>
  );
}

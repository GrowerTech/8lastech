"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/admin/api-client";
import { Badge, btnGhost, btnPrimary, PageHeader, statusTone } from "./ui";

type D = {
  totalProjects: number; publishedProjects: number; totalClients: number; activeServices: number; testimonials: number; unreadInquiries: number | null;
  recentProjects: { id: string; title: string; status: string; createdAt: string }[];
  recentInquiries: { id: string; name: string; email: string; status: string; read: boolean; createdAt: string }[] | null;
  recentActivity: { id: string; action: string; entity: string; actorEmail: string | null; createdAt: string }[] | null;
};

const when = (s: string) => new Date(s).toLocaleString();

export default function Dashboard({ permissions }: { permissions: string[] }) {
  const [d, setD] = useState<D>();
  const [err, setErr] = useState("");
  useEffect(() => { api<{ data: D }>("/dashboard").then((r) => setD(r.data)).catch((e) => setErr(e.message)); }, []);
  const can = (p: string) => permissions.includes(p);

  const stats: [string, number | null | undefined][] = [
    ["Total projects", d?.totalProjects], ["Published projects", d?.publishedProjects], ["Clients", d?.totalClients],
    ["Active services", d?.activeServices], ["Unread inquiries", d?.unreadInquiries], ["Testimonials", d?.testimonials],
  ];
  return (
    <div>
      <PageHeader title="Dashboard">
        <Link className={btnPrimary} href="/admin/projects">Add project</Link>
        <Link className={btnGhost} href="/admin/clients">Add client</Link>
        <Link className={btnGhost} href="/admin/services">Add service</Link>
        {can("inquiries:read") && <Link className={btnGhost} href="/admin/inquiries">View inquiries</Link>}
        <Link className={btnGhost} href="/admin/media">Upload media</Link>
      </PageHeader>
      {err && <p role="alert" className="text-destructive text-sm mb-4">{err}</p>}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.filter(([, v]) => v !== null).map(([label, v]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="font-heading text-3xl font-semibold mt-1">{v ?? "…"}</p>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Panel title="Recent projects">
          {d?.recentProjects.map((p) => <Row key={p.id} left={p.title} right={<Badge tone={statusTone(p.status)}>{p.status}</Badge>} sub={when(p.createdAt)} />)}
        </Panel>
        {d?.recentInquiries && (
          <Panel title="Recent inquiries">
            {d.recentInquiries.map((i) => <Row key={i.id} left={`${i.read ? "" : "● "}${i.name}`} right={<Badge tone="blue">{i.status}</Badge>} sub={i.email} />)}
          </Panel>
        )}
        {d?.recentActivity && (
          <Panel title="Recent activity">
            {d.recentActivity.map((a) => <Row key={a.id} left={a.action} right={null} sub={`${a.actorEmail ?? "system"} · ${when(a.createdAt)}`} />)}
          </Panel>
        )}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-heading font-semibold mb-3">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
function Row({ left, right, sub }: { left: string; right: React.ReactNode; sub: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <div className="min-w-0"><p className="truncate">{left}</p><p className="text-xs text-muted truncate">{sub}</p></div>
      {right}
    </div>
  );
}

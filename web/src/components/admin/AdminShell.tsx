"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { api } from "@/lib/admin/api-client";

type Item = { href: string; label: string; perm?: string };
const NAV: Item[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/project-categories", label: "Categories" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/technologies", label: "Technologies" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/inquiries", label: "Inquiries", perm: "inquiries:read" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/settings", label: "Settings & SEO" },
  { href: "/admin/admins", label: "Admin users", perm: "admins:manage" },
  { href: "/admin/audit-logs", label: "Audit log", perm: "audit:read" },
];

export default function AdminShell({
  user,
  permissions,
  children,
}: {
  user: { name: string; email: string; role: string };
  permissions: string[];
  children: React.ReactNode;
}) {
  const path = usePathname();
  const items = NAV.filter((n) => !n.perm || permissions.includes(n.perm));

  async function logout() {
    await api("/auth/logout", { method: "POST" }).catch(() => {});
    window.location.href = "/admin/login";
  }

  return (
    <div className="md:flex min-h-screen">
      <aside className="md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-border bg-card p-4 md:sticky md:top-0 md:h-screen md:overflow-y-auto flex flex-col gap-4">
        <div>
          <p className="font-heading font-semibold">Atlas Admin</p>
          <p className="text-xs text-muted truncate">{user.name} · {user.role.replace("_", " ").toLowerCase()}</p>
        </div>
        <nav aria-label="Admin" className="flex md:flex-col gap-1 overflow-x-auto">
          {items.map((n) => {
            const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-accent/15 text-accent-2" : "text-muted hover:bg-card-hover hover:text-foreground"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={logout} className="md:mt-auto text-left rounded-lg px-3 py-2 text-sm text-muted hover:bg-card-hover hover:text-foreground">
          Sign out
        </button>
      </aside>
      <main className="flex-1 min-w-0 p-6 md:p-10">{children}</main>
    </div>
  );
}

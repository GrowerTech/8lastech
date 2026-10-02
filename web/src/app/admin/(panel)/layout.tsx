import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/server/session";
import { ROLE_PERMISSIONS } from "@/lib/server/permissions";
import AdminShell from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

// Server-side gate: no admin UI is rendered without a valid DB-backed session.
// (Every data call is independently protected by the API.)
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return (
    <AdminShell user={admin} permissions={[...ROLE_PERMISSIONS[admin.role]]}>
      {children}
    </AdminShell>
  );
}

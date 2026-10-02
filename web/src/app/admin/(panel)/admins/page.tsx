import { getCurrentAdmin } from "@/lib/server/session";
import { can } from "@/lib/server/permissions";
import { notFound } from "next/navigation";
import AdminUsers from "@/components/admin/AdminUsers";

export default async function Page() {
  const admin = await getCurrentAdmin();
  if (!admin) notFound();
  if (!can(admin.role, "admins:manage")) notFound();
  return <AdminUsers currentId={admin.id} />;
}

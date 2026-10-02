import { notFound } from "next/navigation";
import { getCurrentAdmin } from "@/lib/server/session";
import { ROLE_PERMISSIONS } from "@/lib/server/permissions";
import Dashboard from "@/components/admin/Dashboard";

export default async function Page() {
  const admin = await getCurrentAdmin();
  if (!admin) notFound();
  return <Dashboard permissions={[...ROLE_PERMISSIONS[admin.role]]} />;
}

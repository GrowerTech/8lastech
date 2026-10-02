import { getCurrentAdmin } from "@/lib/server/session";
import { ROLE_PERMISSIONS } from "@/lib/server/permissions";
import { notFound } from "next/navigation";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function Page() {
  const admin = await getCurrentAdmin();
  if (!admin) notFound();
  const permissions = [...ROLE_PERMISSIONS[admin.role]];
  
  return <SettingsForm permissions={permissions} />;
}

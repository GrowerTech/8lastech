import { getCurrentAdmin } from "@/lib/server/session";
import { ROLE_PERMISSIONS, can } from "@/lib/server/permissions";
import { notFound } from "next/navigation";
import Inquiries from "@/components/admin/Inquiries";

export default async function Page() {
  const admin = await getCurrentAdmin();
  if (!admin) notFound();
  const permissions = [...ROLE_PERMISSIONS[admin.role]];
  if (!can(admin.role, "inquiries:read")) notFound();
  return <Inquiries permissions={permissions} />;
}

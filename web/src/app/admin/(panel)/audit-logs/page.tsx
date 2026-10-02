import { getCurrentAdmin } from "@/lib/server/session";
import { can } from "@/lib/server/permissions";
import { notFound } from "next/navigation";
import AuditLogs from "@/components/admin/AuditLogs";

export default async function Page() {
  const admin = await getCurrentAdmin();
  if (!admin) notFound();
  if (!can(admin.role, "audit:read")) notFound();
  return <AuditLogs />;
}

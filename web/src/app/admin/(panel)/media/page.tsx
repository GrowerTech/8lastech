import { getCurrentAdmin } from "@/lib/server/session";
import { ROLE_PERMISSIONS } from "@/lib/server/permissions";
import { notFound } from "next/navigation";
import MediaLibrary from "@/components/admin/MediaLibrary";

export default async function Page() {
  const admin = await getCurrentAdmin();
  if (!admin) notFound();
  const permissions = [...ROLE_PERMISSIONS[admin.role]];
  
  return <MediaLibrary permissions={permissions} />;
}

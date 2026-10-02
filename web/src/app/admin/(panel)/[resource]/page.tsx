import { notFound } from "next/navigation";
import { getCurrentAdmin } from "@/lib/server/session";
import { ROLE_PERMISSIONS } from "@/lib/server/permissions";
import ResourcePage from "@/components/admin/ResourcePage";

const KNOWN = ["projects", "project-categories", "clients", "services", "technologies", "testimonials"];

export default async function Page({ params }: PageProps<"/admin/[resource]">) {
  const { resource } = await params;
  if (!KNOWN.includes(resource)) notFound();
  const admin = await getCurrentAdmin();
  if (!admin) notFound();
  return <ResourcePage resource={resource} permissions={[...ROLE_PERMISSIONS[admin.role]]} />;
}

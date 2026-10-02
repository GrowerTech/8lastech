import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/server/session";
import LoginForm from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");
  return (
    <main className="min-h-screen grid place-items-center px-6">
      <LoginForm />
    </main>
  );
}

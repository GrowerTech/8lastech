import { ok, publicRoute } from "@/lib/server/api";
import { unauthorized } from "@/lib/server/errors";
import { SESSION_COOKIE, userFromToken } from "@/lib/server/session";
import { ROLE_PERMISSIONS } from "@/lib/server/permissions";

export const GET = publicRoute(async (req) => {
  const admin = await userFromToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!admin) throw unauthorized();
  return ok({ ...admin, permissions: [...ROLE_PERMISSIONS[admin.role]] });
});

import { ok, publicRoute, assertSameOrigin, clientIp } from "@/lib/server/api";
import { SESSION_COOKIE, clearSessionCookie, destroySession, userFromToken } from "@/lib/server/session";
import { audit } from "@/lib/server/audit";

export const POST = publicRoute(async (req) => {
  assertSameOrigin(req);
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const admin = await userFromToken(token);
  await destroySession(token);
  await clearSessionCookie();
  if (admin) await audit({ actor: admin, action: "ADMIN_LOGOUT", entity: "AdminUser", entityId: admin.id, ip: clientIp(req) });
  return ok({ loggedOut: true });
});

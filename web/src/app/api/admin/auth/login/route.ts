import { z } from "zod";
import { ok, publicRoute, parseBody, assertSameOrigin, clientIp } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { ApiError, tooMany } from "@/lib/server/errors";
import { verifyPassword } from "@/lib/server/password";
import { rateLimit } from "@/lib/server/rate-limit";
import { createSession, setSessionCookie } from "@/lib/server/session";
import { audit } from "@/lib/server/audit";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(128) });
const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000;

const invalid = () => new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password");

export const POST = publicRoute(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req) ?? "unknown";
  const ipLimit = rateLimit(`login:ip:${ip}`, 20, 15 * 60_000);
  if (!ipLimit.ok) throw tooMany("Too many login attempts", ipLimit.retryAfter);

  const { email, password } = await parseBody(req, schema);
  const emailLimit = rateLimit(`login:email:${email}`, 10, 15 * 60_000);
  if (!emailLimit.ok) throw tooMany("Too many login attempts", emailLimit.retryAfter);

  const user = await db.adminUser.findUnique({ where: { email } });
  const locked = !!user?.lockedUntil && user.lockedUntil > new Date();
  // Always run a password verification so response time doesn't reveal account state.
  const valid = await verifyPassword(user?.passwordHash ?? null, password);

  if (!user || !user.active || locked || !valid) {
    if (user && !locked && !valid) {
      const fails = user.failedLogins + 1;
      await db.adminUser.update({
        where: { id: user.id },
        data: fails >= MAX_FAILS ? { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MS) } : { failedLogins: fails },
      });
    }
    await audit({ actorEmail: email, action: "ADMIN_LOGIN_FAILED", entity: "AdminUser", entityId: user?.id, ip });
    throw invalid();
  }

  await db.adminUser.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
  const { token, expiresAt } = await createSession(user.id, { ip, ua: req.headers.get("user-agent") });
  await setSessionCookie(token, expiresAt);
  await audit({ actor: user, action: "ADMIN_LOGIN", entity: "AdminUser", entityId: user.id, ip });
  return ok({ id: user.id, email: user.email, name: user.name, role: user.role });
});

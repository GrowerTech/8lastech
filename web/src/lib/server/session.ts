import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { AdminRole } from "@/generated/prisma/client";
import { db } from "./db";

export const SESSION_COOKIE = "atlas_admin_session";
const TTL_MS = 8 * 60 * 60 * 1000; // 8h absolute

const sha = (t: string) => createHash("sha256").update(t).digest("hex");

export type SessionUser = { id: string; email: string; name: string; role: AdminRole };

export async function createSession(adminId: string, meta: { ip?: string | null; ua?: string | null }) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + TTL_MS);
  await db.adminSession.create({
    data: { tokenHash: sha(token), adminId, expiresAt, ipAddress: meta.ip ?? null, userAgent: meta.ua?.slice(0, 255) ?? null },
  });
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  (await cookies()).delete(SESSION_COOKIE);
}

export async function userFromToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  const s = await db.adminSession.findUnique({
    where: { tokenHash: sha(token) },
    select: { id: true, expiresAt: true, admin: { select: { id: true, email: true, name: true, role: true, active: true } } },
  });
  if (!s) return null;
  if (s.expiresAt <= new Date() || !s.admin.active) {
    await db.adminSession.delete({ where: { id: s.id } }).catch(() => {});
    return null;
  }
  return { id: s.admin.id, email: s.admin.email, name: s.admin.name, role: s.admin.role };
}

export async function destroySession(token: string | undefined | null) {
  if (token) await db.adminSession.deleteMany({ where: { tokenHash: sha(token) } });
}

export async function getCurrentAdmin(): Promise<SessionUser | null> {
  return userFromToken((await cookies()).get(SESSION_COOKIE)?.value);
}

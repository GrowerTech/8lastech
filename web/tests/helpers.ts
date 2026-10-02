import { createHash, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { db } from "@/lib/server/db";
import { hashPassword } from "@/lib/server/password";
import { SESSION_COOKIE } from "@/lib/server/session";
import type { AdminRole } from "@/generated/prisma/client";

export const PASSWORD = "Correct-Horse-9battery";
const TABLES = ["AuditLog", "ProjectImage", "Testimonial", "Inquiry", "Project", "Client", "Service", "Technology", "ProjectCategory", "Media", "PageSeo", "CompanySettings", "AdminSession", "AdminUser"];

export async function resetDb() {
  await db.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(", ")} CASCADE`);
}

export async function makeAdmin(role: AdminRole, email = `${role.toLowerCase()}@test.dev`) {
  const user = await db.adminUser.create({ data: { email, name: role, role, passwordHash: await hashPassword(PASSWORD) } });
  const token = randomBytes(32).toString("base64url");
  await db.adminSession.create({ data: { tokenHash: createHash("sha256").update(token).digest("hex"), adminId: user.id, expiresAt: new Date(Date.now() + 3_600_000) } });
  return { user, token };
}

type Handler = (req: NextRequest, ctx: { params: Promise<never> }) => Promise<Response>;
export async function call(h: Handler, o: { method?: string; path?: string; body?: unknown; token?: string; params?: Record<string, string>; origin?: string | null; form?: FormData; headers?: Record<string, string> } = {}) {
  const method = o.method ?? "GET";
  const headers: Record<string, string> = { ...(o.headers ?? {}) };
  if (o.origin !== null) headers.origin = o.origin ?? "http://localhost:3000";
  if (o.token) headers.cookie = `${SESSION_COOKIE}=${o.token}`;
  if (o.body !== undefined) headers["content-type"] = "application/json";
  const req = new NextRequest(`http://localhost:3000${o.path ?? "/api/x"}`, { method, headers, body: o.form ?? (o.body !== undefined ? JSON.stringify(o.body) : undefined) });
  const res = await h(req, { params: Promise.resolve((o.params ?? {}) as never) });
  const json = await res.json().catch(() => null);
  return { status: res.status, json, res };
}

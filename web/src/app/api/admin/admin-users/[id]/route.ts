import { z } from "zod";
import { adminRoute, ok, parseBody } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { ADMIN_SELECT } from "@/lib/server/admin-user";
import { badRequest, conflict, notFound } from "@/lib/server/errors";
import { hashPassword, passwordProblem } from "@/lib/server/password";
import { text } from "@/lib/server/util";

type P = { id: string };
const patch = z
  .object({
    name: text(100).min(1).optional(),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR"]).optional(),
    active: z.boolean().optional(),
    password: z.string().max(128).optional(),
  })
  .strict();

export const GET = adminRoute<P>({ permission: "admins:manage" }, async ({ params }) => {
  const u = await db.adminUser.findUnique({ where: { id: params.id }, select: ADMIN_SELECT });
  if (!u) throw notFound();
  return ok(u);
});

export const PATCH = adminRoute<P>({ permission: "admins:manage" }, async ({ req, params, admin, audit }) => {
  const input = await parseBody(req, patch);
  const target = await db.adminUser.findUnique({ where: { id: params.id } });
  if (!target) throw notFound();

  const losesSuper = target.role === "SUPER_ADMIN" && ((input.role && input.role !== "SUPER_ADMIN") || input.active === false);
  if (target.id === admin.id && (input.role || input.active === false)) throw badRequest("You cannot change your own role or deactivate yourself");
  if (losesSuper && (await db.adminUser.count({ where: { role: "SUPER_ADMIN", active: true, id: { not: target.id } } })) === 0)
    throw conflict("At least one active SUPER_ADMIN is required");

  const data: Record<string, unknown> = { name: input.name, role: input.role, active: input.active };
  if (input.password) {
    const problem = passwordProblem(input.password);
    if (problem) throw badRequest(problem);
    data.passwordHash = await hashPassword(input.password);
    data.failedLogins = 0;
    data.lockedUntil = null;
  }
  const [user] = await db.$transaction([
    db.adminUser.update({ where: { id: target.id }, data, select: ADMIN_SELECT }),
    // Role change, deactivation or password reset invalidates existing sessions.
    ...(input.password || input.role || input.active === false ? [db.adminSession.deleteMany({ where: { adminId: target.id } })] : []),
  ]);
  await audit("ADMIN_UPDATED", "AdminUser", target.id, { fields: Object.keys(input), passwordReset: !!input.password });
  return ok(user);
});

// Admin accounts are deactivated rather than deleted so the audit trail keeps its actor.
export const DELETE = adminRoute<P>({ permission: "admins:manage" }, async () => {
  throw conflict("Admin accounts cannot be deleted. Deactivate the account instead (PATCH active=false).");
});

import { z } from "zod";
import { adminRoute, ok, parseBody, parseQuery } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { badRequest } from "@/lib/server/errors";
import { hashPassword, passwordProblem } from "@/lib/server/password";
import { orderBy, pageMeta, pageQuery, paging, text } from "@/lib/server/util";
import { ADMIN_SELECT } from "@/lib/server/admin-user";

const create = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    name: text(100).min(1),
    password: z.string().max(128),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR"]),
  })
  .strict();

export const GET = adminRoute({ permission: "admins:manage" }, async ({ req }) => {
  const q = parseQuery(req, pageQuery);
  const where = q.q ? { OR: [{ name: { contains: q.q, mode: "insensitive" as const } }, { email: { contains: q.q, mode: "insensitive" as const } }] } : {};
  const [items, total] = await Promise.all([
    db.adminUser.findMany({ where, select: ADMIN_SELECT, orderBy: orderBy(q.sort, q.order, ["createdAt", "name", "email", "role"] as const, "createdAt"), ...paging(q) }),
    db.adminUser.count({ where }),
  ]);
  return ok(items, pageMeta(q, total));
});

export const POST = adminRoute({ permission: "admins:manage" }, async ({ req, audit }) => {
  const input = await parseBody(req, create);
  const problem = passwordProblem(input.password);
  if (problem) throw badRequest(problem);
  const user = await db.adminUser.create({
    data: { email: input.email, name: input.name, role: input.role, passwordHash: await hashPassword(input.password) },
    select: ADMIN_SELECT,
  });
  await audit("ADMIN_CREATED", "AdminUser", user.id, { email: user.email, role: user.role });
  return ok(user, undefined, 201);
});

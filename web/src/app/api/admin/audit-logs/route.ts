import { z } from "zod";
import { adminRoute, ok, parseQuery } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { pageMeta, pageQuery, paging } from "@/lib/server/util";

const query = pageQuery.extend({
  action: z.string().max(60).optional(),
  entity: z.string().max(40).optional(),
  actorId: z.string().max(40).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const GET = adminRoute({ permission: "audit:read" }, async ({ req }) => {
  const q = parseQuery(req, query);
  const where = {
    ...(q.action ? { action: q.action } : {}),
    ...(q.entity ? { entity: q.entity } : {}),
    ...(q.actorId ? { actorId: q.actorId } : {}),
    ...(q.from || q.to ? { createdAt: { ...(q.from ? { gte: q.from } : {}), ...(q.to ? { lte: q.to } : {}) } } : {}),
    ...(q.q ? { OR: [{ actorEmail: { contains: q.q, mode: "insensitive" as const } }, { action: { contains: q.q, mode: "insensitive" as const } }] } : {}),
  };
  const [items, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: q.order }, ...paging(q) }),
    db.auditLog.count({ where }),
  ]);
  return ok(items, pageMeta(q, total));
});

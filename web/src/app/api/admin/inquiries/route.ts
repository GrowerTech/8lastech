import { z } from "zod";
import { adminRoute, ok, parseQuery } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { orderBy, pageMeta, pageQuery, paging } from "@/lib/server/util";
import { InquiryInclude } from "@/lib/server/inquiry";

const STATUSES = ["NEW", "CONTACTED", "IN_DISCUSSION", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST", "ARCHIVED"] as const;
const query = pageQuery.extend({
  status: z.enum(STATUSES).optional(),
  read: z.enum(["true", "false"]).optional(),
  assignedToId: z.string().max(40).optional(),
});

export const GET = adminRoute({ permission: "inquiries:read" }, async ({ req }) => {
  const q = parseQuery(req, query);
  const where = {
    ...(q.status ? { status: q.status } : {}),
    ...(q.read ? { read: q.read === "true" } : {}),
    ...(q.assignedToId ? { assignedToId: q.assignedToId } : {}),
    ...(q.q ? { OR: ["name", "email", "company", "subject", "message"].map((f) => ({ [f]: { contains: q.q, mode: "insensitive" as const } })) } : {}),
  };
  const [items, total] = await Promise.all([
    db.inquiry.findMany({ where, include: InquiryInclude, orderBy: orderBy(q.sort, q.order, ["createdAt", "status", "name"] as const, "createdAt"), ...paging(q) }),
    db.inquiry.count({ where }),
  ]);
  return ok(items, pageMeta(q, total));
});

import { z } from "zod";
import { adminRoute, ok, parseBody } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { badRequest, notFound } from "@/lib/server/errors";
import { InquiryInclude } from "@/lib/server/inquiry";
import { idString, longText } from "@/lib/server/util";

type P = { id: string };
const patch = z
  .object({
    status: z.enum(["NEW", "CONTACTED", "IN_DISCUSSION", "QUALIFIED", "PROPOSAL_SENT", "WON", "LOST", "ARCHIVED"]).optional(),
    read: z.boolean().optional(),
    assignedToId: idString.nullable().optional(),
    internalNotes: longText(10000).optional(),
  })
  .strict();

export const GET = adminRoute<P>({ permission: "inquiries:read" }, async ({ params }) => {
  const i = await db.inquiry.findUnique({ where: { id: params.id }, include: InquiryInclude });
  if (!i) throw notFound();
  return ok(i);
});

export const PATCH = adminRoute<P>({ permission: "inquiries:write" }, async ({ req, params, audit }) => {
  const data = await parseBody(req, patch);
  const cur = await db.inquiry.findUnique({ where: { id: params.id } });
  if (!cur) throw notFound();
  if (data.assignedToId) {
    const a = await db.adminUser.findFirst({ where: { id: data.assignedToId, active: true }, select: { id: true } });
    if (!a) throw badRequest("Assignee must be an active admin user");
  }
  const updated = await db.inquiry.update({ where: { id: cur.id }, data, include: InquiryInclude });
  if (data.status && data.status !== cur.status) await audit("INQUIRY_STATUS_CHANGED", "Inquiry", cur.id, { from: cur.status, to: data.status });
  if (data.assignedToId !== undefined && data.assignedToId !== cur.assignedToId) await audit("INQUIRY_ASSIGNED", "Inquiry", cur.id, { to: data.assignedToId });
  if (data.internalNotes !== undefined) await audit("INQUIRY_NOTES_UPDATED", "Inquiry", cur.id);
  return ok(updated);
});

export const DELETE = adminRoute<P>({ permission: "content:delete" }, async ({ params, audit }) => {
  await db.inquiry.delete({ where: { id: params.id } });
  await audit("INQUIRY_DELETED", "Inquiry", params.id);
  return ok({ deleted: true });
});

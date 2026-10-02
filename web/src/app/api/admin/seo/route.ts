import { adminRoute, ok } from "@/lib/server/api";
import { db } from "@/lib/server/db";

export const GET = adminRoute({ permission: "content:read" }, async () =>
  ok(await db.pageSeo.findMany({ orderBy: { key: "asc" }, include: { ogImage: { select: { id: true, url: true } } } })),
);

import { z } from "zod";
import { adminRoute, ok, parseBody } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { badRequest } from "@/lib/server/errors";
import { idString, optionalUrl, text } from "@/lib/server/util";

type P = { key: string };
const schema = z
  .object({
    seoTitle: text(70).optional(),
    metaDescription: text(200).optional(),
    canonicalUrl: optionalUrl,
    ogTitle: text(90).optional(),
    ogDescription: text(200).optional(),
    ogImageId: idString.nullable().optional(),
    robots: z.enum(["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"]).optional(),
  })
  .strict();

export const PUT = adminRoute<P>({ permission: "seo:write" }, async ({ req, params, audit }) => {
  if (!/^[a-z0-9-]{1,40}$/.test(params.key)) throw badRequest("Invalid page key");
  const data = await parseBody(req, schema);
  const s = await db.pageSeo.upsert({ where: { key: params.key }, update: data, create: { key: params.key, ...data } });
  await audit("SEO_UPDATED", "PageSeo", s.id, { key: params.key });
  return ok(s);
});

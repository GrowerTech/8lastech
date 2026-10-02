import { z } from "zod";
import { adminRoute, ok, parseBody } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { idString, longText, optionalUrl, text } from "@/lib/server/util";

const include = { logo: { select: { id: true, url: true } }, favicon: { select: { id: true, url: true } } };
const schema = z
  .object({
    companyName: text(100).optional(),
    logoId: idString.nullable().optional(),
    faviconId: idString.nullable().optional(),
    tagline: text(200).optional(),
    description: longText(1000).optional(),
    email: z.union([z.string().trim().email().max(254), z.literal("")]).optional(),
    phones: z.array(text(30)).max(5).optional(),
    whatsapp: text(30).optional(),
    address: text(300).optional(),
    businessHours: text(200).optional(),
    socialLinks: z.record(z.string().max(30), optionalUrl.transform((v) => v ?? "")).optional(),
    copyright: text(200).optional(),
  })
  .strict();

export const GET = adminRoute({ permission: "content:read" }, async () =>
  ok(await db.companySettings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" }, include })),
);

export const PUT = adminRoute({ permission: "settings:write" }, async ({ req, audit }) => {
  const data = await parseBody(req, schema);
  const s = await db.companySettings.upsert({ where: { id: "singleton" }, update: data, create: { id: "singleton", ...data }, include });
  await audit("SETTINGS_UPDATED", "CompanySettings", "singleton", { fields: Object.keys(data) });
  return ok(s);
});

import { z } from "zod";
import { adminRoute, ok, parseQuery } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { badRequest } from "@/lib/server/errors";
import { storeFile } from "@/lib/server/storage";
import { inspectImage, safeFilename } from "@/lib/server/upload";
import { orderBy, pageMeta, pageQuery, paging, text } from "@/lib/server/util";

const query = pageQuery.extend({ type: z.enum(["image"]).optional() });

export const GET = adminRoute({ permission: "content:read" }, async ({ req }) => {
  const q = parseQuery(req, query);
  const where = q.q
    ? { OR: [{ filename: { contains: q.q, mode: "insensitive" as const } }, { alt: { contains: q.q, mode: "insensitive" as const } }, { caption: { contains: q.q, mode: "insensitive" as const } }] }
    : {};
  const [items, total] = await Promise.all([
    db.media.findMany({ where, orderBy: orderBy(q.sort, q.order, ["createdAt", "filename", "size"] as const, "createdAt"), ...paging(q) }),
    db.media.count({ where }),
  ]);
  return ok(items, pageMeta(q, total));
});

export const POST = adminRoute({ permission: "media:write" }, async ({ req, audit }) => {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw badRequest("Expected multipart field 'file'");
  const alt = text(300).parse(form?.get("alt") ?? "");
  const caption = text(500).parse(form?.get("caption") ?? "");
  const img = await inspectImage(file);
  const stored = await storeFile(img.buf, img.ext, img.mime);
  const media = await db.media.create({
    data: { ...stored, filename: safeFilename(file.name), mimeType: img.mime, size: img.size, width: img.width, height: img.height, alt, caption },
  });
  await audit("MEDIA_UPLOADED", "Media", media.id, { filename: media.filename, size: media.size });
  return ok(media, undefined, 201);
});

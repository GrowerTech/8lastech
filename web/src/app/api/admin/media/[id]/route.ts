import { z } from "zod";
import { adminRoute, ok, parseBody } from "@/lib/server/api";
import { db } from "@/lib/server/db";
import { badRequest, conflict, notFound } from "@/lib/server/errors";
import { removeFile, storeFile } from "@/lib/server/storage";
import { inspectImage, safeFilename } from "@/lib/server/upload";
import { text } from "@/lib/server/util";

type P = { id: string };
const patch = z.object({ alt: text(300).optional(), caption: text(500).optional() }).strict();

export const GET = adminRoute<P>({ permission: "content:read" }, async ({ params }) => {
  const m = await db.media.findUnique({ where: { id: params.id } });
  if (!m) throw notFound();
  return ok(m);
});

export const PATCH = adminRoute<P>({ permission: "media:write" }, async ({ req, params, audit }) => {
  const data = await parseBody(req, patch);
  const m = await db.media.update({ where: { id: params.id }, data });
  await audit("MEDIA_UPDATED", "Media", m.id, { fields: Object.keys(data) });
  return ok(m);
});

/** Replace the file but keep the record id, so every reference stays valid. */
export const PUT = adminRoute<P>({ permission: "media:write" }, async ({ req, params, audit }) => {
  const old = await db.media.findUnique({ where: { id: params.id } });
  if (!old) throw notFound();
  const file = (await req.formData().catch(() => null))?.get("file");
  if (!(file instanceof File)) throw badRequest("Expected multipart field 'file'");
  const img = await inspectImage(file);
  const stored = await storeFile(img.buf, img.ext, img.mime);
  const m = await db.media.update({
    where: { id: old.id },
    data: { ...stored, filename: safeFilename(file.name), mimeType: img.mime, size: img.size, width: img.width, height: img.height },
  });
  await removeFile(old);
  await audit("MEDIA_REPLACED", "Media", m.id, { filename: m.filename });
  return ok(m);
});

export const DELETE = adminRoute<P>({ permission: "content:delete" }, async ({ params, audit }) => {
  const m = await db.media.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: { clientLogos: true, technologyIcons: true, serviceImages: true, projectThumbnails: true, projectHeroes: true, projectGallery: true, testimonialPhotos: true, settingsLogos: true, settingsFavicons: true, seoOgImages: true },
      },
    },
  });
  if (!m) throw notFound();
  const used = Object.values(m._count).reduce((a, b) => a + b, 0);
  if (used) throw conflict(`This file is used in ${used} place(s). Remove those references first.`);
  await db.media.delete({ where: { id: m.id } });
  await removeFile(m);
  await audit("MEDIA_DELETED", "Media", m.id, { filename: m.filename });
  return ok({ deleted: true });
});

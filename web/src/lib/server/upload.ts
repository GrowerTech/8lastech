import { imageSize } from "image-size";
import { badRequest } from "./errors";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // under Vercel's 4.5MB request body cap
export const MAX_DIMENSION = 8000;
// SVG intentionally excluded: it can carry scripts.
const TYPES: Record<string, { mime: string; ext: string }> = {
  jpg: { mime: "image/jpeg", ext: "jpg" },
  png: { mime: "image/png", ext: "png" },
  webp: { mime: "image/webp", ext: "webp" },
  gif: { mime: "image/gif", ext: "gif" },
  avif: { mime: "image/avif", ext: "avif" },
};

/** Validates by content (magic bytes via header parsing), never by client filename or Content-Type. */
export async function inspectImage(file: File) {
  if (file.size === 0) throw badRequest("File is empty");
  if (file.size > MAX_UPLOAD_BYTES) throw badRequest(`File exceeds ${MAX_UPLOAD_BYTES / 1024 / 1024}MB limit`);
  const buf = Buffer.from(await file.arrayBuffer());
  let info;
  try {
    info = imageSize(buf);
  } catch {
    throw badRequest("File is not a valid image");
  }
  const type = TYPES[info.type ?? ""];
  if (!type) throw badRequest("Unsupported image type. Allowed: JPEG, PNG, WebP, GIF, AVIF");
  const { width, height } = info;
  if (!width || !height || width > MAX_DIMENSION || height > MAX_DIMENSION) throw badRequest(`Image dimensions must be within ${MAX_DIMENSION}px`);
  return { buf, ...type, width, height, size: buf.length };
}

/** Display-only filename: strip path parts and control chars. Never used for storage. */
export function safeFilename(name: string) {
  return (name.split(/[\\/]/).pop() ?? "upload").replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "upload";
}

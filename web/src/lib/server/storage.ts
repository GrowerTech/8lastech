import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, put } from "@vercel/blob";
import { ApiError } from "./errors";

const hasBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const LOCAL_DIR = path.join(process.cwd(), "public", "uploads");

export type Stored = { url: string; pathname: string };

/** Production uses Vercel Blob. Without a token, development falls back to public/uploads (never in production). */
export async function storeFile(buf: Buffer, ext: string, contentType: string): Promise<Stored> {
  const name = `${randomBytes(16).toString("hex")}.${ext}`;
  if (hasBlob()) {
    const b = await put(`media/${name}`, buf, { access: "public", contentType, addRandomSuffix: false });
    return { url: b.url, pathname: b.pathname };
  }
  if (process.env.NODE_ENV === "production") throw new ApiError(503, "STORAGE_NOT_CONFIGURED", "Media storage is not configured");
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(path.join(LOCAL_DIR, name), buf);
  return { url: `/uploads/${name}`, pathname: `local/${name}` };
}

export async function removeFile(s: Stored) {
  try {
    if (s.pathname.startsWith("local/")) await unlink(path.join(LOCAL_DIR, path.basename(s.pathname)));
    else if (hasBlob()) await del(s.url);
  } catch (e) {
    console.error("[storage] delete failed", e instanceof Error ? e.message : e);
  }
}

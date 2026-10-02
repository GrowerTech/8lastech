import { z } from "zod";
import { conflict } from "./errors";

export function slugify(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Returns a slug unique for `exists`, appending -2, -3… when taken. */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>) {
  const root = slugify(base) || "item";
  let slug = root;
  for (let i = 2; await exists(slug); i++) {
    if (i > 50) throw conflict("Could not generate a unique slug");
    slug = `${root}-${i}`;
  }
  return slug;
}

export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
  sort: z.string().trim().max(40).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export function paging(q: { page: number; pageSize: number }) {
  return { skip: (q.page - 1) * q.pageSize, take: q.pageSize };
}

export const pageMeta = (q: { page: number; pageSize: number }, total: number) => ({
  page: q.page,
  pageSize: q.pageSize,
  total,
  totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
});

/** Whitelist-based sort so clients can never order by arbitrary/unindexed columns. */
export function orderBy<T extends string>(sort: string | undefined, order: "asc" | "desc", allowed: readonly T[], fallback: T) {
  const field = (allowed as readonly string[]).includes(sort ?? "") ? (sort as T) : fallback;
  return { [field]: order } as Record<T, "asc" | "desc">;
}

// Shared field validators
export const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    try {
      return ["http:", "https:"].includes(new URL(v).protocol);
    } catch {
      return false;
    }
  }, "Must be an http(s) URL");
export const optionalUrl = z.union([httpUrl, z.literal("").transform(() => null), z.null()]).optional();
export const text = (max = 200) => z.string().trim().max(max);
export const longText = (max = 20000) => z.string().trim().max(max);
export const idString = z.string().min(1).max(40);

export const seoSchema = z
  .object({
    seoTitle: text(70).optional(),
    metaDescription: text(200).optional(),
    canonicalUrl: optionalUrl,
    ogTitle: text(90).optional(),
    ogDescription: text(200).optional(),
    ogImage: httpUrl.nullish(),
    robots: z.enum(["index,follow", "noindex,follow", "index,nofollow", "noindex,nofollow"]).optional(),
  })
  .strict();

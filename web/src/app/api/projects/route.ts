import { NextResponse } from "next/server";
import { z } from "zod";
import { parseQuery, publicRoute } from "@/lib/server/api";
import { listPublicProjects } from "@/lib/server/public";

const CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' };
const q = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
  category: z.string().max(80).optional(),
  client: z.string().max(80).optional(),
  featured: z.enum(["true", "false"]).optional(),
});

export const GET = publicRoute(async (req) => {
  const p = parseQuery(req, q);
  const { items, ...meta } = await listPublicProjects({ ...p, featured: p.featured ? p.featured === "true" : undefined });
  return NextResponse.json({ data: items, meta }, { headers: CACHE });
});

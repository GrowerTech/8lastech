import { NextResponse } from "next/server";
import { publicRoute } from "@/lib/server/api";
import { notFound } from "@/lib/server/errors";
import { getPublicProject } from "@/lib/server/public";

const CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' };

export const GET = publicRoute<{ slug: string }>(async (_req, { slug }) => {
  const project = await getPublicProject(slug.slice(0, 100));
  if (!project) throw notFound();
  return NextResponse.json({ data: project }, { headers: CACHE });
});

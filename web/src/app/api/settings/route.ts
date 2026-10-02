import { NextResponse } from "next/server";
import { publicRoute } from "@/lib/server/api";
import { getPublicSettings } from "@/lib/server/public";

const CACHE = { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' };

export const GET = publicRoute(async () => NextResponse.json({ data: await getPublicSettings() }, { headers: CACHE }));

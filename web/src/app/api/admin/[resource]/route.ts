import { resourceRoute } from "@/lib/server/resource-guard";

type P = { resource: string };
export const GET = resourceRoute<P>("read", (h, ctx) => h.list(ctx));
export const POST = resourceRoute<P>("write", (h, ctx) => h.create(ctx));

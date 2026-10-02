import { resourceRoute } from "@/lib/server/resource-guard";

type P = { resource: string; id: string };
export const GET = resourceRoute<P>("read", (h, ctx) => h.get(ctx));
export const PATCH = resourceRoute<P>("write", (h, ctx) => h.update(ctx));
export const DELETE = resourceRoute<P>("delete", (h, ctx) => h.remove(ctx));

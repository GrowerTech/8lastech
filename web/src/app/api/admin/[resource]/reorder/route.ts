import { resourceRoute } from "@/lib/server/resource-guard";

type P = { resource: string };
export const POST = resourceRoute<P>("write", (h, ctx) => h.reorder(ctx));

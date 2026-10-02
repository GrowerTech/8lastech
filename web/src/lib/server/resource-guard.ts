import { adminRoute, type Ctx } from "./api";
import { resourceHandlers } from "./crud";
import { notFound } from "./errors";
import { RESOURCES } from "./resources";
import type { Permission } from "./permissions";

type Handlers = ReturnType<typeof resourceHandlers>;
const cache = new Map<string, Handlers>();

function handlersFor(name: string): Handlers {
  const r = RESOURCES[name];
  if (!r) throw notFound();
  let h = cache.get(name);
  if (!h) cache.set(name, (h = resourceHandlers(r)));
  return h;
}

/** Route factory for /api/admin/[resource](/[id]) — permission is derived from the resource + action. */
export function resourceRoute<P extends { resource: string }>(
  action: "read" | "write" | "delete",
  run: (h: Handlers, ctx: Ctx<P>) => Promise<Response>,
) {
  return adminRoute<P>(
    {
      permission: (p): Permission => {
        try {
          return handlersFor(p.resource).permission(action);
        } catch {
          // Unknown resource: require the weakest permission so authenticated users get a 404, others 401/403.
          return "content:read";
        }
      },
    },
    (ctx) => run(handlersFor(ctx.params.resource), ctx),
  );
}

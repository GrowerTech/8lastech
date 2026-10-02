import type { NextRequest } from "next/server";
import { z, type ZodType } from "zod";
import { db } from "./db";
import { ok, parseBody, parseQuery, type Ctx } from "./api";
import { conflict, forbidden, notFound } from "./errors";
import { can, type Permission } from "./permissions";
import { orderBy, pageMeta, pageQuery, paging, uniqueSlug, slugify } from "./util";

// Minimal structural type for the Prisma delegates we use; keeps the factory model-agnostic.
type Delegate = {
  findMany(a: object): Promise<Record<string, unknown>[]>;
  findUnique(a: object): Promise<Record<string, unknown> | null>;
  count(a: object): Promise<number>;
  create(a: object): Promise<Record<string, unknown>>;
  update(a: object): Promise<Record<string, unknown>>;
  delete(a: object): Promise<Record<string, unknown>>;
};

export type Resource<C extends Record<string, unknown> = Record<string, unknown>> = {
  entity: string; // audit prefix, e.g. "PROJECT"
  model: Delegate;
  create: ZodType<C>;
  update: ZodType<Partial<C>>;
  searchFields: string[];
  sorts: readonly string[];
  defaultSort: string;
  /** field used to derive a slug on create (omit for resources without slugs) */
  slugFrom?: string;
  include?: object;
  filters?: (q: Record<string, string>) => object;
  /** Map validated input → Prisma `data` (relations, defaults). */
  toData: (input: Partial<C>, mode: "create" | "update", current?: Record<string, unknown>) => Record<string, unknown>;
  hasStatus?: boolean;
  hasFeatured?: boolean;
  deleteGuard?: (id: string) => Promise<void>;
  reorderable?: boolean;
  permissions?: Partial<Record<"read" | "write" | "delete", Permission>>;
};

const idParam = (p: Record<string, string>) => {
  const id = p.id;
  if (!id || id.length > 40) throw notFound();
  return id;
};

const STATUS_VERB = { PUBLISHED: "PUBLISHED", ARCHIVED: "ARCHIVED" } as const;

function guardPrivileged(r: Resource, ctx: Ctx, input: Record<string, unknown>) {
  const touches = (r.hasStatus && "status" in input) || (r.hasFeatured && "featured" in input);
  if (touches && !can(ctx.admin.role, "content:publish")) throw forbidden("Changing publication status or featured flag requires additional permission");
}

export function resourceHandlers(r: Resource) {
  const need = (k: "read" | "write" | "delete") => r.permissions?.[k] ?? (`content:${k}` as Permission);
  const sortable = [...r.sorts, "createdAt", "updatedAt"] as const;

  return {
    permission: need,

    async list(ctx: Ctx) {
      const q = parseQuery(ctx.req, pageQuery.extend({ status: z.string().max(20).optional() }).passthrough());
      const extra = Object.fromEntries([...ctx.req.nextUrl.searchParams.entries()]);
      const where: Record<string, unknown> = { ...(r.filters?.(extra) ?? {}) };
      if (r.hasStatus && q.status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(q.status)) where.status = q.status;
      if (q.q) where.OR = r.searchFields.map((f) => ({ [f]: { contains: q.q, mode: "insensitive" } }));
      const [items, total] = await Promise.all([
        r.model.findMany({ where, orderBy: orderBy(q.sort, q.order, sortable, r.defaultSort as never), include: r.include, ...paging(q) }),
        r.model.count({ where }),
      ]);
      return ok(items, pageMeta(q, total));
    },

    async get(ctx: Ctx) {
      const item = await r.model.findUnique({ where: { id: idParam(ctx.params) }, include: r.include });
      if (!item) throw notFound();
      return ok(item);
    },

    async create(ctx: Ctx) {
      const input = await parseBody(ctx.req, r.create);
      guardPrivileged(r, ctx, input);
      const data = r.toData(input, "create");
      if (r.slugFrom) {
        const base = String(input.slug ?? input[r.slugFrom] ?? "");
        data.slug = input.slug ? slugify(String(input.slug)) : await uniqueSlug(base, async (s) => !!(await r.model.findUnique({ where: { slug: s } })));
      }
      const item = await r.model.create({ data, include: r.include });
      await ctx.audit(`${r.entity}_CREATED`, r.entity, String(item.id), { fields: Object.keys(input) });
      return ok(item, undefined, 201);
    },

    async update(ctx: Ctx) {
      const id = idParam(ctx.params);
      const input = await parseBody(ctx.req, r.update);
      guardPrivileged(r, ctx, input);
      const current = await r.model.findUnique({ where: { id } });
      if (!current) throw notFound();
      const data = r.toData(input, "update", current);
      if (typeof input.slug === "string") data.slug = slugify(input.slug);
      const item = await r.model.update({ where: { id }, data, include: r.include });
      const prev = current.status as string | undefined;
      const next = item.status as string | undefined;
      if (r.hasStatus && next && prev !== next) {
        const verb = next in STATUS_VERB ? STATUS_VERB[next as keyof typeof STATUS_VERB] : prev === "ARCHIVED" ? "RESTORED" : "UNPUBLISHED";
        await ctx.audit(`${r.entity}_${verb}`, r.entity, id, { from: prev, to: next });
      }
      await ctx.audit(`${r.entity}_UPDATED`, r.entity, id, { fields: Object.keys(input) });
      return ok(item);
    },

    async remove(ctx: Ctx) {
      const id = idParam(ctx.params);
      if (!(await r.model.findUnique({ where: { id } }))) throw notFound();
      await r.deleteGuard?.(id);
      await r.model.delete({ where: { id } });
      await ctx.audit(`${r.entity}_DELETED`, r.entity, id);
      return ok({ deleted: true });
    },

    async reorder(ctx: Ctx) {
      if (!r.reorderable) throw notFound();
      const { ids } = await parseBody(ctx.req, z.object({ ids: z.array(z.string().max(40)).min(1).max(500) }));
      if (new Set(ids).size !== ids.length) throw conflict("Duplicate ids");
      // Single transaction: either every row is reordered or none.
      await db.$transaction(ids.map((id, i) => (r.model as unknown as { update: (a: object) => never }).update({ where: { id }, data: { displayOrder: i } })));
      await ctx.audit(`${r.entity}_REORDERED`, r.entity, null, { count: ids.length });
      return ok({ reordered: ids.length });
    },
  };
}

export type RouteCtx = { req: NextRequest };

import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type ZodType } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { ApiError, forbidden, unauthorized, tooMany, badRequest } from "./errors";
import { can, type Permission } from "./permissions";
import { rateLimit } from "./rate-limit";
import { SESSION_COOKIE, userFromToken, type SessionUser } from "./session";
import { audit } from "./audit";

export const ok = <T>(data: T, meta?: Record<string, unknown>, status = 200) =>
  NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status });

export function errorResponse(e: unknown) {
  if (e instanceof ApiError) {
    const res = NextResponse.json(
      { error: { code: e.code, message: e.message, ...(e.details ? { details: e.details } : {}) } },
      { status: e.status },
    );
    const ra = (e as { retryAfter?: number }).retryAfter;
    if (ra) res.headers.set("Retry-After", String(ra));
    return res;
  }
  if (e instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Validation failed", details: e.issues.map((i) => ({ path: i.path.join("."), message: i.message })) } },
      { status: 422 },
    );
  }
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2002") return errorResponse(new ApiError(409, "CONFLICT", "A record with these unique values already exists"));
    if (e.code === "P2025") return errorResponse(new ApiError(404, "NOT_FOUND", "Not found"));
    if (e.code === "P2003" || e.code === "P2014")
      return errorResponse(new ApiError(409, "CONFLICT", "This record is referenced by other records or references one that does not exist"));
  }
  console.error("[admin-api]", e instanceof Error ? e.message : "unknown error");
  return NextResponse.json({ error: { code: "INTERNAL", message: "Something went wrong" } }, { status: 500 });
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || null;
}

function allowedOrigins(req: NextRequest) {
  const list = [req.nextUrl.origin, process.env.SITE_URL, ...(process.env.ADMIN_ALLOWED_ORIGINS ?? "").split(",")]
    .map((s) => s?.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return new Set(list);
}

/** CSRF defence in depth (cookie is SameSite=Strict): mutating requests must come from an allowed Origin. */
export function assertSameOrigin(req: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return;
  const origin = req.headers.get("origin");
  if (!origin || !allowedOrigins(req).has(origin)) throw forbidden("Cross-origin request rejected");
}

export type Ctx<P = Record<string, string>> = {
  req: NextRequest;
  admin: SessionUser;
  ip: string | null;
  params: P;
  audit: (action: string, entity: string, entityId?: string | null, metadata?: Record<string, unknown>) => Promise<void>;
};

type Opts<P> = { permission: Permission | Permission[] | ((params: P) => Permission) };

/**
 * Pipeline: origin check → authentication → authorization → rate limit → handler.
 * Validation happens inside handlers via `parseBody` / `parseQuery`.
 */
export function adminRoute<P = Record<string, string>>(opts: Opts<P>, fn: (ctx: Ctx<P>) => Promise<Response>) {
  return async (req: NextRequest, route: { params: Promise<P> }) => {
    try {
      assertSameOrigin(req);
      const admin = await userFromToken(req.cookies.get(SESSION_COOKIE)?.value);
      if (!admin) throw unauthorized();
      const params = await route.params;
      const perm = typeof opts.permission === "function" ? opts.permission(params) : opts.permission;
      const needed = Array.isArray(perm) ? perm : [perm];
      if (!needed.every((p) => can(admin.role, p))) throw forbidden();
      const rl = rateLimit(`admin:${admin.id}`, 300, 60_000);
      if (!rl.ok) throw tooMany("Too many requests", rl.retryAfter);
      const ip = clientIp(req);
      return await fn({
        req,
        admin,
        ip,
        params,
        audit: (action, entity, entityId, metadata) => audit({ actor: admin, action, entity, entityId, ip, metadata }),
      });
    } catch (e) {
      return errorResponse(e);
    }
  };
}

/** For public/unauthenticated routes: just error handling. */
export function publicRoute<P = Record<string, string>>(fn: (req: NextRequest, params: P) => Promise<Response>) {
  return async (req: NextRequest, route: { params: Promise<P> }) => {
    try {
      return await fn(req, await route.params);
    } catch (e) {
      return errorResponse(e);
    }
  };
}

export async function parseBody<T>(req: Request, schema: ZodType<T>): Promise<T> {
  const text = await req.text();
  if (text.length > 1_000_000) throw badRequest("Request body too large");
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw badRequest("Body must be valid JSON");
  }
  return schema.parse(json);
}

export const parseQuery = <T>(req: NextRequest, schema: ZodType<T>): T =>
  schema.parse(Object.fromEntries(req.nextUrl.searchParams));

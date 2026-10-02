import type { Prisma } from "@/generated/prisma/client";
import { db } from "./db";

const SENSITIVE = /pass(word)?|secret|token|hash|authorization|cookie/i;

function scrub(v: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (Array.isArray(v)) return v.slice(0, 50).map((x) => scrub(x, depth + 1));
  if (v && typeof v === "object")
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, SENSITIVE.test(k) ? "[redacted]" : scrub(x, depth + 1)]),
    );
  if (typeof v === "string" && v.length > 500) return v.slice(0, 500) + "…";
  return v;
}

export async function audit(p: {
  actor?: { id: string; email: string } | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ip?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.auditLog.create({
      data: {
        actorId: p.actor?.id ?? null,
        actorEmail: p.actor?.email ?? p.actorEmail ?? null,
        action: p.action,
        entity: p.entity,
        entityId: p.entityId ?? null,
        ipAddress: p.ip ?? null,
        metadata: p.metadata ? (scrub(p.metadata) as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch (e) {
    // Audit failure must not turn a successful operation into an error, but must be visible.
    console.error("[audit] failed to write log", e instanceof Error ? e.message : e);
  }
}

"use client";

export type Paged<T> = { data: T[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };

export class ApiFail extends Error {
  constructor(public status: number, message: string, public details?: { path: string; message: string }[]) {
    super(message);
  }
}

export async function api<T = unknown>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`/api/admin${path}`, {
    ...rest,
    credentials: "same-origin",
    headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const body = await res.json().catch(() => null);
  if (res.status === 401 && !path.startsWith("/auth/")) window.location.href = "/admin/login";
  if (!res.ok) throw new ApiFail(res.status, body?.error?.message ?? "Request failed", body?.error?.details);
  return body as T;
}

export const qs = (o: Record<string, string | number | boolean | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== "") p.set(k, String(v));
  const s = p.toString();
  return s ? `?${s}` : "";
};

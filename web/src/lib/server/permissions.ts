import type { AdminRole } from "@/generated/prisma/client";

export const PERMISSIONS = [
  "content:read",
  "content:write",
  "content:publish",
  "content:delete",
  "media:write",
  "inquiries:read",
  "inquiries:write",
  "seo:write",
  "settings:write",
  "admins:manage",
  "audit:read",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const EDITOR: Permission[] = ["content:read", "content:write", "media:write"];
const ADMIN: Permission[] = [
  ...EDITOR,
  "content:publish",
  "content:delete",
  "inquiries:read",
  "inquiries:write",
  "seo:write",
  "settings:write",
];

// Add a role by adding an entry here (and to the AdminRole enum).
export const ROLE_PERMISSIONS: Record<AdminRole, ReadonlySet<Permission>> = {
  SUPER_ADMIN: new Set<Permission>([...ADMIN, "admins:manage", "audit:read"]),
  ADMIN: new Set<Permission>(ADMIN),
  EDITOR: new Set<Permission>(EDITOR),
};

export function can(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

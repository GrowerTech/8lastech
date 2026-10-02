// Explicit select: passwordHash must never leave the server.
export const ADMIN_SELECT = {
  id: true, email: true, name: true, role: true, active: true, lastLoginAt: true, createdAt: true, updatedAt: true,
} as const;

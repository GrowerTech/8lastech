import "dotenv/config";
import { vi } from "vitest";

// Never run against the real database: tests truncate tables.
const url = process.env.TEST_DATABASE_URL;
if (!url || !/@(localhost|127\.0\.0\.1)[:/]/.test(url) || url === process.env.DATABASE_URL)
  throw new Error("Refusing to run tests: TEST_DATABASE_URL must be a local database distinct from DATABASE_URL");
process.env.DATABASE_URL = url;
process.env.SITE_URL = "http://localhost:3000";

// next/headers needs a request scope; capture cookie writes instead.
export const cookieJar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: (k: string, v: string) => void cookieJar.set(k, v),
    delete: (k: string) => void cookieJar.delete(k),
    get: (k: string) => (cookieJar.has(k) ? { value: cookieJar.get(k) } : undefined),
  }),
}));
// Don't touch disk/network for uploads.
vi.mock("@/lib/server/storage", () => ({
  storeFile: async (_b: Buffer, ext: string) => ({ url: `/uploads/test.${ext}`, pathname: `local/test-${Math.random()}.${ext}` }),
  removeFile: async () => {},
}));

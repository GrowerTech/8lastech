import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function client(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  return (globalForPrisma.prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) }));
}

// Lazy: importing this module (e.g. during `next build` page-data collection) never needs a database;
// the connection is created on the first query.
export const db = new Proxy({} as PrismaClient, {
  get: (_t, prop, receiver) => Reflect.get(client(), prop, receiver),
});

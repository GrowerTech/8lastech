import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword, passwordProblem } from "../src/lib/server/password";

// Creates the first SUPER_ADMIN from SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD. Refuses to run
// if any SUPER_ADMIN already exists, so it cannot be abused to reset credentials.
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD");
  const problem = passwordProblem(password);
  if (problem) throw new Error(problem);
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
  try {
    if (await db.adminUser.count({ where: { role: "SUPER_ADMIN" } })) {
      console.log("A SUPER_ADMIN already exists; nothing to do.");
      return;
    }
    await db.adminUser.create({ data: { email, name: "Super Admin", passwordHash: await hashPassword(password), role: "SUPER_ADMIN" } });
    await db.companySettings.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });
    console.log(`Created SUPER_ADMIN ${email}`);
  } finally {
    await db.$disconnect();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

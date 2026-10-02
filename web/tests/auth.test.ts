import { beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/admin/auth/login/route";
import { GET as me } from "@/app/api/admin/auth/me/route";
import { GET as dashboard } from "@/app/api/admin/dashboard/route";
import { db } from "@/lib/server/db";
import { call, makeAdmin, PASSWORD, resetDb } from "./helpers";
import { cookieJar } from "./setup";

beforeEach(async () => { await resetDb(); cookieJar.clear(); });

describe("authentication", () => {
  it("logs in with valid credentials, sets a session cookie, and audits", async () => {
    const { user } = await makeAdmin("ADMIN");
    const r = await call(login, { method: "POST", body: { email: user.email, password: PASSWORD }, headers: { "x-forwarded-for": "10.0.0.1" } });
    expect(r.status).toBe(200);
    expect(r.json.data).not.toHaveProperty("passwordHash");
    expect(cookieJar.get("atlas_admin_session")).toBeTruthy();
    expect(await db.auditLog.count({ where: { action: "ADMIN_LOGIN" } })).toBe(1);
  });

  it("rejects bad password and unknown email with the same generic error", async () => {
    const { user } = await makeAdmin("ADMIN");
    const a = await call(login, { method: "POST", body: { email: user.email, password: "wrong-password-1A" }, headers: { "x-forwarded-for": "10.0.0.2" } });
    const b = await call(login, { method: "POST", body: { email: "nobody@test.dev", password: "wrong-password-1A" }, headers: { "x-forwarded-for": "10.0.0.3" } });
    expect(a.status).toBe(401);
    expect(b.status).toBe(401);
    expect(a.json.error.message).toBe(b.json.error.message);
  });

  it("locks the account after repeated failures, even with the right password", async () => {
    const { user } = await makeAdmin("ADMIN");
    for (let i = 0; i < 5; i++) await call(login, { method: "POST", body: { email: user.email, password: "wrong-password-1A" }, headers: { "x-forwarded-for": `10.1.0.${i}` } });
    const r = await call(login, { method: "POST", body: { email: user.email, password: PASSWORD }, headers: { "x-forwarded-for": "10.1.0.99" } });
    expect(r.status).toBe(401);
  });

  it("rejects cross-origin login (CSRF)", async () => {
    const { user } = await makeAdmin("ADMIN");
    const r = await call(login, { method: "POST", body: { email: user.email, password: PASSWORD }, origin: "https://evil.example", headers: { "x-forwarded-for": "10.2.0.1" } });
    expect(r.status).toBe(403);
  });

  it("protects endpoints: no cookie → 401; garbage token → 401", async () => {
    expect((await call(dashboard)).status).toBe(401);
    expect((await call(dashboard, { token: "garbage" })).status).toBe(401);
    expect((await call(me)).status).toBe(401);
  });

  it("rejects expired sessions and sessions of deactivated admins", async () => {
    const { user, token } = await makeAdmin("ADMIN");
    expect((await call(dashboard, { token })).status).toBe(200);
    await db.adminSession.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await call(dashboard, { token })).status).toBe(401);
    const b = await makeAdmin("ADMIN", "second@test.dev");
    await db.adminUser.update({ where: { id: b.user.id }, data: { active: false } });
    expect((await call(dashboard, { token: b.token })).status).toBe(401);
    void user;
  });
});

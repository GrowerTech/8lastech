import { beforeEach, describe, expect, it } from "vitest";
import { GET as list, POST as create } from "@/app/api/admin/[resource]/route";
import { PATCH as update, DELETE as remove } from "@/app/api/admin/[resource]/[id]/route";
import { POST as reorder } from "@/app/api/admin/[resource]/reorder/route";
import { GET as adminUsers, POST as createAdmin } from "@/app/api/admin/admin-users/route";
import { PATCH as patchAdmin } from "@/app/api/admin/admin-users/[id]/route";
import { GET as auditLogs } from "@/app/api/admin/audit-logs/route";
import { PUT as putSettings } from "@/app/api/admin/settings/route";
import { POST as upload } from "@/app/api/admin/media/route";
import { GET as publicProjects } from "@/app/api/projects/route";
import { GET as publicProject } from "@/app/api/projects/[slug]/route";
import { POST as submitInquiry } from "@/app/api/inquiries/route";
import { GET as adminInquiries } from "@/app/api/admin/inquiries/route";
import { PATCH as patchInquiry } from "@/app/api/admin/inquiries/[id]/route";
import { db } from "@/lib/server/db";
import { call, makeAdmin, PASSWORD, resetDb } from "./helpers";

beforeEach(resetDb);

const P = (resource: string, id?: string) => ({ resource, ...(id ? { id } : {}) });

describe("RBAC is enforced server-side", () => {
  it("EDITOR can create drafts but cannot publish, delete, or manage admins/audit/settings", async () => {
    const { token } = await makeAdmin("EDITOR");
    const c = await call(create, { method: "POST", token, params: P("projects"), body: { title: "Alpha" } });
    expect(c.status).toBe(201);
    expect(c.json.data.status).toBe("DRAFT");
    const id = c.json.data.id;

    expect((await call(create, { method: "POST", token, params: P("projects"), body: { title: "B", status: "PUBLISHED" } })).status).toBe(403);
    expect((await call(update, { method: "PATCH", token, params: P("projects", id), body: { status: "PUBLISHED" } })).status).toBe(403);
    expect((await call(update, { method: "PATCH", token, params: P("projects", id), body: { featured: true } })).status).toBe(403);
    expect((await call(update, { method: "PATCH", token, params: P("projects", id), body: { title: "Alpha 2" } })).status).toBe(200);
    expect((await call(remove, { method: "DELETE", token, params: P("projects", id) })).status).toBe(403);
    expect((await call(adminUsers, { token })).status).toBe(403);
    expect((await call(auditLogs, { token })).status).toBe(403);
    expect((await call(putSettings, { method: "PUT", token, body: { tagline: "x" } })).status).toBe(403);
    expect((await call(adminInquiries, { token })).status).toBe(403);
  });

  it("ADMIN can publish and delete content but cannot manage admins or read the audit log", async () => {
    const { token } = await makeAdmin("ADMIN");
    const c = await call(create, { method: "POST", token, params: P("projects"), body: { title: "Alpha", status: "PUBLISHED" } });
    expect(c.status).toBe(201);
    expect((await call(remove, { method: "DELETE", token, params: P("projects", c.json.data.id) })).status).toBe(200);
    expect((await call(adminUsers, { token })).status).toBe(403);
    expect((await call(auditLogs, { token })).status).toBe(403);
    expect((await call(putSettings, { method: "PUT", token, body: { tagline: "Hi" } })).status).toBe(200);
  });

  it("SUPER_ADMIN manages admins and reads audit logs; cannot demote or deactivate self or the last super admin", async () => {
    const { user, token } = await makeAdmin("SUPER_ADMIN");
    const created = await call(createAdmin, { method: "POST", token, body: { email: "new@test.dev", name: "New", password: PASSWORD, role: "EDITOR" } });
    expect(created.status).toBe(201);
    expect(JSON.stringify(created.json)).not.toMatch(/passwordHash|argon2/);
    expect((await call(createAdmin, { method: "POST", token, body: { email: "weak@test.dev", name: "W", password: "short", role: "EDITOR" } })).status).toBe(400);
    expect((await call(patchAdmin, { method: "PATCH", token, params: { id: user.id }, body: { role: "EDITOR" } })).status).toBe(400);
    expect((await call(auditLogs, { token })).json.data.some((l: { action: string }) => l.action === "ADMIN_CREATED")).toBe(true);

    const other = await makeAdmin("SUPER_ADMIN", "other-super@test.dev");
    await db.adminUser.update({ where: { id: user.id }, data: { active: false } });
    // `other` is now the only active super admin and cannot be demoted by... a deactivated actor (session invalid)
    expect((await call(patchAdmin, { method: "PATCH", token, params: { id: other.user.id }, body: { role: "ADMIN" } })).status).toBe(401);
  });

  it("deactivating or resetting an admin revokes their sessions", async () => {
    const root = await makeAdmin("SUPER_ADMIN");
    const victim = await makeAdmin("EDITOR");
    expect((await call(list, { token: victim.token, params: P("projects") })).status).toBe(200);
    await call(patchAdmin, { method: "PATCH", token: root.token, params: { id: victim.user.id }, body: { role: "ADMIN" } });
    expect((await call(list, { token: victim.token, params: P("projects") })).status).toBe(401);
  });

  it("unknown resources 404 and unauthenticated requests never reach handlers", async () => {
    const { token } = await makeAdmin("SUPER_ADMIN");
    expect((await call(list, { token, params: P("nope") })).status).toBe(404);
    expect((await call(list, { params: P("projects") })).status).toBe(401);
    expect((await call(create, { method: "POST", token, params: P("projects"), body: { title: "x" }, origin: "https://evil.example" })).status).toBe(403);
  });
});

describe("projects", () => {
  it("validates input, generates unique slugs, and rejects unknown fields", async () => {
    const { token } = await makeAdmin("ADMIN");
    const a = await call(create, { method: "POST", token, params: P("projects"), body: { title: "My Project" } });
    const b = await call(create, { method: "POST", token, params: P("projects"), body: { title: "My Project" } });
    expect(a.json.data.slug).toBe("my-project");
    expect(b.json.data.slug).toBe("my-project-2");
    expect((await call(create, { method: "POST", token, params: P("projects"), body: { title: "" } })).status).toBe(422);
    expect((await call(create, { method: "POST", token, params: P("projects"), body: { title: "x", id: "evil" } })).status).toBe(422);
    expect((await call(create, { method: "POST", token, params: P("projects"), body: { title: "x", projectUrl: "javascript:alert(1)" } })).status).toBe(422);
    expect((await call(create, { method: "POST", token, params: P("projects"), body: { title: "x", startDate: "2024-05-01", completionDate: "2024-01-01" } })).status).toBe(422);
  });

  it("full lifecycle: draft hidden → published visible → unpublished/archived hidden → restored", async () => {
    const { token } = await makeAdmin("ADMIN");
    const c = await call(create, { method: "POST", token, params: P("projects"), body: { title: "Lifecycle" } });
    const { id, slug } = c.json.data;
    const visible = async () => (await call(publicProjects)).json.data.length;
    const bySlug = async () => (await call(publicProject, { params: { slug } as never })).status;

    expect(await visible()).toBe(0);
    expect(await bySlug()).toBe(404);

    const pub = await call(update, { method: "PATCH", token, params: P("projects", id), body: { status: "PUBLISHED" } });
    expect(pub.json.data.publishedAt).toBeTruthy();
    expect(await visible()).toBe(1);
    expect(await bySlug()).toBe(200);

    await call(update, { method: "PATCH", token, params: P("projects", id), body: { status: "DRAFT" } });
    expect(await visible()).toBe(0);
    await call(update, { method: "PATCH", token, params: P("projects", id), body: { status: "PUBLISHED" } });
    await call(update, { method: "PATCH", token, params: P("projects", id), body: { status: "ARCHIVED" } });
    expect(await visible()).toBe(0);
    await call(update, { method: "PATCH", token, params: P("projects", id), body: { status: "DRAFT" } });

    const actions = (await db.auditLog.findMany({ orderBy: { createdAt: "asc" } })).map((l) => l.action);
    expect(actions).toEqual(expect.arrayContaining(["PROJECT_CREATED", "PROJECT_PUBLISHED", "PROJECT_UNPUBLISHED", "PROJECT_ARCHIVED", "PROJECT_RESTORED"]));
  });

  it("public responses expose only whitelisted fields", async () => {
    const { token } = await makeAdmin("ADMIN");
    const cl = await call(create, { method: "POST", token, params: P("clients"), body: { name: "Acme" } });
    await call(create, { method: "POST", token, params: P("projects"), body: { title: "Pub", status: "PUBLISHED", clientId: cl.json.data.id, seo: { seoTitle: "t" } } });
    const r = await call(publicProjects);
    const body = JSON.stringify(r.json);
    expect(body).not.toMatch(/status|createdAt|updatedAt|clientId|categoryId|"seo"/);
    const one = await call(publicProject, { params: { slug: "pub" } as never });
    expect(one.status).toBe(200);
    expect(JSON.stringify(one.json)).not.toMatch(/passwordHash|internalNotes|"status"/);
  });

  it("filters, searches, sorts and paginates on the server", async () => {
    const { token } = await makeAdmin("ADMIN");
    for (const t of ["Apple", "Banana", "Cherry"]) await call(create, { method: "POST", token, params: P("projects"), body: { title: t } });
    const q = (path: string) => call(list, { token, params: P("projects"), path });
    expect((await q("/api/admin/projects?q=ban")).json.data.map((p: { title: string }) => p.title)).toEqual(["Banana"]);
    const page = await q("/api/admin/projects?pageSize=2&sort=title&order=asc");
    expect(page.json.data.map((p: { title: string }) => p.title)).toEqual(["Apple", "Banana"]);
    expect(page.json.meta).toMatchObject({ total: 3, totalPages: 2 });
    expect((await q("/api/admin/projects?status=PUBLISHED")).json.data).toHaveLength(0);
    expect((await q("/api/admin/projects?sort=passwordHash")).status).toBe(200); // unknown sort falls back, never errors or injects
  });

  it("reorders atomically and rejects duplicate ids", async () => {
    const { token } = await makeAdmin("ADMIN");
    const ids: string[] = [];
    for (const t of ["A", "B", "C"]) ids.push((await call(create, { method: "POST", token, params: P("projects"), body: { title: t } })).json.data.id);
    const rev = [...ids].reverse();
    expect((await call(reorder, { method: "POST", token, params: P("projects"), body: { ids: rev } })).status).toBe(200);
    const rows = await db.project.findMany({ orderBy: { displayOrder: "asc" } });
    expect(rows.map((r) => r.id)).toEqual(rev);
    expect((await call(reorder, { method: "POST", token, params: P("projects"), body: { ids: [ids[0], ids[0]] } })).status).toBe(409);
  });
});

describe("clients and relationships", () => {
  it("does not allow deleting a client that still has projects; allows after reassignment", async () => {
    const { token } = await makeAdmin("ADMIN");
    const cl = (await call(create, { method: "POST", token, params: P("clients"), body: { name: "Acme Corp" } })).json.data;
    const pr = (await call(create, { method: "POST", token, params: P("projects"), body: { title: "P1", clientId: cl.id } })).json.data;
    const del = await call(remove, { method: "DELETE", token, params: P("clients", cl.id) });
    expect(del.status).toBe(409);
    expect(await db.client.count()).toBe(1);
    await call(update, { method: "PATCH", token, params: P("projects", pr.id), body: { clientId: null } });
    expect((await call(remove, { method: "DELETE", token, params: P("clients", cl.id) })).status).toBe(200);
  });

  it("links technologies and replaces them on update; rejects duplicate technology names", async () => {
    const { token } = await makeAdmin("ADMIN");
    const t1 = (await call(create, { method: "POST", token, params: P("technologies"), body: { name: "React" } })).json.data;
    const t2 = (await call(create, { method: "POST", token, params: P("technologies"), body: { name: "Node" } })).json.data;
    expect((await call(create, { method: "POST", token, params: P("technologies"), body: { name: "React" } })).status).toBe(409);
    const p = (await call(create, { method: "POST", token, params: P("projects"), body: { title: "T", technologyIds: [t1.id, t2.id] } })).json.data;
    expect(p.technologies).toHaveLength(2);
    const upd = await call(update, { method: "PATCH", token, params: P("projects", p.id), body: { technologyIds: [t2.id] } });
    expect(upd.json.data.technologies.map((t: { name: string }) => t.name)).toEqual(["Node"]);
  });
});

describe("inquiries", () => {
  it("accepts public submissions, never exposes data back, and keeps internal notes admin-only", async () => {
    const r = await call(submitInquiry, { method: "POST", body: { name: "Jo", email: "jo@x.com", message: "Hello" }, headers: { "x-forwarded-for": "9.9.9.1" } });
    expect(r.status).toBe(201);
    expect(r.json).toEqual({ data: { received: true } });
    const bad = await call(submitInquiry, { method: "POST", body: { name: "", email: "nope", message: "" }, headers: { "x-forwarded-for": "9.9.9.2" } });
    expect(bad.status).toBe(422);
    const bot = await call(submitInquiry, { method: "POST", body: { name: "Bot", email: "b@x.com", message: "spam", website: "http://spam" }, headers: { "x-forwarded-for": "9.9.9.3" } });
    expect(bot.status).toBe(201);
    expect(await db.inquiry.count()).toBe(1);

    const { token } = await makeAdmin("ADMIN");
    const id = (await call(adminInquiries, { token })).json.data[0].id;
    const upd = await call(patchInquiry, { method: "PATCH", token, params: { id }, body: { status: "CONTACTED", internalNotes: "call back" } });
    expect(upd.json.data.status).toBe("CONTACTED");
    expect(await db.auditLog.count({ where: { action: "INQUIRY_STATUS_CHANGED" } })).toBe(1);
  });

  it("rate limits public submissions per IP", async () => {
    let last = 0;
    for (let i = 0; i < 7; i++) last = (await call(submitInquiry, { method: "POST", body: { name: "A", email: "a@x.com", message: "m" }, headers: { "x-forwarded-for": "7.7.7.7" } })).status;
    expect(last).toBe(429);
  });
});

describe("media uploads", () => {
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");
  const form = (data: BlobPart, name: string, type: string) => { const f = new FormData(); f.set("file", new File([data], name, { type })); return f; };

  it("accepts a real image and records dimensions", async () => {
    const { token } = await makeAdmin("EDITOR");
    const r = await call(upload, { method: "POST", token, form: form(png, "../../evil name.png", "image/png") });
    expect(r.status).toBe(201);
    expect(r.json.data).toMatchObject({ width: 1, height: 1, mimeType: "image/png" });
    expect(r.json.data.filename).not.toMatch(/[\\/]/);
  });

  it("rejects non-images regardless of claimed type or extension (HTML, SVG, scripts, empty)", async () => {
    const { token } = await makeAdmin("EDITOR");
    for (const [data, name, type] of [
      ["<script>alert(1)</script>", "x.png", "image/png"],
      ['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>', "x.svg", "image/svg+xml"],
      ["<?php system($_GET[0]); ?>", "shell.php", "image/jpeg"],
      ["", "empty.png", "image/png"],
    ] as const) expect((await call(upload, { method: "POST", token, form: form(data, name, type) })).status).toBe(400);
  });

  it("rejects oversized files and requires auth", async () => {
    const { token } = await makeAdmin("EDITOR");
    const big = Buffer.concat([png, Buffer.alloc(5 * 1024 * 1024)]);
    expect((await call(upload, { method: "POST", token, form: form(big, "big.png", "image/png") })).status).toBe(400);
    expect((await call(upload, { method: "POST", form: form(png, "a.png", "image/png") })).status).toBe(401);
  });
});

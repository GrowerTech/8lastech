# Atlas Tech Admin

A separate admin app lives at **`/admin`** (UI) and **`/api/admin/*`** (API) inside this Next.js project.
The public site has no link to it. Public pages read admin-managed content with built-in fallbacks, so
an empty or unreachable database never breaks the homepage.

## Stack
Next.js 16 (App Router) · PostgreSQL · Prisma 7 (`@prisma/adapter-pg`) · Zod validation · argon2id passwords ·
DB-backed sessions in an `httpOnly; SameSite=Strict` cookie · Vercel Blob for media.

## Local development
```bash
cp .env.example .env            # then fill in values
docker compose up -d            # local Postgres on :5434 (optional; or point DATABASE_URL anywhere)
npm install                     # also runs `prisma generate`
npm run db:deploy               # apply migrations   (use `npm run db:migrate` to create new ones)
SEED_ADMIN_EMAIL=you@co.com SEED_ADMIN_PASSWORD='long-Passw0rd-here' npm run db:seed   # first SUPER_ADMIN
npm run dev                     # http://localhost:3000/admin
npm test                        # integration tests (needs TEST_DATABASE_URL, local DB only)
```
`db:seed` refuses to run if a SUPER_ADMIN already exists. Create more admins in the UI (SUPER_ADMIN only).

## Environment variables
| Var | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Postgres connection string |
| `TEST_DATABASE_URL` | tests | **Local** DB used by tests (they truncate tables; refuses non-localhost or same-as-`DATABASE_URL`) |
| `SESSION_SECRET` | prod | Reserved for HMAC derivations; 32+ random chars |
| `BLOB_READ_WRITE_TOKEN` | prod | Vercel Blob. Without it, dev falls back to `public/uploads/`; production returns 503 |
| `SITE_URL` | prod | Public origin; allowed as `Origin` for state-changing requests |
| `ADMIN_ALLOWED_ORIGINS` | no | Extra comma-separated allowed origins |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | seed only | First SUPER_ADMIN |

## Roles & permissions (`src/lib/server/permissions.ts`)
| Permission | SUPER_ADMIN | ADMIN | EDITOR |
|---|:-:|:-:|:-:|
| content read / write (create & edit drafts), media upload | ✓ | ✓ | ✓ |
| publish / archive / feature, delete content | ✓ | ✓ | – |
| inquiries read / write | ✓ | ✓ | – |
| SEO, company settings | ✓ | ✓ | – |
| manage admins, read audit log | ✓ | – | – |

Every privileged route runs: **origin check → session auth → permission check → rate limit → Zod validation → logic → DB**.
Add a role by extending the `AdminRole` enum and `ROLE_PERMISSIONS`.

## Auth
`POST /api/admin/auth/login|logout`, `GET /api/admin/auth/me`. argon2id hashes; constant-time-ish verify for unknown
emails; 5 failed logins lock the account 15 min; per-IP and per-email rate limits; sessions are random 256-bit tokens
stored hashed (SHA-256), 8h lifetime, revoked on role change / deactivation / password reset. Mutating requests must
carry an allowed `Origin`. Admin responses send `noindex`, `no-store`, `X-Frame-Options: DENY`.
> The rate limiter is in-memory (per instance). On multi-instance/serverless, back `src/lib/server/rate-limit.ts` with Redis/Upstash.

## API (all JSON: `{data, meta?}` or `{error:{code,message,details?}}`)
Lists support `page`, `pageSize` (≤100), `q`, `sort`, `order`; sort fields are whitelisted.

| Endpoint | Notes |
|---|---|
| `/api/admin/{projects,project-categories,clients,services,technologies,testimonials}` | `GET` list · `POST` create |
| `/api/admin/<resource>/:id` | `GET` · `PATCH` · `DELETE` (status changes via `PATCH {status}`: PUBLISHED / DRAFT / ARCHIVED) |
| `/api/admin/<resource>/reorder` | `POST {ids:[…]}` – atomic |
| `/api/admin/media` (+`/:id`) | multipart `file`; `PUT` replaces file keeping id; delete blocked while referenced |
| `/api/admin/inquiries` (+`/:id`) | status workflow, assignment, internal notes |
| `/api/admin/settings` · `/api/admin/seo` · `/api/admin/seo/:key` | company settings (singleton) · per-page SEO |
| `/api/admin/admin-users` (+`/:id`) | SUPER_ADMIN only; accounts are deactivated, not deleted |
| `/api/admin/audit-logs` · `/api/admin/dashboard` | |

Public (no auth, whitelisted fields, published/visible only, CDN-cacheable):
`GET /api/projects`, `/api/projects/:slug`, `/api/services`, `/api/clients`, `/api/testimonials`, `/api/settings`,
and `POST /api/inquiries` (rate-limited, honeypot, returns only an acknowledgement).

## Uploads
Images only (JPEG, PNG, WebP, GIF, AVIF), ≤4 MB (Vercel's body cap), ≤8000 px. Type and dimensions come from the file
bytes, never from the client filename/MIME. SVG is rejected. Stored names are random; original names are display-only.

## Data model decisions
- Roles are an enum + code map (no role table: nothing needs runtime-editable roles yet).
- Soft state is `status = ARCHIVED` (content) / `active = false` (admins). Other deletes are hard, guarded by FKs:
  a client with projects can't be deleted (409); media in use can't be deleted (409).
- Technologies/services are relations, not repeated strings. SEO is a JSON column on projects/services and a `PageSeo` table for pages.
- BlogPost / FAQ were intentionally **not** built: the site has neither.

## Production notes
Run `npm run db:deploy` in CI/deploy (never `migrate dev`). Set all env vars above. Serve over HTTPS (cookie is `Secure` in production).
Consider adding an IP allow-list or SSO in front of `/admin` if the team is small.

## Not yet wired
Hero/About/Process/stats copy is still static in components (no admin model yet). Services' icon is a Phosphor name limited to
the icons imported in `Services.tsx`.

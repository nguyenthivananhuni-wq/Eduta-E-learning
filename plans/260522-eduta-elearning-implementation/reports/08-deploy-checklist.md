# Report 08 — Deploy Checklist (Vercel + Turso)

Step-by-step deploy production. Total time estimate: 2-3h nếu suôn sẻ.

## Prerequisites

- [ ] Code in clean state, all tests pass locally
- [ ] Repo pushed to GitHub (private OK)
- [ ] Account Vercel (free tier)
- [ ] Account Turso (free tier — 500 DBs)
- [ ] Account installed CLI: `pnpm add -g turso vercel`

---

## Step 1 — Turso Setup (15 phút)

### 1.1 Install Turso CLI
```bash
# Windows: scoop install turso
# OR via curl
curl -sSfL https://get.tur.so/install.sh | bash
```

### 1.2 Login + create DB
```bash
turso auth signup       # one-time
turso auth login
turso db create eduta-prod --location sin  # Singapore region closest VN
```

### 1.3 Get connection URL + auth token
```bash
turso db show eduta-prod --url
# Output: libsql://eduta-prod-<username>.turso.io

turso db tokens create eduta-prod
# Output: eyJhbGciOi... (long JWT)
```

→ Lưu `TURSO_DATABASE_URL` và `TURSO_AUTH_TOKEN`.

### 1.4 Compose Prisma DATABASE_URL
Có 2 cách (chọn 1):

**Cách A — URL with token (simpler):**
```
DATABASE_URL="libsql://eduta-prod-<user>.turso.io?authToken=<token>"
```

**Cách B — Driver adapter (recommended cho prod robust):**

Edit `prisma/schema.prisma`:
```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

Edit `lib/db.ts`:
```ts
import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaLibSQL(libsql);

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

Install: `pnpm add @prisma/adapter-libsql @libsql/client`.

→ Plan dùng **Cách B**.

---

## Step 2 — Run Migrations on Turso (10 phút)

Approach simplest: paste migration SQL directly.

### 2.1 Locate migration file
```
prisma/migrations/<timestamp>_init/migration.sql
```

### 2.2 Run against Turso
```bash
turso db shell eduta-prod < prisma/migrations/<timestamp>_init/migration.sql
```

### 2.3 Verify schema
```bash
turso db shell eduta-prod
> .tables
# expect: User, Course, Module, Lesson, Quiz, Enrollment, LessonProgress, _prisma_migrations
> .exit
```

---

## Step 3 — Seed Production Data (10 phút)

### 3.1 Create `scripts/seed-prod.ts`
Copy `prisma/seed.ts` content. Ensure it reads from prod URL.

### 3.2 Run with prod env
```bash
# Windows PowerShell
$env:TURSO_DATABASE_URL="libsql://..."; $env:TURSO_AUTH_TOKEN="eyJ..."; $env:ADMIN_EMAIL="admin@eduta.local"; pnpm tsx scripts/seed-prod.ts
```

### 3.3 Verify
```bash
turso db shell eduta-prod
> SELECT email, role FROM User;
> SELECT slug, title FROM Course;
> .exit
```

Expect: 2 users, 3 courses.

---

## Step 4 — Vercel Project Setup (15 phút)

### 4.1 Push to GitHub
```bash
git remote add origin git@github.com:<username>/eduta.git
git push -u origin main
```

### 4.2 Import on Vercel
- vercel.com → New Project → Import GitHub repo `eduta`
- Framework: Next.js (auto-detect)
- Root directory: `./`
- Build command: `pnpm build` (auto)
- Install command: `pnpm install` (auto)
- Output directory: `.next` (auto)

### 4.3 Configure Environment Variables

| Key                    | Value                                                | Scope                |
|------------------------|------------------------------------------------------|----------------------|
| `TURSO_DATABASE_URL`   | `libsql://eduta-prod-<user>.turso.io`                | Production, Preview  |
| `TURSO_AUTH_TOKEN`     | `eyJ...` (Turso token)                               | Production, Preview  |
| `NEXTAUTH_SECRET`      | `openssl rand -base64 32` → random                   | Production, Preview  |
| `NEXTAUTH_URL`         | `https://<your-vercel-url>.vercel.app`               | Production           |
| `NEXTAUTH_URL_INTERNAL`| same as NEXTAUTH_URL                                 | Production (optional)|
| `ADMIN_EMAIL`          | `admin@eduta.local`                                  | Production, Preview  |
| `NODE_ENV`             | `production` (Vercel auto-sets)                      | -                    |

### 4.4 Ensure `package.json` has `postinstall`
```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "next build",
    "dev": "next dev",
    "start": "next start",
    "db:seed": "tsx prisma/seed.ts",
    "db:seed:prod": "tsx scripts/seed-prod.ts"
  }
}
```

### 4.5 First deploy
Click "Deploy". Wait ~2-3 phút.

---

## Step 5 — Troubleshoot Common Errors (variable time)

### Error: "Prisma Client did not initialize"
**Fix:** add `postinstall: "prisma generate"` (see 4.4).

### Error: "Environment variable not found: DATABASE_URL"
**Fix:**
- If using Cách A (URL only): set `DATABASE_URL` env var instead of `TURSO_*`
- If using Cách B (adapter): edit schema datasource to dummy URL or remove `url`:
  ```prisma
  datasource db {
    provider = "sqlite"
    url      = "file:./dummy.db" // not used at runtime when adapter is set
  }
  ```
  Adapter overrides connection.

### Error: "NEXTAUTH_URL is undefined"
**Fix:** set `NEXTAUTH_URL` in Vercel env vars = production URL.

### Error: Build success but runtime "session is null" on protected page
**Fix:** `NEXTAUTH_SECRET` chưa set hoặc khác giữa env. Set chính xác same secret.

### Error: Image broken / "Image with src is not configured"
**Fix:** `next.config.ts`:
```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "images.unsplash.com" },
  ],
}
```

---

## Step 6 — Smoke Test Production (15 phút)

Open production URL in incognito:

- [ ] Landing page loads, hero + featured courses display
- [ ] `/courses` shows 3 seeded courses
- [ ] Search "next" → filter works
- [ ] Click course → detail page
- [ ] Click "Đăng ký học" → redirect login
- [ ] Register new account → succeeds
- [ ] Login student account → land dashboard
- [ ] Enroll khóa Course 1 (free, price=0) → success → redirect /learn
- [ ] Video YouTube embed plays
- [ ] Markdown renders properly
- [ ] Mark lesson complete → toast + sidebar updates
- [ ] Quiz submit → score displays
- [ ] Dashboard shows progress %
- [ ] Logout → cookie cleared
- [ ] Login admin@eduta.local → see /admin
- [ ] Admin can create new course → published → appears in catalog
- [ ] Delete that test course → confirm cascade

---

## Step 7 — Final Polish (30 phút)

### 7.1 Vercel custom domain (optional)
Settings → Domains → add `eduta-elearning.vercel.app` alias or buy custom.

### 7.2 Disable Vercel telemetry (optional)
`next telemetry disable` (one-time).

### 7.3 Add `vercel.json` (optional)
```json
{
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

### 7.4 Tag release
```bash
git tag -a v1.0.0 -m "First demo release"
git push --tags
```

---

## Rollback plan

Nếu deploy break:
1. Vercel → Deployments → previous deploy → "Promote to Production".
2. Hoặc revert commit: `git revert HEAD && git push`.

## Cost summary

| Service     | Tier             | Cost         |
|-------------|------------------|--------------|
| Vercel      | Hobby (free)     | $0           |
| Turso       | Starter (free)   | $0 (500 DBs, 9GB total) |
| Domain      | (not required)   | $0           |
| **TOTAL**   |                  | **$0**       |

Đủ free cho đồ án.

---

## Post-deploy checklist (for README)

- [ ] Demo URL: `https://<your-deployment>.vercel.app`
- [ ] Admin test login: `admin@eduta.local` / `admin123`
- [ ] Student test login: `student@eduta.local` / `student123`
- [ ] Repo URL: `https://github.com/<user>/eduta`
- [ ] Screenshots uploaded to `docs/screenshots/`
- [ ] Git tagged `v1.0.0`

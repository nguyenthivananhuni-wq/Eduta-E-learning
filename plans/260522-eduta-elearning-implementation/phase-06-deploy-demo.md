# Phase 06 — Deploy + Demo Prep [DEFERRED → Phase 12]

> **STATUS:** DEFERRED per [BRAINSTORM_DECISIONS.md](./BRAINSTORM_DECISIONS.md) (2026-05-23).
> Deploy moved to end of marketplace expansion. See [Phase 12 — Deploy + Demo](./phase-12-deploy-demo.md) for the active version with full Phase 07-11 dependencies.
>
> Rationale: avoid double-deploy churn between MVP and marketplace. Phase 01-05 stable locally; deploy once after Phase 11 complete.

## Context links
- Parent: [plan.md](./plan.md)
- Prev: [Phase 05](./phase-05-student-dashboard-polish.md)
- Refs: [reports/08-deploy-checklist.md](./reports/08-deploy-checklist.md)
- Dependencies: Phase 01-05 done, app stable locally.

## Overview
- **Date:** 2026-05-22
- **Days:** 12-14
- **Description:** Bug bash edge cases → migrate SQLite → Turso (libSQL) → deploy Vercel → README + screenshots → demo video / slide prep. Sẵn sàng nộp đồ án.
- **Priority:** Critical (không deploy = không demo được)
- **Implementation status:** DEFERRED (see Phase 12)
- **Review status:** Not Reviewed

## Key Insights
- Turso = libSQL = SQLite-compatible. Prisma support qua `@libsql/client` + driver adapter.
- Đổi `provider = "sqlite"` → vẫn dùng được Turso vì wire protocol compatible. Hoặc dùng `previewFeatures = ["driverAdapters"]`.
- Vercel env vars: NEXTAUTH_SECRET, NEXTAUTH_URL, TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, ADMIN_EMAIL.
- Seed phải chạy được trên Turso → script `pnpm db:seed:prod` với env Turso.
- README phải có screenshots + setup instructions + tech stack + features list cho thầy.

## Requirements
1. Bug bash checklist (Day 12) covering edge cases.
2. Turso migration: schema deploy + seed prod data.
3. Vercel project link Git repo, env vars configured.
4. Public URL accessible, all flows work on production.
5. README.md đẹp: title, demo URL, screenshots, setup, features, tech stack, scope notes.
6. (Optional) Demo video 2-3 phút walkthrough cho slide bảo vệ.
7. Tag git release `v1.0.0`.

## Architecture
**Local dev:** SQLite file `prisma/dev.db`
**Production:** Turso libSQL cloud
**Switch mechanism:** `DATABASE_URL` env var

**Prisma config:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```
- Local: `DATABASE_URL="file:./dev.db"`
- Prod: `DATABASE_URL="libsql://<db>.turso.io?authToken=<token>"`
  (OR dùng driver adapter pattern — xem report 08)

## Related code files
**Create:**
- `README.md`
- `.env.example` (update với Turso vars)
- `scripts/seed-prod.ts` (giống seed.ts nhưng read prod DATABASE_URL)
- `docs/screenshots/` (thư mục screenshots cho README)
- `LICENSE` (MIT) — optional

**Modify:**
- `prisma/schema.prisma` — verify provider compat
- `package.json` — add scripts: `build`, `db:migrate:prod`, `db:seed:prod`, `postinstall: prisma generate`
- `next.config.ts` — verify image domains

## Implementation Steps

### Day 12 — Bug Bash
1. **Run through every flow** in clean browser (no cached session):
   - Anonymous: `/`, `/courses`, `/courses/[slug]` ok.
   - Register → email validation works, weak password rejected, duplicate email error.
   - Login wrong password → error message.
   - Logout → can't access `/dashboard`.
   - Enroll twice → blocked.
   - Direct URL `/learn/xxx/yyy` without enrollment → redirect.
   - Quiz: empty submit → require all answered.
   - Admin try edit non-existent course → 404.
   - Delete course with enrollments → confirm cascade.
2. **Fix all reported bugs** before moving on.

### Day 13 — Deploy
3. **Sign up Turso**, create DB: `turso db create eduta-prod`. Copy URL + auth token.
4. **Update `.env.example`** with prod env names.
5. **Migrate schema to Turso**: option A — `turso db shell <db> < prisma/migrations/.../migration.sql` OR option B — use `prisma migrate deploy` with TURSO env vars.
6. **Push code to GitHub** (private repo OK).
7. **Create Vercel project**, link repo, add env vars (xem [reports/08-deploy-checklist.md](./reports/08-deploy-checklist.md)):
   - `DATABASE_URL`, `TURSO_AUTH_TOKEN` (if using adapter), `NEXTAUTH_SECRET`, `NEXTAUTH_URL=https://<vercel-url>`, `ADMIN_EMAIL`.
8. **First deploy** → wait for build. Fix any build errors (usually env or prisma generate).
9. **Run seed against Turso**: `DATABASE_URL="libsql://..." pnpm db:seed:prod`.
10. **Smoke test prod URL**: register → enroll → learn → quiz. Confirm data persists.

### Day 14 — Demo Prep
11. **Take screenshots** of each major page: landing, catalog, detail, checkout, lesson, quiz result, dashboard, admin. Save to `docs/screenshots/`.
12. **Write `README.md`** with sections:
    - Demo URL + admin/student test credentials
    - Features (bulleted, with checkmarks)
    - Tech stack table
    - Setup local: `pnpm install`, `.env.local`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev`
    - Screenshots embedded
    - Scope notes (in/out)
    - Acknowledgments
13. **Record demo video** (2-3 phút) screen capture all flows. Optional but helps bảo vệ.
14. **Prepare slide** (Google Slides hoặc Canva): problem, stack, data model, demo screenshots, future work.
15. **Git tag**: `git tag v1.0.0 && git push --tags`.

## Todo list
- [ ] Day 12 bug bash full flow
- [ ] Fix all bugs found
- [ ] Sign up Turso + create DB
- [ ] Update `.env.example`
- [ ] Migrate schema to Turso
- [ ] Push to GitHub
- [ ] Create Vercel project + env vars
- [ ] First deploy + fix build errors
- [ ] Seed prod data
- [ ] Smoke test prod URL
- [ ] Take screenshots
- [ ] Write README.md
- [ ] (Optional) Record demo video
- [ ] Prepare slide
- [ ] Git tag v1.0.0

## Success Criteria
- Bug list từ day 12 = 0 outstanding bugs.
- Vercel deployment status: Ready, no build errors.
- Public URL accessible from incognito → all flows work.
- README.md gồm: live URL + screenshots + setup instructions + features.
- Admin login on prod work với `ADMIN_EMAIL` đã seed.
- Seed data hiển thị đầy đủ trên prod.
- Git tagged v1.0.0.

## Risk Assessment
| Risk                                                   | Likelihood | Impact | Mitigation                                                                       |
|--------------------------------------------------------|------------|--------|----------------------------------------------------------------------------------|
| Prisma SQLite ↔ Turso incompatibility surprise         | Med        | High   | Test Turso connection LOCAL trước khi deploy. Có fallback: Vercel Postgres free  |
| Vercel build fail vì prisma generate                   | High       | Med    | `postinstall: prisma generate` trong package.json                                |
| NEXTAUTH_URL mismatch → callback fail                  | High       | High   | Set chính xác = Vercel deployment URL, không trailing slash                      |
| Env var missing trên Vercel → crash khi cold start    | Med        | High   | Double-check ALL env vars set trước first deploy                                 |
| Seed prod chạy lỗi vì connection limit                 | Low        | Med    | Seed batch, hoặc seed từng record với await                                      |
| Day 14 buffer bị eat hết bởi bug từ day 12             | Med        | Med    | Strict timebox: day 12 morning bug bash → afternoon FIX, nếu chưa fix xong cắt scope |

## Security Considerations
- `NEXTAUTH_SECRET` PRODUCTION khác local, generate random ≥ 32 chars: `openssl rand -base64 32`.
- `ADMIN_EMAIL` prod nên KHÔNG dùng email cá nhân thật → dùng `admin@eduta.local` hoặc admin riêng demo.
- Database URL + Turso token: KHÔNG commit. Set chỉ trong Vercel env vars (encrypted).
- `.env.local` MUST gitignored (verify lại).
- Disable Next.js telemetry không cần thiết: `next telemetry disable`.
- HTTPS automatic via Vercel.
- README KHÔNG leak secret values, chỉ key names.

## Next steps
→ Đồ án hoàn thành, sẵn sàng demo/bảo vệ. Sau bảo vệ optional: viết postmortem, share repo public.

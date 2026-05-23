# Phase 12 — Deploy + Demo Prep (FINAL)

## Context links
- Parent: [plan.md](./plan.md)
- Prev: [Phase 11 — Admin Enhancements](./phase-11-admin-enhancements.md)
- Refs: [reports/08-deploy-checklist.md](./reports/08-deploy-checklist.md)
- Dependencies: Phase 01-11 done (all marketplace features stable locally).
- Note: Phase 06 (original deploy) DEFERRED to this phase per [BRAINSTORM_DECISIONS.md](./BRAINSTORM_DECISIONS.md).

## Overview
- **Date:** 2026-05-23
- **Description:** Final deploy sau khi mọi marketplace feature done. Bug bash edge cases full system → migrate SQLite → Turso (libSQL) → deploy Vercel → README + screenshots → demo video/slide. Sẵn sàng nộp đồ án + bảo vệ. KHÔNG deploy giữa chừng — Phase 06 đã skip.
- **Priority:** Critical (không deploy = không demo)
- **Implementation status:** Not Started
- **Review status:** Not Reviewed

## Key Insights
- Turso = libSQL = SQLite-compatible. Prisma support via `@libsql/client` + driver adapter.
- Đổi `provider = "sqlite"` → vẫn dùng được Turso vì wire protocol compatible. Hoặc dùng `previewFeatures = ["driverAdapters"]`.
- Vercel env vars expanded (Phase 07-11 deps): `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (optional adapter mode), `ADMIN_EMAIL`, `ANTHROPIC_API_KEY` (optional Phase 09), `WELCOME_BONUS`, `PLATFORM_FEE_PERCENT`.
- Seed phải chạy được trên Turso (~15 tables) → script `pnpm db:seed:prod` với env Turso. Test trên Turso copy DB trước first prod seed.
- README phải mention marketplace (multi-role, wallet, AI rec) cho thầy.
- 15 tables (vs 6 Phase 01): User, Account, Session, VerificationToken, Course, Module, Lesson, Quiz, Enrollment, LessonProgress, QuizAttempt, InstructorApplication, Wallet, Transaction, Notification, Review, RecommendationCache, Attachment, Report. → ~18 tables actual count.

## Pre-requisites & Existing Code Refactor

### From previous phases
- Phase 01-11 đã done locally; full smoke test PASS.
- Local SQLite stable, 18 tables, ~3-5 demo users, 1 real course + 5 dummy.
- All env vars documented `.env.example`.

### Files to modify (existing)
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Verify provider compat (Turso); add `previewFeatures = ["driverAdapters"]` if needed |
| `package.json` | Add scripts: `build`, `db:migrate:prod`, `db:seed:prod`, `postinstall: prisma generate` |
| `next.config.ts` | Verify image domains (course thumbnails) |
| `.env.example` | Final pass: all Phase 07-11 vars present |
| `README.md` | Rewrite full: marketplace features list, multi-role demo creds, AI rec note, tech stack table updated |

### Files to create (new)
- `scripts/seed-prod.ts` — read prod DATABASE_URL, run seed safely (idempotent if possible; minimum: drop+reseed)
- `docs/screenshots/` — directory for README screenshots
- `LICENSE` (MIT) — optional

## Requirements
1. Bug bash full marketplace flow (Day -2): student + instructor + admin journeys.
2. Turso migration: 18-table schema deploy + seed prod data.
3. Vercel project link Git repo, env vars configured (including AI optional).
4. Public URL accessible, all marketplace flows work production.
5. README.md đẹp: title, demo URL, multi-role creds, marketplace features, tech stack, setup, screenshots, scope notes.
6. (Optional) Demo video 3-5 phút walkthrough cho bảo vệ.
7. Tag git release `v2.0.0` (vs v1.0.0 MVP nếu đã tag).

## Architecture
**Local dev:** SQLite file `prisma/dev.db` (~18 tables).
**Production:** Turso libSQL cloud, same schema.
**Switch:** `DATABASE_URL` env var.

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```
- Local: `DATABASE_URL="file:./dev.db"`
- Prod: `DATABASE_URL="libsql://<db>.turso.io?authToken=<token>"` (OR driver adapter — xem report 08)

**Env vars matrix:**
| Var | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | Yes | Turso libSQL URL |
| `TURSO_AUTH_TOKEN` | If adapter mode | Else inline in URL |
| `NEXTAUTH_SECRET` | Yes | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | Vercel deployment URL, no trailing slash |
| `ADMIN_EMAIL` | Yes | Seeded admin login |
| `ANTHROPIC_API_KEY` | No | Optional Phase 09; fallback nếu missing |
| `WELCOME_BONUS` | No | Default 500000 in lib/constants.ts |
| `PLATFORM_FEE_PERCENT` | No | Default 30 in lib/constants.ts |

## Related code files

**Create:**
- `README.md`
- `scripts/seed-prod.ts`
- `docs/screenshots/`
- `LICENSE` (optional MIT)

**Modify:**
- `prisma/schema.prisma`
- `package.json`
- `next.config.ts`
- `.env.example`

## Implementation Steps

### Day -2 (Final bug bash)
1. Run full marketplace journeys in clean browser (no cached session):
   - **Anonymous:** `/`, `/courses` (only APPROVED visible), `/courses/[slug]` ok.
   - **Student journey:** Register → login → wallet shows 500k → browse → enroll free course → enroll paid course (balance deduct) → top-up → try enroll insufficient (Nạp tiền link) → learn lesson → quiz → progress → write review → see rating update.
   - **Instructor journey:** Apply at /become-instructor → wait admin approve → access /instructor → create course (DRAFT) → submit for review (PENDING) → wait approve → see earnings on dashboard → see review feedback.
   - **Admin journey:** Approve instructor application → approve course → reject another (with reason) → /admin/users suspend test user → /admin/transactions filter → /admin/analytics check charts → /admin/reports queue.
   - **Edge cases:** Direct URL access bypassing guards (`/instructor/*` as STUDENT, `/admin` as INSTRUCTOR). Wallet race (rapid clicks Mua khóa). Refresh on /dashboard while LLM rec computing. Suspended user login attempt.
2. Fix all bugs before deploy.

### Day -1 (Deploy)
3. Sign up Turso, create DB: `turso db create eduta-prod`. Copy URL + auth token.
4. Update `.env.example` final pass.
5. Migrate schema to Turso: `turso db shell <db> < prisma/migrations/<latest>/migration.sql` OR via Prisma `migrate deploy` with TURSO env.
6. Push code to GitHub (private OK).
7. Create Vercel project, link repo, add ALL env vars (xem report 08 + Phase 11 add-ons). Set `ANTHROPIC_API_KEY` if available.
8. First deploy → wait build. Fix build errors (env, prisma generate).
9. Seed prod: `DATABASE_URL="libsql://..." pnpm db:seed:prod`.
10. Smoke test prod URL: register → enroll → wallet → instructor apply (manual approve via studio if first admin) → learn → quiz → review → admin pages.

### Day 0 (Demo prep)
11. Take screenshots: landing, catalog, detail with reviews, wallet, checkout, lesson, quiz result, dashboard với AI rec, become-instructor, instructor dashboard, admin analytics, admin queue.
12. Write `README.md`:
    - Demo URL + admin / instructor / student test creds.
    - Features (bulleted, marketplace highlights: multi-role, wallet, AI rec, reviews, course approval, file attachments, admin analytics).
    - Tech stack table (updated với @anthropic-ai/sdk).
    - Setup local: `pnpm install`, `.env.local`, `pnpm db:migrate`, `pnpm db:seed`, `pnpm dev`.
    - Screenshots embedded.
    - Scope notes (Phase 1 MVP vs Phase 2 marketplace).
    - Open Questions / future work (Phase 14+ ideas).
13. (Optional) Record demo video 3-5 phút screen capture all 3 role flows.
14. Prepare slide (Google Slides hoặc Canva): problem, stack, data model (15 tables), marketplace flow diagrams, demo screenshots, future work.
15. Git tag: `git tag v2.0.0 && git push --tags`.

## Todo list
- [ ] Step 1: bug bash full marketplace flow
- [ ] Step 2: fix all bugs
- [ ] Step 3: sign up Turso + create DB
- [ ] Step 4: final .env.example pass
- [ ] Step 5: migrate schema to Turso
- [ ] Step 6: push to GitHub
- [ ] Step 7: create Vercel project + env vars (incl AI key optional)
- [ ] Step 8: first deploy + fix build errors
- [ ] Step 9: seed prod data
- [ ] Step 10: smoke test prod URL (all 3 roles)
- [ ] Step 11: take screenshots (12+ pages)
- [ ] Step 12: write README.md (marketplace edition)
- [ ] Step 13: (optional) record demo video
- [ ] Step 14: prepare slide
- [ ] Step 15: git tag v2.0.0

## Success Criteria
- Bug list = 0 outstanding.
- Vercel deployment Ready, no build errors.
- Public URL accessible incognito → all 3 role flows work.
- README.md gồm: live URL + multi-role creds + screenshots + setup + features + scope.
- Admin / Instructor / Student logins all work on prod.
- Seed data hiển thị đầy đủ trên prod (~18 tables populated).
- AI recommendation works if key set, fallback if not.
- Git tagged v2.0.0.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Prisma SQLite ↔ Turso incompat | Med | High | Test Turso connect local trước deploy. Fallback Vercel Postgres free |
| Vercel build fail vì prisma generate | High | Med | `postinstall: prisma generate` trong package.json |
| NEXTAUTH_URL mismatch → callback fail | High | High | Set chính xác Vercel URL, no trailing slash |
| Env var missing on Vercel → crash cold start | Med | High | Double-check ALL Phase 07-11 vars before first deploy |
| Seed prod fail vì connection limit (18 tables) | Med | Med | Batch insert hoặc serial await; or seed once via studio |
| ANTHROPIC_API_KEY leak | Low | Critical | Vercel encrypted env vars; never `NEXT_PUBLIC_*` |
| Wallet purchase race in prod (libSQL concurrent) | Low | Med | `$transaction` already in code; libSQL ACID guarantee |
| Day 0 buffer eaten by bugs | Med | Med | Strict timebox: bug bash morning → fix afternoon |
| Phase 11 admin pages có lỗi production-only (env path) | Med | Med | Include /admin in smoke test step 10 |

## Security Considerations
- `NEXTAUTH_SECRET` prod ≠ local, generate `openssl rand -base64 32`.
- `ADMIN_EMAIL` prod KHÔNG dùng email cá nhân; `admin@eduta.local` or demo-only.
- `ANTHROPIC_API_KEY` server-only — verify NOT bundled into client (Next.js prod build check).
- Turso auth token: KHÔNG commit. Only Vercel encrypted env vars.
- `.env.local` gitignored (verify).
- Wallet welcome bonus: seed only, no exposed action.
- Suspended user check working on prod auth.ts.
- HTTPS automatic via Vercel.
- README KHÔNG leak secret values, chỉ key names.
- Demo creds on README KHÔNG là admin email cá nhân; dùng `student@demo.eduta.local` style.

## Next steps
→ Đồ án hoàn thành. Sẵn sàng demo/bảo vệ. Sau bảo vệ optional: postmortem, share repo public, plan Phase 14+ (email verify, real payment, mobile app).

# Plan: Eduta E-Learning 2.0 — Implementation

> **Date:** 2026-05-22 | **Type:** Greenfield đồ án | **Timeline:** 14 days sprint
> **Source:** [BRAINSTORM_REPORT.md](../../BRAINSTORM_REPORT.md)

## Project Description

Web e-learning "mini-Coursera" làm đồ án bài tập lớn. Single-monolith Next.js 15 full-stack + Prisma + SQLite. Demo-focused, không production-grade. Core flow: Student đăng ký → mua khóa (mock pay) → học lesson + quiz → track progress. Admin CRUD course/module/lesson/quiz.

## Tech Stack Summary

| Layer        | Choice                                            |
|--------------|---------------------------------------------------|
| Framework    | Next.js 15 (App Router) + TypeScript strict       |
| Database     | SQLite local (`prisma/dev.db`) → Turso on prod    |
| ORM          | Prisma                                            |
| Auth         | Auth.js v5 — Credentials (bcrypt)                 |
| UI           | shadcn/ui + Tailwind CSS + lucide-react           |
| Forms        | react-hook-form + zod                             |
| Mutations    | Server Actions only (no REST/API routes)          |
| Video        | YouTube iframe embed                              |
| Markdown     | react-markdown                                    |
| Payment      | Mock UI (no real gateway)                         |
| Hosting      | Vercel free + Turso libSQL                        |
| Package mgr  | pnpm                                              |

## Phases

| #  | File                                          | Status       | Notes                                                                                |
|----|-----------------------------------------------|--------------|--------------------------------------------------------------------------------------|
| 01 | [phase-01-foundation-setup.md](./phase-01-foundation-setup.md) | Done         | MVP Phase 1                                                                          |
| 02 | [phase-02-admin-crud.md](./phase-02-admin-crud.md) | Done         | MVP Phase 1                                                                          |
| 03 | [phase-03-public-pages.md](./phase-03-public-pages.md) | Done         | MVP Phase 1                                                                          |
| 04 | [phase-04-learning-experience.md](./phase-04-learning-experience.md) | Done         | MVP Phase 1                                                                          |
| 05 | [phase-05-student-dashboard-polish.md](./phase-05-student-dashboard-polish.md) | Done         | MVP Phase 1                                                                          |
| 06 | [phase-06-deploy-demo.md](./phase-06-deploy-demo.md) | DEFERRED     | Moved to Phase 12 (deploy once after marketplace)                                    |
| 07 | [phase-07-marketplace-foundation.md](./phase-07-marketplace-foundation.md) | Not Started  | **MERGED**: role + wallet + status + notification (former 07+08+09). Critical blocker |
| 08 | [phase-08-reviews-ratings.md](./phase-08-reviews-ratings.md) | Not Started  | (former phase-10)                                                                    |
| 09 | [phase-09-ai-recommendation.md](./phase-09-ai-recommendation.md) | Not Started  | (former phase-11)                                                                    |
| 10 | [phase-10-file-attachments.md](./phase-10-file-attachments.md) | Not Started  | (former phase-12)                                                                    |
| 11 | [phase-11-admin-enhancements.md](./phase-11-admin-enhancements.md) | Not Started  | (former phase-13)                                                                    |
| 12 | [phase-12-deploy-demo.md](./phase-12-deploy-demo.md) | Not Started  | Final deploy AFTER all marketplace features                                          |
| 13 | [phase-13-review-intelligence.md](./phase-13-review-intelligence.md) | Not Started  | Add-on: AI review summary (pros/cons) + rating distribution chart                    |
| 14 | [phase-14-analytics-deep-dive.md](./phase-14-analytics-deep-dive.md) | Not Started  | Add-on: revenue charts + per-course analytics + category breakdown + conversion      |

## Phase 07 — Foundation Migration Strategy

**Why merge 07+08+09 → Phase 07:** 3 phase cũ đều touch cùng `Course` + `User` table (add `instructorId`, `status` enum, `suspended` flag, INSTRUCTOR role). Migrate riêng lẻ → SQLite ALTER TABLE limit + boolean→enum conversion data corruption risk. 1 migration tổng `marketplace_foundation` atomic.

**Why Phase 06 deferred:** Phase 01-05 done locally, deploy giữa chừng = double deploy churn. Marketplace stable → deploy 1 lần ở Phase 12.

**Phase 07 = blocker:** Once done, Phase 08-11 độc lập (mỗi phase chỉ add table mới + minor refactors).

Reference: [BRAINSTORM_DECISIONS.md](./BRAINSTORM_DECISIONS.md).

**Implementation order:**
```
Phase 07 (Foundation) → Phase 08 (Reviews) → Phase 09 (AI) → Phase 10 (Files) → Phase 11 (Admin) → Phase 12 (Deploy)
```

## Supporting Reports

- [01-file-structure.md](./reports/01-file-structure.md) — full file tree
- [02-prisma-schema.md](./reports/02-prisma-schema.md) — schema sẵn paste
- [03-auth-setup.md](./reports/03-auth-setup.md) — Auth.js v5 config
- [04-server-actions.md](./reports/04-server-actions.md) — full action catalog
- [05-components-breakdown.md](./reports/05-components-breakdown.md) — reusable components
- [06-seed-data.md](./reports/06-seed-data.md) — 3 mock courses VN
- [07-mock-payment-flow.md](./reports/07-mock-payment-flow.md) — UX walkthrough
- [08-deploy-checklist.md](./reports/08-deploy-checklist.md) — Vercel + Turso
- [09-extended-schema.md](./reports/09-extended-schema.md) — full schema after Phase 07-13 + migration matrix
- [10-extended-server-actions.md](./reports/10-extended-server-actions.md) — 28 new Server Actions catalog
- [11-ai-integration.md](./reports/11-ai-integration.md) — Claude API integration architecture
- [12-marketplace-flows.md](./reports/12-marketplace-flows.md) — student/instructor/admin user journeys

## Timeline Summary

- **Phase 1 MVP (01-05):** Done — Foundation + Admin CRUD + Public + Learning UX + Dashboard.
- **Phase 2 Marketplace (07-11):** Not Started, incremental no hard deadlines. Phase 07 = blocker.
- **Phase 3 Deploy (12):** After everything done. Phase 06 archived as DEFERRED.

**Total (MVP Phase 01-05 done):** 5 phases, 10 routes, 6 tables, ~12 reusable components.
**Total (after Phase 07-12):** 12 phases (01-05 + 07-12), ~25 routes, ~18 tables, ~30 components.

## Resolved Decisions (2026-05-22)

- [x] **App name:** Eduta
- [x] **Admin email:** `admin@eduta.local` (env: `ADMIN_EMAIL`)
- [x] **Theme:** Slate base + Indigo accent (shadcn)
- [x] **Categories:** `["Lập trình", "Thiết kế", "Kinh doanh", "Ngoại ngữ"]`
- [x] **Google OAuth:** BỎ — chỉ Credentials (email/password + bcrypt)
- [x] **Mock payment UI:** VietQR placeholder image + countdown 2s → success toast
- [x] **REAL course (1):** **Tiếng Anh 10 — Global Success, Unit 1-3** (Family Life, Humans and the Environment, Music). 3 modules × 5 lessons = 15 lessons + 9 quizzes.
- [x] **DUMMY courses (5):** Coming Soon badge — chỉ title + thumbnail + description, 0 modules. Catalog detect `_count.modules === 0` → disable enroll.

## Scope Change Note

> Original brainstorm: 3 full courses. Updated: **1 full course + 5 placeholder**. Lý do: user muốn focus content quality cho 1 khóa (Tiếng Anh 10), tiết kiệm ~1-2 ngày seed/content. Catalog vẫn trông đầy đặn nhờ 5 dummy cards với "Coming Soon" badge.

→ Impact on phases:
- Phase 01 seed time: giảm ~50% (chỉ 1 full course)
- Phase 03 catalog UI: thêm "Coming Soon" badge logic (~30 phút)
- Phase 04 lesson viewer: không đổi (chỉ test với khóa thật)
- Phase 05 dashboard: không đổi

## Phase 2 — Marketplace Extension (Phase 07-11) + Deploy (Phase 12)

Scope EXPANSION beyond original 14-day MVP. Transform Eduta from single-admin LMS into multi-instructor marketplace + LMS.

**Timeline:** Flexible, incremental — no hard deadlines. Phase 07 = blocker for 08-11. Phase 12 deploy LAST.

**Confirmed decisions (2026-05-23):**
- [x] **AI Recommendation:** LLM via Claude API (model `claude-haiku-4-5-20251001`). Fallback rule-based when no API key.
- [x] **Wallet:** Mock top-up UI (4 preset amounts, 2s loader). No real payment gateway. Welcome bonus 500,000đ per new student.
- [x] **Email verification:** SKIP. User registers and uses immediately.
- [x] **File upload:** URL paste only. No UploadThing / S3.
- [x] **Withdrawal flow:** Out of scope. Instructors see earnings but cannot cash out.
- [x] **Phase 07 atomic merge:** 3 phase cũ (07+08+09) → 1 phase Foundation Migration (review-needed before /cook trigger).
- [x] **Phase 06 deferred:** deploy 1 lần ở Phase 12.

**New scope summary (post-restructure):**
| Phase | Theme                              | New tables                                   | Notes                                              |
|-------|------------------------------------|----------------------------------------------|----------------------------------------------------|
| 07    | **Marketplace Foundation (MERGED)** | InstructorApplication, Wallet, Transaction, Notification | Role INSTRUCTOR + Course.instructorId + status enum + welcome bonus + suspended flag |
| 08    | Reviews & Ratings                  | Review (+ Course.avgRating, reviewCount)     | Denormalized aggregate                             |
| 09    | AI Recommendation                  | RecommendationCache                          | Claude API + rule-based fallback                   |
| 10    | File Attachments                   | Attachment                                   | URL paste only                                     |
| 11    | Admin Enhancements                 | Report (User.suspended ĐÃ có từ Phase 07)    | Analytics + moderation + user mgmt                 |
| 12    | Deploy + Demo (was Phase 06)       | -                                            | Vercel + Turso, final demo prep                    |

## Open Questions

- **Email verification:** SKIPPED for now. Add as future Phase 14 if needed.
- **Real payment integration:** Out of scope. Mock wallet sufficient for demo.
- **File upload service (UploadThing/S3):** Out of scope. URL paste sufficient.
- **Multilingual (i18n):** Not planned.
- **Mobile app (React Native / Flutter):** Not planned.
- **Withdrawal flow for instructors:** Not in scope. Instructors see earnings but cannot cash out.
- **AI personalization beyond recommendations** (AI tutor chat, AI quiz generator, embedding-based similarity): Future phases possible.
- **Phase 07 atomic merge:** review-needed before /cook trigger (foundation migration touches 5+ existing files + schema changes).

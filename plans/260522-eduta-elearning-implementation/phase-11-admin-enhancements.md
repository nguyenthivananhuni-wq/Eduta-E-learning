# Phase 11 — Admin Enhancements

## Context links
- Parent: [plan.md](./plan.md)
- Prev: [Phase 10 — File Attachments](./phase-10-file-attachments.md)
- Refs: [reports/09-extended-schema.md](./reports/09-extended-schema.md), [reports/10-extended-server-actions.md](./reports/10-extended-server-actions.md), [reports/12-marketplace-flows.md](./reports/12-marketplace-flows.md)
- Dependencies: Phase 07 (Transaction, Wallet, Notification, User.suspended already exist), Phase 08 (Review for reporting), Phase 09 + 10 (full entity set).

## Overview
- **Date:** 2026-05-23
- **Description:** Admin power tools: user management (suspend/promote/delete), transactions overview, analytics revamp (revenue, top courses, top instructors, user growth), reports system (user flag content → admin queue resolve). `User.suspended` ĐÃ có từ Phase 07 → không cần migrate. New table `Report` only.
- **Priority:** Med (operational tooling)
- **Implementation status:** Not Started
- **Review status:** Not Reviewed

## Key Insights
- `User.suspended` flag ĐÃ tồn tại từ Phase 07 + auth.ts ĐÃ check → Phase 11 chỉ thêm actions toggle + sự kiện notify.
- Promote-to-admin có hidden risk: admin tự promote → confirm dialog 2 lần.
- Delete user cascade: existing FKs (Enrollment, Review, Notification, Wallet, Transaction, RecommendationCache, Attachment via Lesson). Courses owned → instructorId set NULL (Phase 07 already configured).
- Report `targetType` enum + `targetId` string (polymorphic) — không cần per-type FK.
- Analytics charts: CSS bars > recharts (KISS, không thêm dep).
- Top courses by enrollment = `db.enrollment.groupBy({ by: ["courseId"], _count: { id: true } })`.
- Top instructors by earnings = sum Transaction.amount WHERE type=EARNING groupBy userId.

## Pre-requisites & Existing Code Refactor

### Schema changes
- 1 migration `admin_enhancements`:
  - New enum `ReportTargetType { COURSE USER REVIEW }`.
  - New enum `ReportStatus { PENDING RESOLVED DISMISSED }`.
  - New `Report` (id, reporterId FK, targetType, targetId String, reason, status @default(PENDING), createdAt, resolvedAt?, resolvedBy?) + relation reporter + relation resolver (nullable) + index `(status, createdAt desc)`.
- NO change to User table — `suspended` ĐÃ có từ Phase 07.

### Files to modify (existing)
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add Report model + ReportTargetType + ReportStatus enums + User reverse relations (reportsFiled, reportsResolved) |
| `app/(admin)/admin/page.tsx` | Full revamp: redirect to `/admin/analytics` OR replace content với 4 KPI cards + top lists + chart |
| `app/(admin)/layout.tsx` | Sidebar add Users / Transactions / Analytics / Reports links + pending reports badge |
| `app/(public)/courses/[slug]/page.tsx` | Embed `<ReportButton type="COURSE" targetId={course.id} />` (only if logged-in + not own course) |
| `components/reviews/ReviewItem.tsx` | Embed flag icon `<ReportButton type="REVIEW" targetId={review.id} />` |
| `prisma/seed.ts` | Optional: add 1 test suspended user for demo; no Report rows needed |

### Files to create (new)
- `app/(admin)/admin/users/page.tsx` — list + filter (role, search) + actions
- `app/(admin)/admin/transactions/page.tsx` — list with filters (type, date range, user search)
- `app/(admin)/admin/analytics/page.tsx` — KPI cards + top lists + chart
- `app/(admin)/admin/reports/page.tsx` — pending queue
- `components/admin/UserActionsMenu.tsx` — dropdown suspend/unsuspend/promote/delete
- `components/admin/UserFilters.tsx`
- `components/admin/TransactionFilters.tsx`
- `components/admin/AnalyticsCards.tsx` — 4 KPI cards
- `components/admin/TopCoursesList.tsx`
- `components/admin/TopInstructorsList.tsx`
- `components/admin/UserGrowthChart.tsx` — CSS bars
- `components/admin/ReportCard.tsx` — preview + resolve/dismiss buttons
- `components/reports/ReportDialog.tsx` — modal với reason textarea
- `components/reports/ReportButton.tsx` — flag icon + dialog trigger
- `lib/actions/user-admin.actions.ts` — suspendUser, unsuspendUser, promoteToAdmin, deleteUser
- `lib/actions/report.actions.ts` — reportContent, resolveReport, dismissReport
- `lib/validations/report.ts` — reportSchema
- `lib/queries/analytics.queries.ts` — getRevenueTotal, getUserGrowth, getTopCourses, getTopInstructors, getActiveUserCount
- `prisma/migrations/<ts>_admin_enhancements/migration.sql`

## Requirements
1. New `Report` table + 2 enums.
2. New admin pages: `/admin/users`, `/admin/transactions`, `/admin/analytics`, `/admin/reports`.
3. Report buttons: course detail page, review item.
4. Actions: suspendUser, unsuspendUser, promoteToAdmin, deleteUser, reportContent, resolveReport, dismissReport.
5. Analytics: total revenue, top 5 courses (by enrollment), top 5 instructors (by earnings), user growth (last 30 days), total active users.
6. Suspend/promote → fire notification to affected user.
7. Sidebar badge: pending reports count.
8. `/admin` redirect → `/admin/analytics`.

## Architecture

**User deletion cascade:** All FKs cascade except Course.instructorId (SET NULL). Document: deleted instructor's courses survive với null instructorId — admin can reassign.

**Report polymorphic:**
```
ReportTargetType: COURSE | USER | REVIEW
targetId: string (no FK enforcement)
Resolver fetches entity by type for preview (try/catch, "[Đã xóa]" if not found).
```

**Analytics queries:**
```
revenue: SELECT SUM(amount) FROM Transaction WHERE type = 'PURCHASE' AND status = 'COMPLETED'
user growth: SQL groupBy strftime('%Y-%m-%d', createdAt), count → array { date, count }
top courses: enrollment count desc limit 5
top instructors: sum Transaction.amount WHERE type=EARNING groupBy userId desc limit 5
active users: count distinct user with LessonProgress in last 30 days
```

**Report flow:**
```
Student click flag → ReportDialog (reason textarea) → action reportContent
  → requireAuth + assert not self + create Report PENDING
  → revalidatePath(/admin/reports) + toast "Đã gửi báo cáo"
```

## Related code files

**Create:**
- `app/(admin)/admin/users/page.tsx`
- `app/(admin)/admin/transactions/page.tsx`
- `app/(admin)/admin/analytics/page.tsx`
- `app/(admin)/admin/reports/page.tsx`
- `components/admin/UserActionsMenu.tsx`
- `components/admin/UserFilters.tsx`
- `components/admin/TransactionFilters.tsx`
- `components/admin/AnalyticsCards.tsx`
- `components/admin/TopCoursesList.tsx`
- `components/admin/TopInstructorsList.tsx`
- `components/admin/UserGrowthChart.tsx`
- `components/admin/ReportCard.tsx`
- `components/reports/ReportDialog.tsx`
- `components/reports/ReportButton.tsx`
- `lib/actions/user-admin.actions.ts`
- `lib/actions/report.actions.ts`
- `lib/validations/report.ts`
- `lib/queries/analytics.queries.ts`
- `prisma/migrations/<ts>_admin_enhancements/migration.sql`

**Modify:**
- `prisma/schema.prisma`
- `app/(admin)/admin/page.tsx`
- `app/(admin)/layout.tsx`
- `app/(public)/courses/[slug]/page.tsx`
- `components/reviews/ReviewItem.tsx`
- `prisma/seed.ts` (optional suspended demo user)

## Implementation Steps
1. Update schema: Report model + 2 enums + User reverse relations.
2. Migration `pnpm prisma migrate dev --name admin_enhancements`.
3. Build `lib/queries/analytics.queries.ts` (5 funcs).
4. Build `lib/actions/user-admin.actions.ts` (4 actions với strict admin guard + self-check).
5. Build `lib/actions/report.actions.ts` (3 actions).
6. Build `lib/validations/report.ts` (`reportSchema = { targetType, targetId: cuid, reason: string(min 10, max 500) }`).
7. Build `/admin/users` page + UserFilters + UserActionsMenu.
8. Build `/admin/transactions` page + TransactionFilters.
9. Build `/admin/analytics` page với 4 KPI cards + UserGrowthChart (CSS bars) + TopCoursesList + TopInstructorsList.
10. Build `/admin/reports` page + ReportCard (preview fetches target by type; "[Đã xóa]" fallback).
11. Build ReportButton + ReportDialog reusable.
12. Wire ReportButton into course detail page (logged-in + not own course).
13. Wire ReportButton (flag icon) into ReviewItem.
14. Update admin sidebar với new links + pending reports badge (count via query).
15. Redirect `/admin` → `/admin/analytics` (`redirect("/admin/analytics")` in page.tsx).
16. End-to-end test: report review → admin queue → resolve. Suspend user → can't login. Promote student → student becomes admin. Delete user → cascade verified in studio.

## Todo list
- [ ] Step 1: schema Report + enums + relations
- [ ] Step 2: migrate
- [ ] Step 3: analytics queries (5 funcs)
- [ ] Step 4: user-admin.actions.ts (4 actions)
- [ ] Step 5: report.actions.ts (3 actions)
- [ ] Step 6: reportSchema
- [ ] Step 7: /admin/users page
- [ ] Step 8: /admin/transactions page
- [ ] Step 9: /admin/analytics page + components
- [ ] Step 10: /admin/reports page
- [ ] Step 11: ReportButton + ReportDialog
- [ ] Step 12: wire into course detail
- [ ] Step 13: wire into ReviewItem
- [ ] Step 14: sidebar links + badge
- [ ] Step 15: redirect /admin
- [ ] Step 16: end-to-end test

## Success Criteria
- Suspended user attempting login → friendly error "Tài khoản đã bị tạm khóa".
- Admin promote student → role updated, can access `/admin` after re-login.
- Delete user → cascades verified (enrollments, reviews, wallet, transactions, notifications removed; courses keep null instructorId).
- Self-suspend / self-delete blocked.
- Report course → row PENDING → admin sees in queue → resolve → status RESOLVED + resolvedAt + resolvedBy.
- Analytics renders revenue total, top 5 courses, top 5 instructors, user growth bars (30d).
- Sidebar badge shows pending reports count, decrements on resolve/dismiss.
- Transactions page filters work (type, date range, user search).
- Suspend/promote → notification dispatched to affected user.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Admin accidental self-delete | Med | Critical | Action check `id !== session.user.id`; confirm dialog typed-email match |
| Promote abuse | Low | High | Audit via Notification log + 2-step confirm dialog |
| Delete user orphans courses | Med | Med | Phase 07 SET NULL: courses persist with null instructorId; admin can reassign manually |
| Analytics slow on large data | Low | Med | Index on Transaction.type + Enrollment.courseId; 30d window |
| Report spam | Med | Low | Server throttle: max 10 reports/user/day (check createdAt aggregate) |
| Polymorphic targetId orphan after entity delete | Med | Low | Resolve query: try/catch → "[Đã xóa]" placeholder |
| Suspended admin keeps old JWT | Med | High | Suspend takes effect on next login or JWT expiry (1h default). Document |

## Security Considerations
- Suspend/delete/promote actions: strict `requireAdmin()` guard.
- Self-action blocks: `id !== session.user.id` check trong suspend, delete, promote.
- Audit trail: Notification rows on suspend/promote so user understands.
- Delete user destructive — typed-email confirm dialog client-side + server check.
- Report reason plain text render (React escape).
- Report self-targeting blocked: server check `reporterId !== targetId` for USER; `course.instructorId !== reporterId` for COURSE; `review.userId !== reporterId` for REVIEW.
- Analytics restricted by `requireAdmin()` page-level guard.
- Transaction list không expose `metadata` raw to non-admin.
- Document JWT expiry timing in admin docs.

## Next steps
→ [Phase 12 — Deploy + Demo](./phase-12-deploy-demo.md)

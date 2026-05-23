# Phase 07 — Marketplace Foundation (MERGED)

## Context links
- Parent: [plan.md](./plan.md)
- Prev: [Phase 05](./phase-05-student-dashboard-polish.md) (Phase 06 deferred to Phase 12)
- Brainstorm: [BRAINSTORM_DECISIONS.md](./BRAINSTORM_DECISIONS.md)
- Refs: [reports/09-extended-schema.md](./reports/09-extended-schema.md), [reports/10-extended-server-actions.md](./reports/10-extended-server-actions.md), [reports/12-marketplace-flows.md](./reports/12-marketplace-flows.md)
- Dependencies: Phase 01-05 done (existing Auth, Course CRUD, Public catalog, Learning UX, Dashboard).

## Overview
- **Date:** 2026-05-23
- **Description:** Foundation merge cho toàn bộ marketplace. Gộp Phase 07 (multi-instructor) + Phase 08 (wallet) + Phase 09 (course approval) thành 1 phase MIGRATION atomic. Lý do: 3 phase này cùng touch `Course` + `User` + add 4 bảng mới, làm rời rạc dễ data corruption. Phase này = 1 migration tổng (`marketplace_foundation`) + refactor existing code Phase 01-05 + build flows mới (wallet purchase, instructor application, course approval, notification).
- **Priority:** Critical (blocker cho Phase 08-11 marketplace features)
- **Implementation status:** Not Started
- **Review status:** Not Reviewed

## Key Insights
- 3 phase cũ touch cùng `User` + `Course` table → 1 migration tránh SQLite ALTER TABLE limitation + boolean→enum conversion data loss.
- `Course.published Boolean` → `Course.status CourseStatus` cần hand-edited SQL (ADD column → UPDATE from published → DROP published) vì Prisma generate có thể drop data.
- `Course.instructorId` nullable lúc add → backfill assign admin → set NOT NULL post-backfill. Đồ án OK reset DB + reseed, không cần preserve user data.
- Wallet purchase = atomic transaction (`db.$transaction([...])`): SELECT balance → ASSERT >= price → UPDATE balance → INSERT Transaction (PURCHASE) → INSERT Enrollment → INSERT Transaction (EARNING for instructor) → UPDATE instructor wallet.
- Welcome bonus 500,000đ tạo cho mọi student trong seed → đủ mua ~3-5 khóa demo, tránh user phải top-up mỗi lần test.
- Instructor route group `(instructor)/` mirror `(admin)/` pattern. Layout guard `requireInstructor()` trong `lib/auth-helpers.ts`.
- Existing `MockPaymentScreen.tsx` (Phase 03) refactor thành `WalletPurchaseDialog` — UX y chang (countdown 2s) nhưng deduct wallet thật.
- Notification bell = polling-free, server-rendered count + dropdown via shadcn Popover. Mark-as-read on click.
- Phase 06 (Deploy) ĐÃ DEFER → mọi smoke test trong Phase 07 chạy local.

## Pre-requisites & Existing Code Refactor

### Schema migration scope
1 migration tên `marketplace_foundation` chứa:

**Enum thay đổi:**
- `Role`: thêm `INSTRUCTOR` (`STUDENT | INSTRUCTOR | ADMIN`)
- `CourseStatus` (NEW): `DRAFT | PENDING | APPROVED | REJECTED`
- `TransactionType` (NEW): `TOPUP | PURCHASE | EARNING | REFUND`
- `TransactionStatus` (NEW): `PENDING | COMPLETED | FAILED`
- `NotificationType` (NEW): `INSTRUCTOR_APPROVED | INSTRUCTOR_REJECTED | COURSE_APPROVED | COURSE_REJECTED | PURCHASE_SUCCESS | NEW_ENROLLMENT`
- `ApplicationStatus` (NEW): `PENDING | APPROVED | REJECTED`

**User table:**
- Thêm `suspended Boolean @default(false)`
- Thêm relations: `wallet`, `applications`, `transactions`, `notifications`, `coursesAuthored`

**Course table:**
- Thêm `instructorId String?` FK to User (nullable lúc add, NOT NULL sau backfill, `onDelete: SetNull`)
- DROP `published Boolean` → ADD `status CourseStatus @default(DRAFT)` (hand-edit SQL: ADD `status` → `UPDATE Course SET status='APPROVED' WHERE published=1, 'DRAFT' WHERE published=0` → DROP `published`)
- Thêm `rejectionReason String?`, `reviewedAt DateTime?`, `reviewedBy String?`
- Index: `@@index([status, createdAt])`

**Bảng mới:**
- `InstructorApplication` (id, userId, bio, expertise, motivation, status, createdAt, reviewedAt?, reviewedBy?, rejectionReason?) — unique partial: 1 PENDING per user (Prisma không support partial unique trên SQLite, enforce via server action check)
- `Wallet` (id, userId UNIQUE, balance Int @default(0), createdAt, updatedAt)
- `Transaction` (id, walletId, userId, type TransactionType, status TransactionStatus, amount Int, courseId?, metadata Json?, createdAt) — index (walletId, createdAt), (userId, type)
- `Notification` (id, userId, type, title, message, link?, read Boolean @default(false), createdAt) — index (userId, read, createdAt)

### Backfill data (rewrite seed script)
- Seed user TRƯỚC: 1 admin + 1 instructor demo + 2 students.
- Assign ALL existing courses `instructorId = adminUser.id` (vì chỉ admin có Phase 01-05).
- Map `published=true` → `status=APPROVED`, `published=false` → `status=DRAFT`.
- Auto-create `Wallet` cho mọi user (`balance: 0` for admin/instructor; `balance: WELCOME_BONUS` for students).
- Tạo `Transaction` (type=TOPUP, status=COMPLETED, amount=500000, metadata={ reason: "welcome_bonus" }) cho mỗi student.

### Files MUST refactor (existing)
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Full rewrite — add enums, relations, 4 new tables, modify User+Course |
| `prisma/seed.ts` + `prisma/seed-data.ts` | Refactor: create users → wallets → welcome bonus → assign instructorId on courses → status enum |
| `types/next-auth.d.ts` | `Role: "STUDENT" \| "ADMIN"` → `"STUDENT" \| "INSTRUCTOR" \| "ADMIN"` |
| `auth.config.ts` | `authorized` callback: thêm `/instructor/*` (INSTRUCTOR\|ADMIN), `/wallet` (any auth), block suspended in middleware-level check |
| `auth.ts` | `authorize` callback: throw error nếu `user.suspended === true` sau khi verify password |
| `lib/auth-helpers.ts` (NEW or extend) | Thêm `requireInstructor()` helper |
| `lib/queries/course.queries.ts` | `where: { published: true }` → `where: { status: "APPROVED" }` (3-4 functions: getPublishedCourses, getCourseBySlug, getCourseDetail) |
| `lib/queries/dashboard.queries.ts` | `getEnrolledCourses`: filter `course.status === "APPROVED"` (or include any status nếu student đã enroll trước approval revoked) |
| `lib/queries/learn.queries.ts` | Same — filter approved courses |
| `lib/actions/course.actions.ts` | `createCourse`: inject `instructorId` from session (STUDENT/INSTRUCTOR session.user.id; ADMIN có thể chọn). `updateCourse`+`deleteCourse`: scope `where: { instructorId: session.user.id }` if INSTRUCTOR; admin unrestricted |
| `lib/actions/enrollment.actions.ts` | REWRITE: replace free enroll → wallet deduction transaction. Validate balance, deduct, create Transaction (PURCHASE + EARNING), create Enrollment, notification |
| `components/CourseCard.tsx` | Show status badge cho instructor view (PENDING/REJECTED/DRAFT); hide badge for public |
| `components/EnrollButton.tsx` | 5 states: not-logged-in → login CTA; logged + not-enrolled + balance OK → "Mua khóa"; logged + not-enrolled + insufficient → "Nạp tiền" link `/wallet`; enrolled → "Tiếp tục học"; course free → "Đăng ký miễn phí" |
| `components/MockPaymentScreen.tsx` | REWRITE as `WalletPurchaseDialog`: show current balance → "Sau khi mua: X đ" → confirm button → server action |
| `app/(student)/checkout/[courseId]/page.tsx` | Server-side balance check, render WalletPurchaseDialog; redirect `/wallet?topup=needed` if insufficient |
| `app/(admin)/admin/courses/page.tsx` | Show ALL courses (any status) for admin — add status column |
| `app/(admin)/admin/page.tsx` | KHÔNG revamp — defer charts to Phase 11; minor: thêm pending applications + pending courses counters |
| `components/admin/CourseForm.tsx` | Bỏ `published` toggle; replace bằng "Submit for review" button khi status DRAFT (instructor) hoặc "Approve" button (admin) |
| `components/admin/CourseRowActions.tsx` | Toggle publish → "Submit for review" / "Approve" / "Reject" actions based on status |
| `lib/constants.ts` | Thêm `PLATFORM_FEE_PERCENT=30`, `INSTRUCTOR_EARNING_PERCENT=70`, `WELCOME_BONUS=500_000`, `TOPUP_PRESETS=[100000, 200000, 500000, 1_000_000]` |
| `components/layout/SiteHeader.tsx` | Mount `<NotificationBell />` next to avatar |

### Files MUST create (new)

**Wallet feature:**
- `app/(student)/wallet/page.tsx` — Balance card + Top-up button + Transactions table
- `components/wallet/WalletBalance.tsx` — Card hiển thị balance
- `components/wallet/TopupDialog.tsx` — Modal 4 preset amounts + countdown 2s loader
- `components/wallet/TransactionList.tsx` — Table với filter type
- `lib/actions/wallet.actions.ts` — `topupWallet({ amount })`, `getWalletBalance()`
- `lib/queries/wallet.queries.ts` — `getTransactions(userId, filters)`, `getWalletByUserId(userId)`

**Instructor application flow:**
- `app/(public)/become-instructor/page.tsx` — Landing + ApplicationForm
- `components/instructor/ApplicationForm.tsx` — react-hook-form (bio textarea, expertise input, motivation)
- `lib/validations/instructor.ts` — `applicationSchema`, `approveApplicationSchema`, `rejectApplicationSchema`
- `lib/actions/instructor.actions.ts` — `applyInstructor`, `approveApplication(id)`, `rejectApplication(id, reason)`
- `app/(admin)/admin/instructor-applications/page.tsx` — Pending queue

**Instructor route group:**
- `app/(instructor)/layout.tsx` — `requireInstructor()` guard + sidebar nav
- `app/(instructor)/instructor/page.tsx` — Revenue dashboard (total earnings, active students, course count)
- `app/(instructor)/instructor/courses/page.tsx` — List own courses with status badges
- `app/(instructor)/instructor/courses/new/page.tsx` — Create course (uses CourseForm, status auto DRAFT)
- `app/(instructor)/instructor/courses/[id]/edit/page.tsx` — Edit (own only) + Submit for review button

**Course approval (admin):**
- `app/(admin)/admin/courses/pending/page.tsx` — PENDING queue
- `components/admin/ApproveRejectButtons.tsx` — Pair of buttons calling actions
- `components/admin/RejectDialog.tsx` — Modal với reason textarea (required, min 5 chars)
- `lib/actions/course-approval.actions.ts` — `submitForReview(courseId)`, `approveCourse(courseId)`, `rejectCourse(courseId, reason)`

**Notification:**
- `lib/actions/notification.actions.ts` — `markRead(id)`, `markAllRead()`, `getUnreadCount()`
- `lib/queries/notification.queries.ts` — `getNotifications(userId, limit=5)`, `countUnread(userId)`
- `components/layout/NotificationBell.tsx` — Server component badge + Popover client

## Requirements
1. `INSTRUCTOR` role tồn tại, middleware guards `/instructor/*` cho `INSTRUCTOR` + `ADMIN`.
2. Single migration `marketplace_foundation` chạy clean trên fresh SQLite + restore seed.
3. Student có wallet 500k welcome bonus sau seed.
4. Top-up flow (mock 2s loader) tăng balance + log Transaction.
5. Wallet purchase atomic: deduct buyer + credit instructor 70% + record 2 Transactions + create Enrollment.
6. Free course (price=0) → enroll without deduction.
7. Insufficient balance → button "Nạp tiền" link `/wallet`.
8. Student `/become-instructor` submit application; admin queue approve/reject; on approve role updates.
9. Instructor route group functional: dashboard + course CRUD scoped own.
10. Course lifecycle: DRAFT → submit → PENDING → admin approve/reject → APPROVED/REJECTED. Only APPROVED visible public.
11. Notifications dispatched on: application approve/reject, course approve/reject, purchase success (buyer + instructor).
12. Suspended user cannot login (auth.ts authorize check).
13. Existing Phase 01-05 flows STILL WORK (smoke test).
14. NotificationBell shows unread count + dropdown list.

## Architecture

**Route groups (post-Phase 07):**
```
app/
├── (auth)/login, /register
├── (public)/, /courses, /courses/[slug], /become-instructor
├── (student)/dashboard, /wallet, /checkout/[courseId], /learn/[slug]/[lessonId]
├── (instructor)/instructor, /instructor/courses, /instructor/courses/new, /instructor/courses/[id]/edit
└── (admin)/admin, /admin/courses, /admin/courses/pending, /admin/instructor-applications
```

**Wallet purchase transaction (pseudo):**
```ts
db.$transaction(async (tx) => {
  const wallet = await tx.wallet.findUnique({ where: { userId }, include: { user: true } });
  if (!wallet || wallet.balance < course.price) throw new Error("INSUFFICIENT_BALANCE");
  await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: course.price } } });
  await tx.transaction.create({ data: { walletId: wallet.id, userId, type: "PURCHASE", status: "COMPLETED", amount: -course.price, courseId } });
  await tx.enrollment.create({ data: { userId, courseId } });
  if (course.instructorId) {
    const earnings = Math.floor(course.price * INSTRUCTOR_EARNING_PERCENT / 100);
    const insWallet = await tx.wallet.findUnique({ where: { userId: course.instructorId } });
    await tx.wallet.update({ where: { id: insWallet.id }, data: { balance: { increment: earnings } } });
    await tx.transaction.create({ data: { walletId: insWallet.id, userId: course.instructorId, type: "EARNING", status: "COMPLETED", amount: earnings, courseId } });
    await tx.notification.create({ data: { userId: course.instructorId, type: "NEW_ENROLLMENT", title: "Học viên mới", message: `...`, link: `/instructor/courses/${courseId}` } });
  }
  await tx.notification.create({ data: { userId, type: "PURCHASE_SUCCESS", ... } });
});
```

**Course lifecycle FSM:**
```
DRAFT → submitForReview() → PENDING
PENDING → approveCourse() → APPROVED (+ notify instructor)
PENDING → rejectCourse(reason) → REJECTED (+ notify instructor with reason)
REJECTED → submitForReview() (after edit) → PENDING
APPROVED → admin can soft-revoke → REJECTED (out of scope, manual)
```

## Related code files

**Create (new):**
- `app/(student)/wallet/page.tsx`
- `app/(public)/become-instructor/page.tsx`
- `app/(admin)/admin/instructor-applications/page.tsx`
- `app/(admin)/admin/courses/pending/page.tsx`
- `app/(instructor)/layout.tsx`
- `app/(instructor)/instructor/page.tsx`
- `app/(instructor)/instructor/courses/page.tsx`
- `app/(instructor)/instructor/courses/new/page.tsx`
- `app/(instructor)/instructor/courses/[id]/edit/page.tsx`
- `components/wallet/WalletBalance.tsx`
- `components/wallet/TopupDialog.tsx`
- `components/wallet/TransactionList.tsx`
- `components/instructor/ApplicationForm.tsx`
- `components/admin/ApproveRejectButtons.tsx`
- `components/admin/RejectDialog.tsx`
- `components/layout/NotificationBell.tsx`
- `lib/actions/wallet.actions.ts`
- `lib/actions/instructor.actions.ts`
- `lib/actions/course-approval.actions.ts`
- `lib/actions/notification.actions.ts`
- `lib/queries/wallet.queries.ts`
- `lib/queries/notification.queries.ts`
- `lib/validations/instructor.ts`
- `lib/auth-helpers.ts` (or extend existing)
- `prisma/migrations/<ts>_marketplace_foundation/migration.sql`

**Modify (existing):**
- `prisma/schema.prisma`
- `prisma/seed.ts`, `prisma/seed-data.ts`
- `types/next-auth.d.ts`
- `auth.config.ts`, `auth.ts`
- `lib/constants.ts`
- `lib/queries/course.queries.ts`, `lib/queries/dashboard.queries.ts`, `lib/queries/learn.queries.ts`
- `lib/actions/course.actions.ts`, `lib/actions/enrollment.actions.ts`
- `components/CourseCard.tsx`, `components/EnrollButton.tsx`, `components/MockPaymentScreen.tsx`
- `app/(student)/checkout/[courseId]/page.tsx`
- `app/(admin)/admin/courses/page.tsx`, `app/(admin)/admin/page.tsx`
- `components/admin/CourseForm.tsx`, `components/admin/CourseRowActions.tsx`
- `components/layout/SiteHeader.tsx`

## Implementation Steps

1. **Backup local DB** + branch `feature/marketplace-foundation`. Rule: nếu break, reset DB + reseed (đồ án, không có data người dùng thật).
2. **Rewrite `prisma/schema.prisma`** — full file: add enums (Role/CourseStatus/TransactionType/etc.), modify User+Course, add InstructorApplication+Wallet+Transaction+Notification. Reference report 09.
3. **Generate migration** `--create-only`: `pnpm prisma migrate dev --name marketplace_foundation --create-only`.
4. **Hand-edit `migration.sql`** cho boolean→enum conversion:
   - ADD `status TEXT NOT NULL DEFAULT 'DRAFT'` to Course
   - `UPDATE "Course" SET status = CASE WHEN published = 1 THEN 'APPROVED' ELSE 'DRAFT' END`
   - DROP `published` column (SQLite: requires table rebuild, Prisma usually handles; verify SQL output)
   - Same care cho `instructorId`: ADD nullable → backfill in seed → app code enforce NOT NULL via validation
5. **Run migration** `pnpm prisma migrate dev` → applies + regenerates client.
6. **Rewrite `prisma/seed.ts`** + `prisma/seed-data.ts`:
   - Create users: admin (ADMIN), instructor demo (INSTRUCTOR), 2 students (STUDENT).
   - Create wallets for all (admin/instructor balance=0, students balance=`WELCOME_BONUS`).
   - Insert welcome bonus Transaction for each student.
   - Create courses assigned to admin OR instructor, with proper status (mostly APPROVED for demo).
7. **Run seed** `pnpm db:seed` → smoke check via `prisma studio`.
8. **Update `types/next-auth.d.ts`** — add INSTRUCTOR to Role union.
9. **Update `auth.ts`** authorize callback — check `user.suspended` post password match, throw "Tài khoản đã bị tạm khóa".
10. **Update `auth.config.ts`** — middleware `authorized` callback: redirect non-instructor away from `/instructor/*`, redirect unauthed away from `/wallet`.
11. **Create `lib/auth-helpers.ts`** (or extend) — `requireInstructor()`, `requireAdmin()`, `requireAuth()` helpers used in layouts + actions.
12. **Update `lib/constants.ts`** — add `WELCOME_BONUS`, `PLATFORM_FEE_PERCENT`, `INSTRUCTOR_EARNING_PERCENT`, `TOPUP_PRESETS`.
13. **Refactor course queries** (3 files): `published: true` → `status: "APPROVED"`. Verify catalog still renders.
14. **Refactor `lib/actions/course.actions.ts`** — inject instructorId from session; admin can override; scope updates/deletes by instructor ownership.
15. **Refactor `lib/actions/enrollment.actions.ts`** — replace free enroll with wallet deduction `$transaction`. Handle free courses (price=0) separately (no deduction, just enroll).
16. **Build wallet feature**:
    - `lib/queries/wallet.queries.ts` + `lib/actions/wallet.actions.ts` (topup creates Transaction TOPUP/COMPLETED + increments balance).
    - `app/(student)/wallet/page.tsx` rendering WalletBalance + TransactionList.
    - `TopupDialog.tsx` mounted on page với 4 preset buttons → 2s countdown → action.
17. **Refactor `MockPaymentScreen.tsx`** → `WalletPurchaseDialog.tsx`: show balance, show course price, "Sau khi mua: X đ", confirm button calls enroll action.
18. **Update `EnrollButton.tsx`** — 5 state logic (not-logged-in, free, owned, sufficient, insufficient).
19. **Update `checkout/[courseId]/page.tsx`** — fetch wallet balance server-side; if < price → render insufficient state with link `/wallet`.
20. **Build instructor application flow**:
    - `lib/validations/instructor.ts` zod.
    - `lib/actions/instructor.actions.ts` — apply (block if INSTRUCTOR already / PENDING exists), approve (update user.role + notification), reject (notification with reason).
    - `app/(public)/become-instructor/page.tsx` + `components/instructor/ApplicationForm.tsx`.
    - `app/(admin)/admin/instructor-applications/page.tsx` queue list + ApproveRejectButtons + RejectDialog.
21. **Build instructor route group**:
    - `app/(instructor)/layout.tsx` guard + sidebar.
    - `app/(instructor)/instructor/page.tsx` — sum EARNING transactions for revenue, count enrollments on own courses.
    - `app/(instructor)/instructor/courses/page.tsx` — list own with status badges.
    - `new/page.tsx` + `[id]/edit/page.tsx` — reuse `CourseForm` with `instructorId` injected.
22. **Refactor admin courses page** — show all statuses, add status column. Update `CourseForm.tsx` + `CourseRowActions.tsx` to remove publish toggle, replace with submit/approve/reject flows.
23. **Build course approval flow**:
    - `lib/actions/course-approval.actions.ts` — submit (DRAFT→PENDING, only own), approve (PENDING→APPROVED, admin only, notification to instructor), reject (PENDING→REJECTED with reason, notification).
    - `app/(admin)/admin/courses/pending/page.tsx` — pending queue.
    - `components/admin/ApproveRejectButtons.tsx` + `RejectDialog.tsx`.
24. **Build notification system**:
    - `lib/queries/notification.queries.ts` + `lib/actions/notification.actions.ts`.
    - `components/layout/NotificationBell.tsx` — server component fetches unread count + 5 newest, client Popover for dropdown, mark-read on item click.
    - Mount in `SiteHeader.tsx`.
25. **Smoke test full flow**:
    - Anonymous: `/`, `/courses`, `/courses/[slug]` ok (only APPROVED visible).
    - Student login → wallet shows 500k → buy course 100k → balance 400k + Transactions logged + Enrollment created → instructor wallet +70k.
    - Free course → enroll without deduction.
    - Insufficient: try buy course > balance → button shows "Nạp tiền".
    - Top-up 200k → balance updated + Transaction TOPUP row.
    - Student → /become-instructor → submit → admin sees in queue → approve → student role updated → can access /instructor.
    - Instructor → create course → DRAFT → submit → PENDING → admin sees pending → approve → APPROVED → appears in public catalog → instructor notification arrives in bell dropdown.
    - Reject flow with reason → REJECTED + reason saved + instructor notification.
    - Test suspended user: manually set `suspended=true` in DB → login fails with friendly error.
    - Verify Phase 01-05 flows: register → login → catalog → lesson viewer → quiz → dashboard still all working.
26. **Typecheck** `pnpm typecheck` + lint clean.

## Todo list
- [ ] Step 1: branch + backup DB
- [ ] Step 2: rewrite prisma/schema.prisma
- [ ] Step 3: generate migration --create-only
- [ ] Step 4: hand-edit migration.sql for boolean→enum
- [ ] Step 5: run migration
- [ ] Step 6: rewrite seed.ts + seed-data.ts
- [ ] Step 7: run seed + verify in Prisma Studio
- [ ] Step 8: update types/next-auth.d.ts
- [ ] Step 9: update auth.ts (suspended check)
- [ ] Step 10: update auth.config.ts middleware
- [ ] Step 11: create lib/auth-helpers.ts
- [ ] Step 12: update lib/constants.ts
- [ ] Step 13: refactor course queries (3 files)
- [ ] Step 14: refactor course.actions.ts
- [ ] Step 15: refactor enrollment.actions.ts (wallet $transaction)
- [ ] Step 16: build wallet feature (queries/actions/page/dialog/list)
- [ ] Step 17: refactor MockPaymentScreen → WalletPurchaseDialog
- [ ] Step 18: update EnrollButton (5 states)
- [ ] Step 19: update checkout page (balance check)
- [ ] Step 20: build instructor application flow
- [ ] Step 21: build instructor route group + pages
- [ ] Step 22: refactor admin courses page + CourseForm + RowActions
- [ ] Step 23: build course approval flow
- [ ] Step 24: build notification system + NotificationBell
- [ ] Step 25: smoke test full marketplace + Phase 01-05 regression
- [ ] Step 26: typecheck + lint

## Success Criteria
- Student có wallet balance 500,000đ sau `pnpm db:seed` (welcome bonus).
- Top-up 200k → balance 700k, Transaction TOPUP/COMPLETED row tạo.
- Mua khóa giá 0đ → Enrollment tạo, balance unchanged, không có Transaction PURCHASE.
- Mua khóa giá 100k → balance giảm 100k, Transaction PURCHASE/-100k row, instructor wallet +70k, Transaction EARNING/+70k cho instructor, notification "Đăng ký thành công" cho student, notification "Học viên mới" cho instructor.
- Insufficient: course 600k khi balance 500k → EnrollButton hiện "Nạp tiền" link `/wallet`.
- Student → `/become-instructor` → submit form → admin queue có application → admin approve → user.role = INSTRUCTOR + notification gửi student.
- Instructor login → middleware allow `/instructor/*`, redirect student trying access.
- Instructor create course → status auto DRAFT.
- Instructor submit for review → status PENDING, KHÔNG hiển thị public catalog.
- Admin `/admin/courses/pending` → list PENDING course → approve → status APPROVED + notification gửi instructor + course xuất hiện public.
- Admin reject với reason → status REJECTED + rejectionReason saved + notification chứa reason.
- Public `/courses` chỉ show courses có `status=APPROVED`.
- NotificationBell badge hiện unread count chính xác; dropdown list 5 mới nhất; click item → mark read + navigate link.
- User `suspended=true` → login fail với message "Tài khoản đã bị tạm khóa".
- Existing Phase 01-05 flows PASS: register, login, catalog browse, course detail, enroll (now wallet-based), lesson viewer, quiz attempt, dashboard.
- `pnpm typecheck` 0 errors, `pnpm lint` 0 warnings.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| SQLite boolean → enum migration data loss | High | Critical | Hand-edit SQL: ADD `status` → `UPDATE` from `published` → DROP `published`. Test trên DB copy trước. Đồ án OK reset+reseed nếu fail |
| Wallet purchase race condition | Med | High | `db.$transaction([...])` cho atomic op; validate balance trong transaction; Prisma SQLite single-writer giảm risk |
| Backfill order phụ thuộc admin user tồn tại | Med | Med | Seed: create users TRƯỚC khi assign instructorId on courses |
| Refactored checkout breaks Phase 03 flow | Med | High | Smoke test toàn bộ flow Phase 01-05 sau migration TRƯỚC khi merge branch |
| Phase 07 quá to dễ bug | High | High | Implement từng step + test ngay; commit increment; checkpoint sau step 16 (wallet works) trước khi step 20+ |
| Notification spam khi mass approve | Low | Low | Skip cho demo; acceptable |
| Suspended user JWT still valid | Med | Med | Document: suspend takes effect on next login or JWT expiry (1h default). Acceptable cho đồ án |
| Free course logic forgot in refactor | Med | Med | Explicit early return `if (course.price === 0)` trong enrollCourse action |
| Instructor self-purchase own course | Low | Low | Action check `course.instructorId !== session.user.id` |
| Migration runs on prod but breaks | N/A | N/A | Phase 06 deferred — không có prod yet |

## Security Considerations
- Wallet operations BẮT BUỘC `db.$transaction([...])` cho atomicity (deduct + record + enroll must succeed together).
- Server-side balance check TRƯỚC khi deduct: fetch wallet `for update` semantics via transaction read.
- Validate `course.price` từ DB, KHÔNG trust client payload (price from URL/body ignored, fetch fresh).
- Instructor scope: action update/delete check `course.instructorId === session.user.id` OR `session.user.role === "ADMIN"`.
- Admin bypass: `role === "ADMIN"` skip ownership checks.
- Rejection reason zod validate `min(5).max(500)` (avoid empty rejection).
- Notification table: queries WHERE `userId = session.user.id` only — user chỉ xem được noti của mình.
- Instructor application: 1 user 1 PENDING — server check (`existsPending = await db.instructorApplication.findFirst({ where: { userId, status: "PENDING" } })`) → throw nếu exists.
- Welcome bonus chỉ tạo trong seed, KHÔNG có action exposed cho user (no re-claim).
- Top-up max amount 10,000,000đ zod validation (anti-abuse).
- Suspended user: `authorize` reject login; existing JWT vẫn valid until expiry (documented).
- `next-auth.d.ts` Role union update + ensure middleware reads `token.role` not `session.user.role` in edge runtime.

## Next steps
→ [Phase 08 — Reviews & Ratings](./phase-08-reviews-ratings.md)

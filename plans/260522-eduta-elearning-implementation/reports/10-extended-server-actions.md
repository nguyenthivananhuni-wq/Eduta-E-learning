# Report 10 — Extended Server Actions Catalog (Phase 07-11)

> **NOTE (2026-05-23):** Phase structure restructured. Old Phase 07+08+09 merged → **Phase 07 Marketplace Foundation**. Old Phase 10+11+12+13 renumbered → **Phase 08+09+10+11**. See [BRAINSTORM_DECISIONS.md](../BRAINSTORM_DECISIONS.md).
>
> **Action → new phase mapping (consume sections via this):**
> - Sections "Phase 07 — Multi-Instructor" + "Phase 08 — Wallet System" + "Phase 09 — Course Approval" → all belong to **Phase 07 Marketplace Foundation** (merged).
> - Section "Phase 10 — Reviews & Ratings" → **Phase 08 Reviews & Ratings**.
> - Section "Phase 11 — AI Recommendation" → **Phase 09 AI Recommendation**.
> - Section "Phase 12 — File Attachments" → **Phase 10 File Attachments**.
> - Section "Phase 13 — Admin Enhancements" → **Phase 11 Admin Enhancements**.
>
> Old heading numbers below preserved for historical context; section content still valid.

All new Server Actions introduced by marketplace expansion. Same conventions as Report 04: `"use server"`, auth check, zod validate, mutate, revalidatePath, return `{ ok, ... }`.

---

## Phase 07 — Multi-Instructor

### `lib/actions/instructor.actions.ts`

#### `applyInstructor`
```ts
async function applyInstructor(input: { bio: string; expertise: string }): Promise<
  | { ok: true; applicationId: string }
  | { ok: false; error: string }
>
```
- **Auth:** requireAuth (any logged-in user except existing INSTRUCTOR/ADMIN)
- **Validation:** `applicationSchema = { bio: z.string().min(50).max(500), expertise: z.string().min(3).max(200) }`
- **Side effects:** check no existing PENDING for this user → create row
- **Revalidate:** `/become-instructor`

#### `approveInstructorApplication`
```ts
async function approveInstructorApplication(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Side effects:** $transaction(update application status APPROVED + reviewedAt/By; update User.role = INSTRUCTOR; create Notification)
- **Revalidate:** `/admin/instructor-applications`

#### `rejectInstructorApplication`
```ts
async function rejectInstructorApplication(id: string, reason: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Validation:** `reason: z.string().min(10).max(300)`
- **Side effects:** update status REJECTED + reason; create Notification
- **Revalidate:** `/admin/instructor-applications`

---

## Phase 08 — Wallet System

### `lib/actions/wallet.actions.ts`

#### `topupWallet`
```ts
async function topupWallet(amount: number): Promise<
  | { ok: true; newBalance: number }
  | { ok: false; error: string }
>
```
- **Auth:** requireAuth
- **Validation:** `amount IN TOPUP_PRESETS` (100k/200k/500k/1M)
- **Side effects:** $transaction(wallet increment + Transaction TOPUP COMPLETED row)
- **Revalidate:** `/wallet`, `/dashboard`

#### `getWalletBalance`
```ts
async function getWalletBalance(): Promise<{ ok: true; balance: number } | { ok: false; error: string }>
```
- **Auth:** requireAuth
- **Side effects:** none (read-only)

#### `getTransactions`
```ts
async function getTransactions(filters: { type?: TransactionType; limit?: number; offset?: number }): Promise<
  | { ok: true; items: Transaction[]; total: number }
  | { ok: false; error: string }
>
```
- **Auth:** requireAuth (scoped to self) — admin variant in Phase 13
- **Side effects:** none

### `lib/actions/purchase.actions.ts`

#### `purchaseCourseFromWallet`
```ts
async function purchaseCourseFromWallet(courseId: string): Promise<
  | { ok: true; slug: string; firstLessonId: string }
  | { ok: false; error: "INSUFFICIENT" | "ALREADY_ENROLLED" | "NOT_FOUND" | string; needed?: number }
>
```
- **Auth:** requireAuth
- **Validation:** `courseId: z.string().cuid()`
- **Side effects:** $transaction(wallet decrement student + create Enrollment + PURCHASE Tx + EARNING Tx instructor + wallet increment instructor)
- **Special:** if price === 0 → skip wallet, just enroll
- **Revalidate:** `/dashboard`, `/wallet`, `/courses/[slug]`

---

## Phase 09 — Course Approval

### `lib/actions/approval.actions.ts`

#### `submitCourseForReview`
```ts
async function submitCourseForReview(courseId: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireInstructor + ownership of course
- **Validation:** course.status IN (DRAFT, REJECTED) + course has ≥ 1 lesson
- **Side effects:** update status PENDING
- **Revalidate:** `/instructor/courses/[id]/edit`, `/admin/courses/pending`

#### `approveCourse`
```ts
async function approveCourse(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Validation:** course.status === PENDING
- **Side effects:** $transaction(update course + create Notification "COURSE_APPROVED")
- **Revalidate:** `/admin/courses/pending`, `/courses`, `/instructor/courses`

#### `rejectCourse`
```ts
async function rejectCourse(id: string, reason: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Validation:** `reason: z.string().min(10).max(500)`, course.status === PENDING
- **Side effects:** $transaction(update course REJECTED + rejectionReason + create Notification "COURSE_REJECTED")
- **Revalidate:** `/admin/courses/pending`, `/instructor/courses`

### `lib/actions/notification.actions.ts`

#### `markNotificationRead`
```ts
async function markNotificationRead(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAuth + ownership
- **Side effects:** update read = true
- **Revalidate:** all paths (header bell present everywhere) — use `revalidatePath("/", "layout")`

#### `markAllNotificationsRead`
```ts
async function markAllNotificationsRead(): Promise<{ ok: true; count: number } | { ok: false; error: string }>
```
- **Auth:** requireAuth
- **Side effects:** updateMany for current user where read=false

#### `getNotifications`
```ts
async function getNotifications(limit?: number): Promise<{ ok: true; items: Notification[] } | { ok: false; error: string }>
```
- **Auth:** requireAuth
- **Side effects:** none (read-only)

---

## Phase 10 — Reviews & Ratings

### `lib/actions/review.actions.ts`

#### `createReview`
```ts
async function createReview(input: { courseId: string; rating: number; comment: string }): Promise<
  | { ok: true; id: string }
  | { ok: false; error: string }
>
```
- **Auth:** requireAuth
- **Validation:** `reviewSchema = { courseId: cuid, rating: int(1..5), comment: string(5..1000) }`
- **Side effects:**
  - assert Enrollment exists (userId, courseId)
  - assert no existing Review (unique constraint backs up)
  - $transaction(create Review + recompute Course.avgRating + Course.reviewCount)
- **Revalidate:** `/courses/[slug]`, `/courses`, `/dashboard`

#### `updateReview`
```ts
async function updateReview(id: string, input: { rating: number; comment: string }): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAuth + ownership
- **Validation:** same as create minus courseId
- **Side effects:** $transaction(update + recompute avg)
- **Revalidate:** course slug + catalog

#### `deleteReview`
```ts
async function deleteReview(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAuth + ownership (OR admin override Phase 13)
- **Side effects:** $transaction(delete + recompute avg)
- **Revalidate:** course slug + catalog

---

## Phase 11 — AI Recommendation

### `lib/actions/recommendation.actions.ts`

#### `getRecommendations`
```ts
async function getRecommendations(): Promise<
  | { ok: true; courses: Course[]; reasoning: string }
  | { ok: false; error: string }
>
```
- **Auth:** requireAuth
- **Side effects:** may write to RecommendationCache (cache miss)
- **Note:** wraps `getPersonalizedRecommendations(session.user.id)` from `lib/ai/recommendations.ts`

#### `refreshRecommendations`
```ts
async function refreshRecommendations(): Promise<
  | { ok: true; courses: Course[]; reasoning: string }
  | { ok: false; error: string }
>
```
- **Auth:** requireAuth
- **Throttle:** max 5 refresh per user per hour (track via cache.generatedAt diff)
- **Side effects:** delete cache row → call get again
- **Revalidate:** `/dashboard`

---

## Phase 12 — File Attachments

### `lib/actions/attachment.actions.ts`

#### `addLessonAttachment`
```ts
async function addLessonAttachment(input: { lessonId: string; name: string; url: string }): Promise<
  | { ok: true; id: string }
  | { ok: false; error: string }
>
```
- **Auth:** requireInstructor + ownership of parent course (OR admin)
- **Validation:** `attachmentSchema = { lessonId: cuid, name: string(2..100), url: string.url().refine(no js:/data: scheme) }`
- **Side effects:** compute order = max+1; create
- **Revalidate:** `/instructor/courses/[id]/edit`, `/learn/[slug]/[id]`

#### `removeLessonAttachment`
```ts
async function removeLessonAttachment(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** ownership of parent course (instructor or admin)
- **Side effects:** Prisma delete
- **Revalidate:** edit + learn page

#### `updateLessonAttachment`
```ts
async function updateLessonAttachment(id: string, input: { name?: string; url?: string }): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** ownership
- **Validation:** partial schema
- **Revalidate:** edit + learn page

---

## Phase 13 — Admin Enhancements

### `lib/actions/user-admin.actions.ts`

#### `suspendUser`
```ts
async function suspendUser(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Validation:** `id !== session.user.id` (no self-suspend)
- **Side effects:** update User.suspended = true + create Notification
- **Revalidate:** `/admin/users`

#### `unsuspendUser`
```ts
async function unsuspendUser(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- Same as above, suspended = false.

#### `promoteToAdmin`
```ts
async function promoteToAdmin(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Validation:** `id !== session.user.id`; target.role !== ADMIN
- **Side effects:** update User.role = ADMIN + Notification
- **Revalidate:** `/admin/users`

#### `deleteUser`
```ts
async function deleteUser(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Validation:** `id !== session.user.id`
- **Side effects:** Prisma delete (cascade)
- **Revalidate:** `/admin/users`, `/admin/analytics`

### `lib/actions/report.actions.ts`

#### `reportContent`
```ts
async function reportContent(input: {
  targetType: "COURSE" | "USER" | "REVIEW";
  targetId: string;
  reason: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }>
```
- **Auth:** requireAuth
- **Validation:** `reportSchema = { targetType: enum, targetId: cuid, reason: string(10..500) }`
- **Throttle:** max 10/user/day
- **Side effects:** verify not self-targeting (for USER + REVIEW); create Report PENDING
- **Revalidate:** `/admin/reports`

#### `resolveReport`
```ts
async function resolveReport(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- **Auth:** requireAdmin
- **Side effects:** update status RESOLVED + resolvedAt + resolvedBy
- **Revalidate:** `/admin/reports`

#### `dismissReport`
```ts
async function dismissReport(id: string): Promise<{ ok: true } | { ok: false; error: string }>
```
- Same as resolve, status = DISMISSED.

---

## Summary

| File                          | New Actions | Auth Level             |
|-------------------------------|-------------|------------------------|
| instructor.actions.ts         | 3           | Mixed (Auth / Admin)   |
| wallet.actions.ts             | 3           | Auth                   |
| purchase.actions.ts           | 1           | Auth                   |
| approval.actions.ts           | 3           | Mixed (Instructor / Admin) |
| notification.actions.ts       | 3           | Auth                   |
| review.actions.ts             | 3           | Auth                   |
| recommendation.actions.ts     | 2           | Auth                   |
| attachment.actions.ts         | 3           | Instructor / Admin     |
| user-admin.actions.ts         | 4           | Admin                  |
| report.actions.ts             | 3           | Mixed                  |
| **NEW TOTAL (Phase 07-13)**   | **28**      |                        |
| Original (Phase 01-06)        | 16          |                        |
| **GRAND TOTAL**               | **44**      |                        |

## Conventions reminder

- `requireInstructor()` helper accepts ADMIN as superset.
- All actions return `{ ok: boolean, error?: string }`.
- All errors in Vietnamese for UX.
- All `$transaction` wraps multi-table mutations.
- Throttle implementation: store last-action timestamp in user row OR in-memory Map keyed by userId (simpler, lost on restart, acceptable for đồ án).

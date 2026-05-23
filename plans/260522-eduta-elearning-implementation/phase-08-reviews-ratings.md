# Phase 08 — Reviews & Ratings

## Context links
- Parent: [plan.md](./plan.md)
- Prev: [Phase 07 — Marketplace Foundation](./phase-07-marketplace-foundation.md)
- Refs: [reports/09-extended-schema.md](./reports/09-extended-schema.md), [reports/10-extended-server-actions.md](./reports/10-extended-server-actions.md), [reports/12-marketplace-flows.md](./reports/12-marketplace-flows.md)
- Dependencies: Phase 07 (Enrollment + Course.status=APPROVED filter + Notification table for instructor feedback).

## Overview
- **Date:** 2026-05-23
- **Description:** Enrolled students rate course 1-5 sao + comment. Show average rating + count trên catalog + detail + instructor dashboard. Sort catalog by rating. Edit/delete own review. Denormalize `avgRating` + `reviewCount` on Course để query catalog rẻ.
- **Priority:** Med (UX polish + tín hiệu cho AI recommendation Phase 09)
- **Implementation status:** Not Started
- **Review status:** Not Reviewed

## Key Insights
- Unique `(userId, courseId)` ensures 1 review per user per course.
- Only require Enrollment exists (không cần complete 100% lesson) → giảm friction demo.
- Denormalized `Course.avgRating Float?` + `Course.reviewCount Int @default(0)` → update on create/update/delete. KISS for sort + filter.
- Recompute helper inside `$transaction` cho consistency.
- Comment plain text only (no markdown) → tránh XSS.
- RatingStars component reusable: read mode (display avg with half-star) + interactive mode (form input).

## Pre-requisites & Existing Code Refactor

### Schema changes
- 1 migration `reviews_ratings`:
  - New `Review` table: `id, userId, courseId, rating Int (1-5), comment, createdAt, updatedAt` + `@@unique([userId, courseId])` + index `(courseId, createdAt desc)`.
  - Add `Course.avgRating Float?`, `Course.reviewCount Int @default(0)`.
- No backfill needed (no existing reviews).

### Files to modify (existing)
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add Review model + Course.avgRating + Course.reviewCount + reverse relations |
| `prisma/seed.ts` | Add 2-3 sample reviews on demo Tiếng Anh 10 course → recompute avg+count |
| `lib/queries/course.queries.ts` | `getPublishedCourses`: select avgRating + reviewCount; support `?sort=rating` (`orderBy: [{ avgRating: "desc" }, { createdAt: "desc" }]`) |
| `app/(public)/courses/page.tsx` | Add sort dropdown (Newest / Rating / Price low / Price high) → URL query sync |
| `app/(public)/courses/[slug]/page.tsx` | Header: title + RatingStars(avg) + "X đánh giá". After Modules: Reviews section with ReviewList + ReviewForm trigger (if enrolled + no existing review) |
| `components/CourseCard.tsx` | Add star row (RatingStars + count) |
| `components/student/EnrolledCourseCard.tsx` | Add star row |
| `app/(student)/dashboard/page.tsx` | New section "Đánh giá khóa học đã học" listing enrolled courses without review |
| `app/(instructor)/instructor/page.tsx` | New "Phản hồi học viên" section showing 10 newest reviews on own courses |

### Files to create (new)
- `components/reviews/RatingStars.tsx` — render filled/empty/half stars from number, size prop, interactive prop
- `components/reviews/ReviewForm.tsx` — shadcn Dialog với rating selector + textarea
- `components/reviews/ReviewList.tsx` — paginated list
- `components/reviews/ReviewItem.tsx` — single review (avatar initial + name + stars + date + comment + dropdown if own)
- `lib/actions/review.actions.ts` — createReview, updateReview, deleteReview
- `lib/validations/review.ts` — `reviewSchema = { courseId: cuid, rating: int(1..5), comment: string(min 5, max 1000) }`
- `lib/queries/review.queries.ts` — getCourseReviews(courseId, page, perPage=10), getInstructorFeedback(instructorId, limit=10), `recomputeCourseRating(courseId, tx)` helper

## Requirements
1. Bảng `Review` + unique `(userId, courseId)`.
2. Server-side guard: must be enrolled to create review.
3. Course detail show avg rating + count + reviews list + create CTA.
4. CourseCard + EnrolledCourseCard show rating.
5. Catalog sort by rating.
6. Instructor `/instructor` Feedback section.
7. Actions: createReview, updateReview, deleteReview với ownership check.
8. Denormalized fields updated via `recomputeCourseRating` inside transaction.

## Architecture

**Recompute helper:**
```ts
async function recomputeCourseRating(courseId: string, tx: PrismaTx) {
  const agg = await tx.review.aggregate({
    where: { courseId },
    _avg: { rating: true },
    _count: { id: true },
  });
  await tx.course.update({
    where: { id: courseId },
    data: { avgRating: agg._avg.rating, reviewCount: agg._count.id },
  });
}
```

**Create review flow:**
```
Student detail page → click "Viết đánh giá" → ReviewForm modal
  → action createReview({ courseId, rating, comment })
  → requireAuth + assert Enrollment exists + assert no existing Review
  → $transaction: create Review + recomputeCourseRating
  → revalidatePath(/courses/[slug], /courses, /dashboard, /instructor)
  → toast "Đã gửi đánh giá"
```

## Related code files

**Create:**
- `components/reviews/RatingStars.tsx`
- `components/reviews/ReviewForm.tsx`
- `components/reviews/ReviewItem.tsx`
- `components/reviews/ReviewList.tsx`
- `lib/actions/review.actions.ts`
- `lib/validations/review.ts`
- `lib/queries/review.queries.ts`
- `prisma/migrations/<ts>_reviews_ratings/migration.sql`

**Modify:**
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `lib/queries/course.queries.ts`
- `app/(public)/courses/page.tsx`
- `app/(public)/courses/[slug]/page.tsx`
- `components/CourseCard.tsx`
- `components/student/EnrolledCourseCard.tsx`
- `app/(student)/dashboard/page.tsx`
- `app/(instructor)/instructor/page.tsx`

## Implementation Steps
1. Update `prisma/schema.prisma`: add Review + Course.avgRating + Course.reviewCount + relations.
2. Migration `pnpm prisma migrate dev --name reviews_ratings`.
3. Backfill seed: add 3 sample reviews on demo course → recompute rating.
4. Build `lib/validations/review.ts` (zod).
5. Build `lib/queries/review.queries.ts` (3 funcs incl recompute helper).
6. Build `lib/actions/review.actions.ts` (3 actions; all inside `$transaction` with recompute).
7. Build `RatingStars` (read + interactive modes, half-star support).
8. Build `ReviewForm` (Dialog + 1-5 star selector + textarea + submit action).
9. Build `ReviewItem` (avatar initial + stars + date + comment + own-only edit/delete dropdown).
10. Build `ReviewList` (server-rendered + pagination via `?reviewPage=`).
11. Update course detail page — header rating + Reviews section + CTA logic.
12. Update catalog — sort dropdown + URL sync + orderBy.
13. Update CourseCard + EnrolledCourseCard — star row.
14. Update student dashboard — "Đánh giá khóa học đã học" prompt section.
15. Update instructor dashboard — Feedback section.
16. End-to-end test: enroll → review → catalog updates → instructor sees → edit → delete reverts.

## Todo list
- [ ] Step 1: schema Review + denormalized fields
- [ ] Step 2: migrate
- [ ] Step 3: seed sample reviews
- [ ] Step 4: reviewSchema zod
- [ ] Step 5: review queries (3 funcs)
- [ ] Step 6: review.actions.ts (3 actions)
- [ ] Step 7: RatingStars component
- [ ] Step 8: ReviewForm dialog
- [ ] Step 9: ReviewItem
- [ ] Step 10: ReviewList with pagination
- [ ] Step 11: detail page integration
- [ ] Step 12: catalog sort
- [ ] Step 13: CourseCard star row
- [ ] Step 14: dashboard prompt section
- [ ] Step 15: instructor feedback section
- [ ] Step 16: end-to-end test

## Success Criteria
- Enrolled student creates review → catalog card shows rating update.
- Non-enrolled cannot submit (action returns error).
- Duplicate review attempt → error "Bạn đã đánh giá rồi".
- Edit review → average updates correctly.
- Delete review → count decrements, avg recomputes (null if 0 reviews).
- Sort `?sort=rating` works (highest first; null-rated last via secondary order).
- Instructor sees feedback only for own courses.
- RatingStars renders half-star correctly cho avg 3.5.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Recompute race (concurrent reviews) | Low | Med | Always inside `$transaction`; SQLite single-writer protects |
| Float avg drift | Low | Low | Recompute from aggregate mỗi lần, không incremental |
| Comment XSS | Med | High | Plain text render (React auto-escape); no `dangerouslySetInnerHTML` |
| Review by user without progress | Med | Low | Acceptable; Enrollment-only check enough cho demo |
| Sort nulls bubble first | Med | Low | `orderBy: [{ avgRating: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }]` |
| Instructor self-review own course | Med | Med | Action check `course.instructorId !== session.user.id` |

## Security Considerations
- Ownership check update/delete: `review.userId === session.user.id`.
- Instructor cannot delete student reviews (admin role only via Phase 11 report system).
- Comment length max 1000 chars (DoS storage).
- Rating int clamped 1-5 via zod.
- `getCourseReviews` select user fields `{ id, name }` only (no email/password).
- Recompute helper takes Prisma transaction param → caller controls atomicity.

## Next steps
→ [Phase 09 — AI Recommendation](./phase-09-ai-recommendation.md)

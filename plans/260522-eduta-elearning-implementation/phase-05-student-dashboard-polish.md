# Phase 05 — Student Dashboard + UI Polish

## Context links
- Parent: [plan.md](./plan.md)
- Prev: [Phase 04](./phase-04-learning-experience.md)
- Refs: [reports/05-components-breakdown.md](./reports/05-components-breakdown.md)
- Dependencies: Phase 01-04 done. Enrollment + progress data exist.

## Overview
- **Date:** 2026-05-22
- **Days:** 10-11
- **Description:** Build `/dashboard` (My Courses) hiển thị enrolled courses + progress bar + continue learning button. Polish toàn app: loading states (Suspense + skeleton), empty states, error boundaries, responsive check, dark mode (nice-to-have nếu có thời gian).
- **Priority:** High (demo polish quan trọng)
- **Implementation status:** Not Started
- **Review status:** Not Reviewed

## Key Insights
- Dashboard query: 1 query lấy enrollments + course + count lessons + count completed → calc % per course.
- Continue learning = link tới lesson chưa completed đầu tiên, hoặc lesson đầu tiên nếu chưa học gì.
- Skeleton dùng shadcn `<Skeleton>` để hợp với loading.tsx convention của Next.js App Router.
- Polish phase: dùng checklist toàn route, screenshot từng page mobile/desktop, fix layout issues.

## Requirements
1. `/dashboard` route — student My Courses.
2. Hiển thị grid enrolled courses: thumbnail + title + progress bar + "Tiếp tục học" button.
3. Stats top: số course đã enroll, số lesson đã completed, tổng giờ học (mock — count lessons * 10 phút).
4. Empty state nếu chưa enroll: "Bạn chưa có khóa học nào — Khám phá ngay" + link `/courses`.
5. `loading.tsx` cho catalog + dashboard + learn pages.
6. `error.tsx` global cho graceful error handling.
7. `not-found.tsx` cho 404 thân thiện.
8. Responsive review toàn bộ: 375px, 768px, 1280px.
9. Empty states cho admin (chưa có course), catalog (no search results).
10. Consistent spacing + typography (Tailwind preset).

## Architecture
- Dashboard chỉ Server Component, không cần client state.
- Loading states: `loading.tsx` per route segment (Next.js convention).
- Error: `error.tsx` per route segment with `reset()` button.

**Data flow (dashboard):**
```
GET /dashboard
  → requireAuth() → session.user.id
  → query: enrollments include course include modules include lessons
       + LessonProgress where userId=current
  → compute per-course: totalLessons, completedLessons, percentage, continueLessonId
  → render grid
```

## Related code files
**Create:**
- `app/(student)/dashboard/page.tsx`
- `app/(student)/dashboard/loading.tsx`
- `app/(public)/courses/loading.tsx`
- `app/(student)/learn/[courseSlug]/[lessonId]/loading.tsx`
- `app/(public)/error.tsx`
- `app/(student)/error.tsx`
- `app/not-found.tsx`
- `app/global-error.tsx` (root crash)
- `components/dashboard/EnrolledCourseCard.tsx`
- `components/dashboard/StatsCards.tsx`
- `components/ProgressBar.tsx` (reusable, wrap shadcn Progress)
- `components/EmptyState.tsx` (reusable)
- `lib/queries/dashboard.queries.ts` — `getDashboardData(userId)`

**Modify:**
- All existing pages — add skeleton + empty state where missing
- `app/globals.css` — final theme tweaks
- `components/CourseCard.tsx` — final polish
- `components/layout/SiteHeader.tsx` — final polish

## Implementation Steps

1. **Build `lib/queries/dashboard.queries.ts`**:
   - `getDashboardData(userId)` returns:
     ```ts
     { enrolledCourses: Array<{ course, totalLessons, completedLessons, percentage, continueLessonId }>, stats: { courseCount, completedLessons, hoursStudied } }
     ```
2. **Build ProgressBar** reusable: wrap shadcn `<Progress>` + label "X% hoàn thành".
3. **Build EnrolledCourseCard**: thumbnail + title + ProgressBar + "Tiếp tục học" → link `/learn/[slug]/[continueLessonId]`.
4. **Build StatsCards**: 3 stat cards (courses enrolled, lessons completed, hours studied).
5. **Build `/dashboard` page**: requireAuth, call query, render StatsCards + EmptyState OR grid of EnrolledCourseCard.
6. **Build EmptyState** reusable: icon + title + description + CTA button props.
7. **Add `loading.tsx`** per route: render skeleton matching layout (grid of card skeletons for catalog/dashboard, video + content skeleton for lesson).
8. **Add `error.tsx`** per route group: render "Đã có lỗi xảy ra" + reset button.
9. **Add `not-found.tsx`**: friendly 404 with link home.
10. **Audit empty states**:
    - `/courses` no results → "Không tìm thấy khóa học nào — thử từ khóa khác".
    - `/admin/courses` no courses → "Chưa có khóa học nào — Tạo khóa đầu tiên".
    - `/admin/courses/[id]/edit` no modules → "Thêm module để bắt đầu".
11. **Responsive audit**: open every page at 375px, 768px, 1280px. Fix overflows, fix sidebar collapse, fix grid columns.
12. **Typography pass**: ensure consistent heading sizes, spacing scale. Use Tailwind `prose` for markdown content.
13. **Image optimization**: ensure all `<img>` swapped to `next/image` with proper `width`/`height`.
14. **Add favicon**: `app/favicon.ico` + `app/icon.png`.
15. **Smoke run-through**: every flow from anonymous → register → enroll → learn → quiz → dashboard → admin. Screenshot each major page.

## Todo list
- [ ] Step 1: dashboard queries
- [ ] Step 2: ProgressBar component
- [ ] Step 3: EnrolledCourseCard
- [ ] Step 4: StatsCards
- [ ] Step 5: `/dashboard` page
- [ ] Step 6: EmptyState component
- [ ] Step 7: `loading.tsx` per route
- [ ] Step 8: `error.tsx` per route group
- [ ] Step 9: `not-found.tsx`
- [ ] Step 10: empty states audit
- [ ] Step 11: responsive audit (3 breakpoints)
- [ ] Step 12: typography pass
- [ ] Step 13: next/image conversion
- [ ] Step 14: favicon + icon
- [ ] Step 15: full smoke walkthrough + screenshots

## Success Criteria
- `/dashboard` hiển thị accurate progress %, continue link đúng lesson.
- Empty state thân thiện cho user chưa enroll.
- Mỗi page navigate có skeleton (không flash blank).
- Reload error page → reset button work.
- 404 page hiển thị tiếng Việt + link home.
- Mobile 375px: không có horizontal scroll, sidebar drawer work.
- All images: lazy load + proper sizes.
- Lighthouse Performance > 80, Accessibility > 90 (local dev).

## Risk Assessment
| Risk                                       | Likelihood | Impact | Mitigation                                                            |
|--------------------------------------------|------------|--------|-----------------------------------------------------------------------|
| Dashboard query N+1 chậm                   | Med        | Low    | 1 query với deep include, in-memory aggregation                       |
| Skeleton mismatch real content layout      | Med        | Low    | Inspect real content first, draft skeleton matching exact grid        |
| Responsive vỡ ở 1 breakpoint               | High       | Med    | Audit checklist, dùng DevTools device toolbar systematically          |
| `loading.tsx` không trigger vì cache       | Med        | Low    | Mark Server Component `dynamic = "force-dynamic"` nếu cần fresh data |
| Polish phase tốn quá nhiều thời gian       | High       | Med    | Set hard stop end of day 11, polish thêm dồn vào buffer day 14       |

## Security Considerations
- Dashboard query: filter `userId = session.user.id` server-side, KHÔNG trust client userId.
- Continue learning link: validate lessonId belongs to enrolled course (đã làm ở Phase 04, dashboard chỉ link tới).
- Error.tsx: KHÔNG hiển thị stack trace cho user, chỉ log server-side.
- 404 page: không leak existence info (chỉ "Không tìm thấy trang").

## Next steps
→ [Phase 06 — Deploy + Demo](./phase-06-deploy-demo.md)

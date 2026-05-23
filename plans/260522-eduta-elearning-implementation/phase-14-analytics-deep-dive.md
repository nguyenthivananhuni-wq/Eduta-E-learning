# Phase 14 — Analytics Deep Dive (Instructor + Admin)

## Context links
- Parent: [plan.md](./plan.md)
- Prev: [Phase 13 — Review Intelligence](./phase-13-review-intelligence.md)
- Refs: [Phase 11 — Admin Enhancements](./phase-11-admin-enhancements.md), [Phase 07 — Marketplace Foundation](./phase-07-marketplace-foundation.md)
- Dependencies: Phase 07 (Transaction + Enrollment + LessonProgress), Phase 08 (Review for avgRating), Phase 11 (existing analytics page to extend).

## Overview
- **Date:** 2026-05-23
- **Description:** Mở rộng analytics cho cả instructor (revenue chart + per-course performance page) và admin (revenue trend + category breakdown + conversion). Tạo 1 reusable `<BarChart>` component (DRY). Seed thêm 10-15 historic transactions để charts không trống. **Split thành 2 batch:** Batch 1 = Instructor side, Batch 2 = Admin side.
- **Priority:** Med (demo polish, không block khác)
- **Implementation status:** Not Started
- **Review status:** Not Reviewed

## Key Insights
- **Demo data critical**: hiện chỉ 0-1 PURCHASE transaction → seed 10-15 transactions historic scattered over 60 ngày trước khi build chart.
- **Reusable `BarChart`** — pattern tách 1 component dùng cho cả 4 chart (revenue trend, enrollment trend, revenue-by-course, category breakdown). DRY.
- **CSS bars only** — không thêm recharts/chart.js dep (KISS).
- **Completion funnel** = % student còn lại theo từng lesson order — cho thấy drop-off điểm nào.
- **Conversion proxy** = `users_who_purchased / total_users` (label rõ "ước tính").
- **Per-course page** owned by instructor OR admin (admin xem được khóa của instructor khác).

## Pre-requisites & Existing Code Refactor

### Schema changes
- **NONE** — dùng table sẵn có (Transaction, Enrollment, LessonProgress, Review, Course, User).

### Seed expansion (CRITICAL)
- 10 fake students `demo-01@eduta.local` đến `demo-10@eduta.local` (password `demo123`, role STUDENT, wallet 500.000đ).
- Mỗi student top-up wallet 1 lần (TOPUP transaction với `createdAt` random trong 60 ngày qua).
- 6-12 student "mua" khóa Tiếng Anh 10 (giá hiện 0đ) hoặc 1-2 dummy course với `createdAt` random.
- Vì khóa Tiếng Anh 10 đang free, sửa price thành 100.000đ trong seed → tạo PURCHASE + EARNING transactions có ý nghĩa.
- 5-8 student tạo LessonProgress (complete 1-3 bài) → cho funnel có data.
- Total: ~15-20 transactions trải đều, ~15 enrollments, ~15 progress rows.

### Files to modify (existing)
| File | Changes |
|------|---------|
| `prisma/seed.ts` | Add 10 demo students + 15-20 historic transactions + enrollments + lesson progress |
| `app/(instructor)/instructor/page.tsx` | Replace 4 stat cards với delta version + embed RevenueChart + RevenueByCourseList |
| `app/(instructor)/instructor/courses/page.tsx` | Add "📊 Phân tích" link cạnh "Sửa" cho mỗi khóa |
| `app/(admin)/admin/analytics/page.tsx` | Add RevenueTrendChart + CategoryRevenueChart + ConversionStats + EnrollmentTrendChart |

### Files to create (new)
- `components/charts/BarChart.tsx` — reusable, accept `data: {label, value, color?}[]`, props `orientation: vertical|horizontal`, `formatValue`, `height`
- `components/dashboard/RevenueChart.tsx` — wrapper using BarChart for time-series
- `components/dashboard/RevenueByCourseList.tsx` — horizontal bars cho top earning courses
- `components/dashboard/CompletionFunnel.tsx` — horizontal bars cho per-lesson completion
- `components/admin/CategoryRevenueChart.tsx`
- `components/admin/ConversionStats.tsx`
- `app/(instructor)/instructor/courses/[id]/analytics/page.tsx` — per-course analytics dashboard
- `lib/queries/instructor-analytics.queries.ts` — getRevenueTrend, getRevenueByCourse, getMonthlyDelta, getOverallAvgRating
- `lib/queries/course-analytics.queries.ts` — getEnrollmentTrend, getCompletionFunnel, getQuizPerformance, getCourseRevenue
- Extend `lib/queries/analytics.queries.ts` — getPlatformRevenueTrend, getCategoryRevenue, getEnrollmentTrend, getConversionMetrics

## Requirements

### Batch 1 — Instructor analytics
1. Reusable BarChart component (vertical + horizontal modes).
2. `/instructor` dashboard:
   - Revenue chart 30d (daily bars).
   - Revenue-by-course list (top 5 owned).
   - Stat cards có delta (vs tháng trước).
   - Avg rating across all own courses.
3. `/instructor/courses/[id]/analytics` page (NEW):
   - 4 KPI cards: enrollments, revenue, completion%, avgRating.
   - Enrollment trend (30d).
   - Completion funnel (per lesson).
   - Recent reviews (5 latest).
4. Ownership guard: only instructor of course OR admin.

### Batch 2 — Admin analytics enhancement
5. `/admin/analytics`:
   - Revenue trend chart (90d daily, secondary y-axis or pure bars).
   - Category revenue breakdown (horizontal bars per category).
   - Enrollment trend (30d).
   - Conversion stats card (% paying users, % active learners).

### Common
6. Seed expansion FIRST (Step 1) — bảo đảm charts có data.
7. All time-series buckets fill zeros cho ngày không có transaction (như Phase 11 user growth).

## Architecture

### Reusable BarChart
```tsx
type BarPoint = { label: string; value: number; color?: string };
<BarChart
  data={points}
  orientation="vertical" | "horizontal"
  formatValue={(v) => formatVND(v)}
  height={128}
  showXLabels={3}  // show first/middle/last
/>
```
- Vertical: dùng cho time-series (revenue trend, enrollment trend).
- Horizontal: dùng cho ranking (revenue-by-course, category, completion).

### Per-course completion funnel
```ts
async function getCompletionFunnel(courseId) {
  const lessons = await db.lesson.findMany({
    where: { module: { courseId } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    select: { id, title, module: { title } }
  });
  const enrolledCount = await db.enrollment.count({ where: { courseId } });
  const completionCounts = await db.lessonProgress.groupBy({
    by: ["lessonId"],
    where: { lessonId: { in: lessons.map(l => l.id) }, completed: true },
    _count: { id: true }
  });
  return lessons.map((l, i) => ({
    label: `${i+1}. ${l.title}`,
    value: completionCounts.find(c => c.lessonId === l.id)?._count.id ?? 0,
    total: enrolledCount,
    pct: enrolledCount ? (count/enrolledCount)*100 : 0,
  }));
}
```

### Conversion proxy
```ts
async function getConversionMetrics() {
  const totalUsers = await db.user.count({ where: { role: "STUDENT" } });
  const paying = await db.user.count({
    where: {
      role: "STUDENT",
      transactions: { some: { type: "PURCHASE", status: "COMPLETED" } }
    }
  });
  const activeLearners = await db.user.count({
    where: {
      role: "STUDENT",
      progress: { some: { completed: true } }
    }
  });
  return {
    totalStudents: totalUsers,
    payingPercent: totalUsers ? (paying/totalUsers)*100 : 0,
    activePercent: totalUsers ? (activeLearners/totalUsers)*100 : 0,
  };
}
```

### Revenue trend (per-day buckets)
- Same Phase 11 `getUserGrowth` pattern: 60-day map, init zeros, group transactions by ISO date.
- Optimize: pull all PURCHASE transactions in date range, bucket in-memory.

## Related code files

**Create:**
- `components/charts/BarChart.tsx`
- `components/dashboard/RevenueChart.tsx`
- `components/dashboard/RevenueByCourseList.tsx`
- `components/dashboard/CompletionFunnel.tsx`
- `components/admin/CategoryRevenueChart.tsx`
- `components/admin/ConversionStats.tsx`
- `app/(instructor)/instructor/courses/[id]/analytics/page.tsx`
- `lib/queries/instructor-analytics.queries.ts`
- `lib/queries/course-analytics.queries.ts`

**Modify:**
- `prisma/seed.ts` (add demo learners + historic transactions)
- `app/(instructor)/instructor/page.tsx`
- `app/(instructor)/instructor/courses/page.tsx` (analytics link)
- `app/(admin)/admin/analytics/page.tsx`
- `lib/queries/analytics.queries.ts` (extend)

## Implementation Steps

### Batch 1 — Instructor (~3 hours)
1. **Seed expansion**: add 10 demo students, set Tiếng Anh 10 price = 100.000đ, create 15-20 historic transactions với `createdAt` random spread 60 ngày, create enrollments + LessonProgress.
2. Run `pnpm tsx prisma/seed.ts` → verify counts (>15 transactions, ~15 enrollments).
3. Build `components/charts/BarChart.tsx` (vertical + horizontal modes, generic).
4. Build `lib/queries/instructor-analytics.queries.ts` (4 funcs).
5. Build `RevenueChart.tsx` wrapper (vertical bars, 30d daily).
6. Build `RevenueByCourseList.tsx` (horizontal bars).
7. Refactor `/instructor/page.tsx`:
   - Stat cards: add delta "vs tháng trước" cho earnings/students.
   - Embed RevenueChart, RevenueByCourseList.
   - Replace "Khóa học gần đây" để giữ ngắn gọn.
8. Build `lib/queries/course-analytics.queries.ts` (4 funcs).
9. Build `CompletionFunnel.tsx`.
10. Build `/instructor/courses/[id]/analytics/page.tsx`:
    - 4 KPI cards.
    - EnrollmentTrend chart (BarChart vertical).
    - CompletionFunnel.
    - Quiz performance list.
    - Recent reviews preview.
11. Update `/instructor/courses/page.tsx`: thêm "📊 Phân tích" link cạnh "Sửa" (small icon).
12. Ownership guard: page redirect nếu non-owner & non-admin.
13. Typecheck Batch 1 + smoke test với seed data.

### Batch 2 — Admin (~2 hours)
14. Extend `lib/queries/analytics.queries.ts`: getPlatformRevenueTrend, getCategoryRevenue, getEnrollmentTrend, getConversionMetrics.
15. Build `CategoryRevenueChart.tsx` (horizontal bars).
16. Build `ConversionStats.tsx` card.
17. Update `/admin/analytics/page.tsx`:
    - Insert RevenueTrend chart (90d) below KPI cards.
    - Add CategoryRevenueChart cạnh TopCoursesList.
    - Add ConversionStats card row.
    - Keep existing 30d UserGrowthChart (rename "Người dùng mới").
18. Typecheck Batch 2 + smoke test.

## Todo list
- [ ] **Batch 1**
- [ ] Step 1: seed expansion (demo learners + historic transactions)
- [ ] Step 2: run seed + verify
- [ ] Step 3: reusable BarChart
- [ ] Step 4: instructor-analytics queries
- [ ] Step 5: RevenueChart component
- [ ] Step 6: RevenueByCourseList component
- [ ] Step 7: refactor /instructor dashboard
- [ ] Step 8: course-analytics queries
- [ ] Step 9: CompletionFunnel component
- [ ] Step 10: per-course analytics page
- [ ] Step 11: analytics link in courses list
- [ ] Step 12: ownership guard
- [ ] Step 13: typecheck + smoke test Batch 1
- [ ] **Batch 2**
- [ ] Step 14: extend admin analytics queries
- [ ] Step 15: CategoryRevenueChart
- [ ] Step 16: ConversionStats card
- [ ] Step 17: update /admin/analytics page
- [ ] Step 18: final typecheck + smoke test

## Success Criteria

### Batch 1
- Demo data: `db.transaction.count()` ≥ 15 sau seed.
- Instructor dashboard hiện revenue chart 30d với ít nhất 5-10 bars có data.
- Revenue-by-course list hiện ≥ 1 khóa với amount số tiền cụ thể.
- Stat card "Doanh thu tháng này" có delta % vs tháng trước.
- Click "📊 Phân tích" → mở per-course page → 4 KPI cards render.
- Completion funnel hiện 15 lessons với % giảm dần (drop-off visible).
- Non-owner student truy cập per-course analytics → redirect away.

### Batch 2
- /admin/analytics có revenue trend 90d chart bên dưới KPI cards.
- Category breakdown hiện ít nhất 1 category (Ngoại ngữ) với revenue.
- ConversionStats: "X% người dùng đã mua khóa" hiện ra số.
- Existing user growth chart vẫn hoạt động (regression-free).

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Seed data conflict với existing data | Med | Low | Use `upsert` + unique email prefix `demo-NN@` |
| Charts trống vì seed timestamps không spread | Med | Med | Random `createdAt` rải đều 60 ngày qua |
| Completion funnel slow query | Low | Low | groupBy có index sẵn; <100 progress rows |
| Per-course analytics expose data của instructor khác | Low | High | Server-side ownership check trong page guard |
| BarChart không render khi data toàn 0 | Med | Low | Show "Chưa có dữ liệu" placeholder khi `data.every(d => d.value === 0)` |
| Date timezone edge cases (UTC vs VN) | Med | Low | Use ISO date slice — accept ngày theo UTC cho đồ án |
| Category revenue requires nested join | Low | Med | Single query với include category from course |
| Avg rating across instructor courses null | Med | Low | Filter `avgRating !== null` trước averaging |

## Security Considerations
- **Per-course analytics**: server-side ownership check trong page `redirect()` if `course.instructorId !== session.user.id && session.user.role !== "ADMIN"`.
- **Seed demo learners**: tạo với password hash hợp lệ (bcrypt), không hard-code plaintext nhạy cảm.
- **Conversion metrics**: chỉ admin xem, không expose ra `/admin/analytics` cho non-admin (đã có layout guard).
- **Reusable BarChart**: render `label` text → React auto-escape, không XSS từ course title.
- **Revenue queries**: chỉ count `Transaction.status = COMPLETED` (skip FAILED).

## Next steps
- Sau Phase 14 hoàn tất → Phase 12 (Deploy + Demo) — chuẩn bị Vercel + Turso final.
- Optional future: real-time analytics via WebSocket (out of scope).
- Optional future: export CSV report cho instructor / admin (out of scope, nice-to-have).
- Optional future: course view tracking (CourseView model) cho conversion funnel chính xác hơn — yêu cầu thêm middleware tracking + storage.

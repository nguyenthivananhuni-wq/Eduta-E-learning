# Phase 03 — Public Pages + Enrollment

## Context links
- Parent: [plan.md](./plan.md)
- Prev: [Phase 02](./phase-02-admin-crud.md)
- Refs: [reports/05-components-breakdown.md](./reports/05-components-breakdown.md), [reports/07-mock-payment-flow.md](./reports/07-mock-payment-flow.md), [reports/04-server-actions.md](./reports/04-server-actions.md)
- Dependencies: Phase 01 done. Phase 02 done OR seed data available.

## Overview
- **Date:** 2026-05-22
- **Days:** 5-6
- **Description:** Build public-facing pages: landing, course catalog với search + filter category, course detail, mock payment modal/page. Student có thể browse → click enroll → mock payment → Enrollment record được tạo → redirect `/learn/[slug]/[firstLessonId]`.
- **Priority:** High (demo flow chính)
- **Implementation status:** Not Started
- **Review status:** Not Reviewed

## Key Insights
- Search + filter dùng URL searchParams (Server Component) → SEO friendly, không cần client state.
- `/courses?q=...&category=...` → Server Component đọc `searchParams` prop → query Prisma với `where` dynamic.
- Mock payment KHÔNG cần là full page, có thể là Dialog modal trên course detail (đơn giản hơn). Nhưng plan có route `/checkout/[courseId]` → ta dùng route đó cho UX rõ ràng + URL share được.
- Enrollment idempotent: nếu đã enroll → button "Vào học" thay vì "Đăng ký".
- Featured courses landing: lấy top 3 `published: true` order by `enrollments count desc`.

## Requirements
1. `/` landing page — hero + featured courses (3) + CTA login/register.
2. `/courses` — grid courses + search input + category filter dropdown + empty state.
3. `/courses/[slug]` — hero (thumbnail + title + price), description, modules + lessons preview list (titles only), CTA "Đăng ký học" hoặc "Vào học" tùy enrollment status.
4. `/checkout/[courseId]` — mock payment page: course summary + "VietQR giả" UI + 2s loader + success toast + auto redirect `/learn/[slug]/[firstLessonId]`.
5. Header navigation: logo, /courses, /dashboard (if logged in), user menu / login button.
6. Public pages SEO basic: `<title>` + `<meta description>` dynamic per course.
7. Responsive: mobile-first, breakpoints sm/md/lg.

## Architecture
- **Route group:** `app/(public)/` — landing + catalog + detail. `app/(student)/checkout/...` (auth required).
- **Header:** `components/layout/SiteHeader.tsx` — Server Component lấy session, render nav.
- **Course card:** `components/CourseCard.tsx` — reusable cho catalog + featured.

**Data flow (enroll):**
```
Click "Đăng ký học" (course detail)
  → if not logged in: redirect /login?callbackUrl=/checkout/[courseId]
  → else: router.push /checkout/[courseId]
  → checkout page render fake QR + "Đang xử lý..." 2s setTimeout
  → call Server Action enrollCourse(courseId)
  → action: requireAuth + check not already enrolled + create Enrollment
  → return { ok: true, firstLessonId, slug }
  → router.push /learn/[slug]/[firstLessonId] + toast success
```

## Related code files
**Create:**
- `app/(public)/layout.tsx` — public layout with SiteHeader
- `app/(public)/page.tsx` — landing (override root `app/page.tsx`)
- `app/(public)/courses/page.tsx` — catalog with searchParams
- `app/(public)/courses/[slug]/page.tsx` — course detail
- `app/(student)/checkout/[courseId]/page.tsx` — mock payment
- `app/(student)/layout.tsx` — student guard
- `components/layout/SiteHeader.tsx`
- `components/layout/SiteFooter.tsx`
- `components/layout/UserMenu.tsx` — dropdown avatar/menu
- `components/CourseCard.tsx`
- `components/CourseGrid.tsx`
- `components/CatalogFilters.tsx` — client search + category filter (URL sync)
- `components/EnrollButton.tsx` — client, redirect based on auth/enrolled state
- `components/MockPaymentScreen.tsx` — client, fake processing UI
- `components/Hero.tsx` — landing hero
- `lib/actions/enrollment.actions.ts` — enrollCourse, isEnrolled
- `lib/queries/course.queries.ts` — `getPublishedCourses(filter)`, `getCourseBySlug`, `getFeaturedCourses`
- `lib/utils/format.ts` — `formatVND(price: number)`
- `lib/utils/youtube.ts` — `extractYouTubeId(url)` (use Phase 04)

## Implementation Steps

1. **Add shadcn components**: `pnpm dlx shadcn@latest add dropdown-menu avatar skeleton`.
2. **Build SiteHeader + SiteFooter + UserMenu**: Server Component header reads session. UserMenu (client) shows avatar dropdown if session, else Login button.
3. **Build `lib/queries/course.queries.ts`**: typed Prisma functions cho catalog + detail + featured.
4. **Build CourseCard**: shadcn Card with thumbnail (Image), title, category badge, price (formatted VND), "Xem chi tiết" link. Reusable.
5. **Build `/` landing**: Hero "Eduta — Học bất cứ thứ gì bạn muốn" + 2 CTA + section "Khóa học nổi bật" với 3 CourseCard.
6. **Build CatalogFilters**: client component, search input (debounce 300ms) + category Select, sync to URL via `useRouter().replace`.
7. **Build `/courses` page**: Server Component đọc `searchParams.q` + `searchParams.category` → query `getPublishedCourses` → render CourseGrid. Empty state nếu 0 results.
8. **Build `/courses/[slug]` page**: Server Component fetch course with modules + lessons (titles only, NOT content). Render: thumbnail, title, price, description, accordion list modules → lessons titles. Pass enrollment status to EnrollButton.
9. **Build EnrollButton**: check if `isEnrolled` → render "Vào học" (link to first lesson) else "Đăng ký học" (link to /checkout/[courseId]). If not logged in, link to `/login?callbackUrl=...`.
10. **Build `app/(student)/layout.tsx`**: `requireAuth()`.
11. **Build `lib/actions/enrollment.actions.ts`**:
    - `enrollCourse(courseId: string)` → requireAuth + check not enrolled + Prisma.enrollment.create + return `{ ok, slug, firstLessonId }`.
    - `isEnrolled(userId, courseId)` query helper.
12. **Build `/checkout/[courseId]` page**: Server Component fetch course + check not already enrolled (else redirect /learn). Render `<MockPaymentScreen course={...} />`.
13. **Build `MockPaymentScreen` (client)**: course summary card + VietQR placeholder image (`/qr-placeholder.png` in public) + countdown text "Đang xử lý thanh toán..." + spinner. `useEffect` setTimeout 2000ms → call `enrollCourse` action → toast success → router.push `/learn/[slug]/[firstLessonId]`.
14. **Add public folder assets**: `public/qr-placeholder.png` (download free VietQR mockup image), `public/logo.svg`.
15. **Manual test**: anonymous browse `/courses` → search "next" → click course → see detail → click enroll → redirect login → register → back to checkout → 2s → land on /learn page (even if Phase 04 chưa làm — chỉ cần URL đúng).

## Todo list
- [ ] Step 1: add shadcn dropdown/avatar/skeleton
- [ ] Step 2: SiteHeader + Footer + UserMenu
- [ ] Step 3: course queries
- [ ] Step 4: CourseCard component
- [ ] Step 5: landing page
- [ ] Step 6: CatalogFilters component
- [ ] Step 7: `/courses` catalog
- [ ] Step 8: `/courses/[slug]` detail
- [ ] Step 9: EnrollButton
- [ ] Step 10: student layout guard
- [ ] Step 11: enrollment actions
- [ ] Step 12: `/checkout/[courseId]` page
- [ ] Step 13: MockPaymentScreen client
- [ ] Step 14: public assets (QR + logo)
- [ ] Step 15: e2e manual test browse → enroll

## Success Criteria
- Anonymous user truy cập `/` → thấy 3 featured courses.
- `/courses?q=next&category=Lập+trình` → list filtered correctly.
- `/courses/[slug]` hiển thị đầy đủ thông tin course, không expose lesson content.
- Anonymous click "Đăng ký học" → redirect `/login?callbackUrl=/checkout/[id]`.
- Logged in user click → đến checkout → 2s → toast success → URL `/learn/...`.
- Reload checkout sau khi đã enrolled → redirect `/learn/...` (không cho pay lại).
- Mobile (375px width) layout không vỡ.
- VND format: `1.500.000₫` đúng locale `vi-VN`.

## Risk Assessment
| Risk                                              | Likelihood | Impact | Mitigation                                                          |
|---------------------------------------------------|------------|--------|---------------------------------------------------------------------|
| searchParams + Server Component caching confusion | Med        | Med    | Use `export const dynamic = "force-dynamic"` cho catalog page       |
| Race condition: 2 tabs cùng enroll 1 course       | Low        | Low    | Prisma unique(userId, courseId) constraint catch → ignore           |
| Mock payment "thấy giả quá" lúc demo              | Med        | Low    | UI VietQR + countdown + spinner làm "đủ tin" cho demo               |
| Image Next.js domain whitelist                    | Med        | Low    | Add `images.unsplash.com` to `next.config.ts` remotePatterns        |
| firstLessonId null nếu course rỗng module/lesson | Low        | Med    | Validate trước khi enroll: course phải có ≥ 1 lesson, else block    |

## Security Considerations
- `/checkout/[courseId]` requireAuth, course phải `published: true`, else 404.
- `enrollCourse` Server Action: check `published` + check chưa enroll trước khi create.
- KHÔNG trust client price — không có truyền price từ client. Server query lại course price (mock payment không cần thật, nhưng đúng pattern).
- searchParams `q` và `category`: zod validate (string, max length 100), prevent abuse.
- Image src URL trust: chỉ Unsplash/seed URLs. Next/Image whitelist domain trong config.
- CSRF: Server Actions automatic CSRF protected by Next.js.

## Next steps
→ [Phase 04 — Learning Experience](./phase-04-learning-experience.md)

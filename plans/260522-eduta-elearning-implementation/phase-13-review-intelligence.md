# Phase 13 — Review Intelligence (AI Summary + Rating Stats)

## Context links
- Parent: [plan.md](./plan.md)
- Prev: [Phase 12 — Deploy + Demo](./phase-12-deploy-demo.md)
- Refs: [reports/11-ai-integration.md](./reports/11-ai-integration.md)
- Dependencies: Phase 08 (Review + Course.avgRating, reviewCount), Phase 09 (Anthropic SDK + `lib/ai/client.ts` infrastructure reusable).

## Overview
- **Date:** 2026-05-23
- **Description:** Phân tích sâu hơn nội dung review để **(F1)** dùng Claude tóm tắt pros/cons + topic tags của mỗi khóa, hiển thị ở course detail + instructor dashboard. **(F2)** Rating distribution (Amazon-style) + % positive + trend chip. Hai feature bổ sung làm review hệ thống trở thành tín hiệu hữu ích thay vì chỉ là điểm sao. Bỏ qua F3 (sentiment-driven recommendation) — đã có Phase 09 dùng rating, marginal ROI quá thấp với dataset demo.
- **Priority:** Med (differentiator feature làm demo nổi bật)
- **Implementation status:** Not Started
- **Review status:** Not Reviewed

## Key Insights
- **F1 reuses Phase 09 infrastructure DRY**: `lib/ai/client.ts` singleton + `getAnthropic()` null-check, same `claude-haiku-4-5-20251001` model.
- **F2 = no AI**, pure Prisma aggregate. Buld first.
- **Cache 24h** cho F1 (review không thay đổi liên tục như recommendations). Refresh manual qua button cho admin/instructor.
- **Min threshold 3 reviews** → mới gọi LLM. Dưới 3 → render "Cần thêm review để phân tích" placeholder, không tốn API call.
- **Seed thêm 4-5 reviews** từ student3/student4 mới để demo F1 có signal phong phú (đa rating + đa góc nhìn).
- LLM hallucination chống bằng zod parse + topic enum limit (`["nội dung", "giảng viên", "quiz", "tốc độ", "tài liệu", "khác"]`).

## Pre-requisites & Existing Code Refactor

### Schema changes
- 1 migration `review_intelligence`:
  - New `ReviewInsight` (id, courseId UNIQUE, prosJson String, consJson String, topicsJson String, summary String, sentiment String, sampleSize Int, generatedAt DateTime).
  - No backfill needed.

### Seed expansion
- Tạo 2 student mới: `student3@eduta.local`, `student4@eduta.local` (password `student123`, wallet 0đ — không cần welcome bonus vì chỉ để có review).
- Enroll cả 2 vào khóa Tiếng Anh 10.
- Tạo 4 review thêm với nội dung đa dạng (5★, 4★, 3★ mix) → trigger F1 có data thực để tóm tắt.

### Files to modify (existing)
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add ReviewInsight model + relation Course.insight (optional) |
| `prisma/seed.ts` | Add student3 + student4 + enrollments + 4 extra reviews on demo course |
| `app/(public)/courses/[slug]/page.tsx` | Embed `<CourseRatingBreakdown />` cạnh rating header + `<ReviewInsightSection />` trên review list |
| `app/(instructor)/instructor/page.tsx` | Mini insight per-course in "Phản hồi học viên" |
| `lib/actions/review.actions.ts` | Invalidate ReviewInsight cache (delete row) khi review create/update/delete để force regenerate |

### Files to create (new)
- `lib/ai/review-insights.ts` — `getReviewInsight(courseId)` với cache TTL 24h + LLM call + fallback null
- `lib/ai/insight-prompts.ts` — Vietnamese system + user prompt template
- `lib/ai/insight-schema.ts` — zod cho LLM response
- `lib/queries/rating-stats.queries.ts` — `getRatingDistribution(courseId)`, `getRatingTrend(courseId, days=30)`
- `lib/actions/review-insight.actions.ts` — `refreshReviewInsight(courseId)` Server Action (admin + course instructor only)
- `components/reviews/RatingBreakdown.tsx` — bar chart distribution + % positive + trend chip
- `components/reviews/ReviewInsightSection.tsx` — pros/cons cards + topic chips + refresh button (admin/instructor only)

## Requirements
1. New `ReviewInsight` table.
2. F1 — `lib/ai/review-insights.ts` với cache 24h + LLM/fallback chain.
3. F1 prompt Vietnamese, output structured pros/cons/topics/sentiment/summary.
4. F1 displayed at course detail above review list + instructor dashboard mini summary.
5. F1 refresh button visible only to course instructor + admin.
6. F2 — `getRatingDistribution` returns `{ 1, 2, 3, 4, 5 } → counts`.
7. F2 — `RatingBreakdown` component renders bar chart + % positive (4-5 stars).
8. Seed 4 new reviews + 2 new students for demo data quality.
9. Min threshold 3 reviews trước khi render F1 (placeholder otherwise).
10. F1 cache invalidates khi review CRUD trên cùng courseId.

## Architecture

### F1 Flow
```
Detail page → <ReviewInsightSection courseId> (server component)
  → getReviewInsight(courseId)
  → cache fresh? return : else
  → if reviewCount < 3: return null (placeholder rendered)
  → fetch all reviews (limit 50) → build prompt
  → if ANTHROPIC_API_KEY: call Claude → parse JSON → cache → return
  → else / on error: return null (skip render entirely; KHÔNG fake data)
```

### LLM response schema (zod)
```ts
{
  pros: string[3..5],         // câu ngắn < 60 từ
  cons: string[0..3],         // có thể rỗng nếu toàn 5★
  topics: enum[]              // chỉ trong set whitelist
  sentiment: "positive" | "mixed" | "negative",
  summary: string             // 1-2 câu tổng quát
}
```

### F2 Flow
```
detail page → server-render <RatingBreakdown />:
  reviews = db.review.groupBy(by: rating, _count: id) for this course
  buckets = { 1:0, 2:0, 3:0, 4:0, 5:0 } merged
  positive% = (4★ + 5★) / total * 100
  render: stacked bars + percent labels
```

### Invalidation
```ts
// in createReview / updateReview / deleteReview after $transaction:
await db.reviewInsight.deleteMany({ where: { courseId } });
// Next page render → cache miss → regenerate.
```

## Related code files

**Create:**
- `lib/ai/review-insights.ts`
- `lib/ai/insight-prompts.ts`
- `lib/ai/insight-schema.ts`
- `lib/queries/rating-stats.queries.ts`
- `lib/actions/review-insight.actions.ts`
- `components/reviews/RatingBreakdown.tsx`
- `components/reviews/ReviewInsightSection.tsx`
- `prisma/migrations/<ts>_review_intelligence/migration.sql`

**Modify:**
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `lib/actions/review.actions.ts`
- `app/(public)/courses/[slug]/page.tsx`
- `app/(instructor)/instructor/page.tsx`

## Implementation Steps
1. Update `prisma/schema.prisma`: add `ReviewInsight` model + optional reverse relation.
2. Migration `pnpm prisma migrate dev --name review_intelligence`.
3. Update seed: 2 new students + enrollments + 4 extra reviews → recompute Course.avgRating.
4. Run seed → confirm khóa Tiếng Anh 10 có ~6 reviews.
5. Build `lib/queries/rating-stats.queries.ts` (2 funcs).
6. Build `RatingBreakdown` component (CSS bars — same pattern UserGrowthChart Phase 11).
7. Wire `<RatingBreakdown />` into course detail page header section.
8. Build `lib/ai/insight-schema.ts` (zod).
9. Build `lib/ai/insight-prompts.ts` (Vietnamese system + user templates).
10. Build `lib/ai/review-insights.ts` (cache + LLM + fallback null).
11. Build `lib/actions/review-insight.actions.ts` — `refreshReviewInsight` (admin/instructor only).
12. Build `ReviewInsightSection` server component + client refresh button.
13. Wire into course detail page (above ReviewList).
14. Wire mini insight summary card into instructor dashboard.
15. Update `review.actions.ts` — invalidate insight cache on CRUD.
16. Typecheck + smoke test 3 scenarios: no API key (skip insight), with key (pros/cons render), < 3 reviews (placeholder).

## Todo list
- [ ] Step 1: schema ReviewInsight
- [ ] Step 2: migrate
- [ ] Step 3: seed 2 users + 4 reviews
- [ ] Step 4: rating-stats queries (2 funcs)
- [ ] Step 5: RatingBreakdown component
- [ ] Step 6: wire RatingBreakdown into detail
- [ ] Step 7: insight zod schema
- [ ] Step 8: insight prompt template
- [ ] Step 9: review-insights.ts main module
- [ ] Step 10: refresh action
- [ ] Step 11: ReviewInsightSection component
- [ ] Step 12: wire into detail page
- [ ] Step 13: wire mini summary into instructor dashboard
- [ ] Step 14: invalidate cache in review.actions
- [ ] Step 15: typecheck + smoke test

## Success Criteria
- F2: course detail header hiện distribution bar 5★ → 1★ + % positive number cho khóa Tiếng Anh 10.
- F2: nếu reviewCount < 3 → render placeholder "Cần thêm review" thay vì bar trống.
- F1: with API key → ReviewInsightSection hiện 3-5 pros + 0-3 cons + topic chips + summary 1-2 câu (tiếng Việt).
- F1: without API key → section ẨN hoàn toàn (KHÔNG render fake fallback text). Course detail vẫn render bình thường.
- F1: cache TTL 24h hoạt động (2 lần load liên tiếp không gọi LLM lần 2).
- F1: instructor/admin của khóa thấy nút "Cập nhật phân tích" → click → force regenerate.
- F1: student thường không thấy nút refresh.
- F1: tạo/sửa/xóa review → cache xóa → reload detail → insight rebuild với data mới.
- LLM trả non-JSON → catch silently → section ẩn (không UI crash).
- Topic ngoài whitelist → filter ra (giữ ≤ 5 topic).

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM hallucinate pros không có trong review | Med | Low | Cảnh báo nhỏ "Tóm tắt bởi AI"; instructor có thể refresh khi sai |
| Token spike khi khóa nhiều review | Low | Low | Limit 50 review gần nhất; truncate comment > 300 chars |
| Cache stale sau review CRUD | Med | Med | Invalidate trong $transaction của review.actions |
| F1 fallback chỉ là null → có cảm giác feature thiếu | Med | Low | Đó là design intentional KISS — không show fake data; doc rõ ràng cần API key |
| Topic whitelist hardcode VN | Low | Low | Chấp nhận cho demo; nếu deploy đa ngôn ngữ sau này thì refactor |
| Refresh spam tốn cost | Low | Low | Server action: max 5 refresh/khóa/giờ tracking trong updatedAt của ReviewInsight |
| Distribution chart không đẹp với 3-4 review | Med | Low | Chỉ render khi count >= 3, label số tuyệt đối cạnh % |

## Security Considerations
- `ANTHROPIC_API_KEY` server-only (đã guard ở Phase 09).
- Review content sent to Claude — KHÔNG kèm email/userId, chỉ raw comment text (PII risk LOW).
- Refresh action `requireAdmin() OR course.instructorId === session.user.id`.
- Cache invalidate qua server action chỉ — không expose endpoint public.
- Topic + sentiment + pros/cons render plain text (React auto-escape).
- LLM response parsed via zod trước khi save DB — không lưu raw string.
- Rate limit refresh 5/khóa/giờ (track `updatedAt` của ReviewInsight row).

## Next steps
- Sau Phase 13 hoàn tất → demo flow show off cả AI recommendation (Phase 09) + AI review insight (Phase 13) → 2 use case rõ rệt của Claude API.
- Optional future: F3 sentiment-driven recommendation (skip cho đồ án này — marginal ROI).
- Optional future: instructor "Hành động đề xuất" — Claude phân tích cons → gợi ý cải thiện cụ thể.

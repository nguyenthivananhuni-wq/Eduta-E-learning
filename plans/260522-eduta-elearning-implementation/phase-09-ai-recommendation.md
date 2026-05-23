# Phase 09 — AI Recommendation (Claude API)

## Context links
- Parent: [plan.md](./plan.md)
- Prev: [Phase 08 — Reviews & Ratings](./phase-08-reviews-ratings.md)
- Refs: [reports/11-ai-integration.md](./reports/11-ai-integration.md), [reports/09-extended-schema.md](./reports/09-extended-schema.md), [reports/10-extended-server-actions.md](./reports/10-extended-server-actions.md)
- Dependencies: Phase 07 (Enrollment + Course.status=APPROVED + Notification), Phase 08 (Review.rating as quality signal).

## Overview
- **Date:** 2026-05-23
- **Description:** LLM-based personalized recommendations via Claude Haiku 4.5. Build user context (enrollments + ratings + recent activity) + list available APPROVED courses → ask Claude top N + reason. Cache 1h. Fallback rule-based khi không có API key OR API fail. Display "Đề xuất cho bạn" trên dashboard. "Khóa học tương tự" trên detail page (rule-based, no LLM).
- **Priority:** Med (differentiator feature, không block khác)
- **Implementation status:** Not Started
- **Review status:** Not Reviewed

## Key Insights
- Claude Haiku 4.5 model id `claude-haiku-4-5-20251001`. Low latency ~1-2s, cost ~$0.001/call.
- Cache 1h trong `RecommendationCache` (per user) tránh gọi LLM mỗi pageload.
- Fallback rule-based: top-rated APPROVED courses trong categories user đã enroll, exclude already-enrolled.
- LLM response phải structured JSON → prompt yêu cầu schema rõ + zod validate.
- `getSimilarCourses` cho detail page = rule-based only (cùng category + top rating). Tiết kiệm LLM call.
- `ANTHROPIC_API_KEY` optional — check `process.env.ANTHROPIC_API_KEY` early → branch fallback.
- Server-only module — guard `"server-only"` import; never import from client component.

## Pre-requisites & Existing Code Refactor

### Schema changes
- 1 migration `recommendation_cache`:
  - New `RecommendationCache` (id, userId UNIQUE FK to User, courseIds String (JSON stringified array), reasoning String, generatedAt DateTime) + relation User.
- No backfill needed.

### Files to modify (existing)
| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add RecommendationCache model + User.recommendationCache relation |
| `.env.example` | Add `ANTHROPIC_API_KEY=` with comment "optional, fallback rule-based if missing" |
| `package.json` | `pnpm add @anthropic-ai/sdk` |
| `app/(student)/dashboard/page.tsx` | Embed `<RecommendationsSection />` near top (above enrolled courses) |
| `app/(public)/courses/[slug]/page.tsx` | Embed `<SimilarCourses courseId={course.id} />` at bottom |

### Files to create (new)
- `lib/ai/client.ts` — Anthropic SDK singleton (server only, `null` if no key)
- `lib/ai/prompts.ts` — `buildRecommendationPrompt(...)` Vietnamese template
- `lib/ai/schema.ts` — zod for LLM response `{ recommendations: [{ courseId, reason }], summary }`
- `lib/ai/fallback.ts` — pure Prisma rule-based recommendation
- `lib/ai/recommendations.ts` — main module: getPersonalizedRecommendations, getSimilarCourses, refreshRecommendations
- `lib/actions/recommendation.actions.ts` — `getRecommendations()`, `refreshRecommendations()` Server Actions
- `components/dashboard/RecommendationsSection.tsx` — 3 cards + reasoning tooltip + refresh button (client wrapper)
- `components/courses/SimilarCourses.tsx` — 3 cards at bottom of detail page
- `prisma/migrations/<ts>_recommendation_cache/migration.sql`

## Requirements
1. Install `@anthropic-ai/sdk`.
2. New `RecommendationCache` table.
3. `lib/ai/recommendations.ts` với 3 exports.
4. Cache TTL 1h.
5. Use model `claude-haiku-4-5-20251001`.
6. Prompt Vietnamese context.
7. Dashboard "Đề xuất cho bạn" 3 cards + reasoning tooltip.
8. Detail page bottom "Khóa học tương tự" 3 cards (rule-based).
9. "Làm mới" button → refresh action.
10. Fallback: no API key OR API throws → rule-based.

## Architecture

**Cache strategy:**
```
getPersonalizedRecommendations(userId):
  cache = db.recommendationCache.findUnique({ where: { userId } })
  if cache && (now - cache.generatedAt) < 1h: return parsed
  else: build context → call LLM (or fallback) → upsert cache → return
```

**Prompt (Vietnamese):**
```
System: Bạn là chuyên gia gợi ý khóa học cho nền tảng Eduta.
Trả lời CHỈ JSON đúng schema { "recommendations": [{ "courseId": string, "reason": string }], "summary": string }.
No prose outside JSON.

User context:
- Đã đăng ký: [titles + categories + user ratings]
- Hoạt động gần: [last 5 enrollment timestamps]

Available courses (chưa đăng ký):
[{ id, title, category, avgRating, description (truncated 200) }]

Hãy chọn TOP <N> phù hợp, mỗi khóa kèm "reason" (1 câu < 30 từ). Cuối "summary" 1 câu.
```

**Fallback rule-based:**
```
1. Lấy categories từ user enrollments.
2. Query APPROVED courses where category IN categories AND NOT enrolled by user, orderBy avgRating desc, limit N.
3. If empty → top APPROVED globally by avgRating.
4. reasoning = "Dựa trên các chủ đề bạn đã học (rule-based, AI chưa cấu hình)".
```

**Dashboard flow:**
```
Server Component dashboard → getPersonalizedRecommendations(session.user.id)
  → cache fresh? return : else
  → fetch context + available courses
  → if ANTHROPIC_API_KEY: call Claude → parse JSON → cache → return
  → else / on error: fallback → cache → return
  → hydrate Course details → render cards
```

## Related code files

**Create:**
- `lib/ai/client.ts`
- `lib/ai/recommendations.ts`
- `lib/ai/prompts.ts`
- `lib/ai/schema.ts`
- `lib/ai/fallback.ts`
- `lib/actions/recommendation.actions.ts`
- `components/dashboard/RecommendationsSection.tsx`
- `components/courses/SimilarCourses.tsx`
- `prisma/migrations/<ts>_recommendation_cache/migration.sql`

**Modify:**
- `prisma/schema.prisma`
- `.env.example`
- `package.json`
- `app/(student)/dashboard/page.tsx`
- `app/(public)/courses/[slug]/page.tsx`

## Implementation Steps
1. `pnpm add @anthropic-ai/sdk`.
2. Update schema: add `RecommendationCache` + User relation.
3. Migration `pnpm prisma migrate dev --name recommendation_cache`.
4. Update `.env.example` — `ANTHROPIC_API_KEY=` (optional).
5. Build `lib/ai/client.ts` singleton (`null` if no key).
6. Build `lib/ai/schema.ts` — zod response schema.
7. Build `lib/ai/prompts.ts` — Vietnamese template.
8. Build `lib/ai/fallback.ts` — rule-based pure Prisma.
9. Build `lib/ai/recommendations.ts`:
   - `getPersonalizedRecommendations(userId, count=3)` with cache check + LLM/fallback chain.
   - `getSimilarCourses(courseId, count=3)` rule-based.
   - `refreshRecommendations(userId)` delete cache + re-call.
10. Build `lib/actions/recommendation.actions.ts` — wrap with `requireAuth`.
11. Build `RecommendationsSection`:
    - Server-rendered: fetch recommendations → hydrate course details via `findMany where: { id: { in: courseIds } }`.
    - Card grid 3 + small "i" tooltip showing reasoning.
    - "Làm mới" client button calling refresh action.
12. Build `SimilarCourses` server component for detail page.
13. Wire into dashboard + detail page.
14. Document API key setup in README (note Phase 12 deploy will update).
15. Test 3 scenarios: (a) no API key → fallback; (b) with API key → Claude responds, 2nd load cache hit; (c) invalid API key → caught silently, fallback runs.

## Todo list
- [ ] Step 1: install @anthropic-ai/sdk
- [ ] Step 2: schema RecommendationCache
- [ ] Step 3: migrate
- [ ] Step 4: .env.example update
- [ ] Step 5: lib/ai/client.ts singleton
- [ ] Step 6: zod response schema
- [ ] Step 7: Vietnamese prompt template
- [ ] Step 8: rule-based fallback
- [ ] Step 9: main recommendations module
- [ ] Step 10: Server Actions wrapper
- [ ] Step 11: RecommendationsSection component
- [ ] Step 12: SimilarCourses component
- [ ] Step 13: wire into pages
- [ ] Step 14: README API key doc
- [ ] Step 15: 3-scenario test

## Success Criteria
- Without API key: dashboard renders fallback recommendations (no error).
- With API key: first load calls Claude, second load within 1h hits cache (no API call).
- Reasoning tooltip shows Vietnamese sentence < 30 words.
- "Làm mới" forces fresh LLM call.
- Detail page bottom "Khóa học tương tự" shows 3 cards from same category (rule-based).
- Invalid API key → caught silently, fallback rendered, error logged server-side.
- Non-JSON LLM response → fallback (no UI crash).
- New user 0 enrollments → reasonable default (top-rated overall).

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| LLM returns non-JSON or wrong schema | Med | Med | zod parse + try/catch → fallback. Log raw response |
| API rate limit | Low | Med | Cache 1h limits volume |
| API key leak to client | Low | Critical | `lib/ai/*` guarded `"server-only"`; only imported in Server Components/Actions |
| Claude hallucinates non-existent courseId | Med | Low | Filter results: only courseIds existing in availableCourses |
| Refresh spam → cost | Med | Low | Server-side rate limit refresh action (max 5/user/hour, tracked in cache row updatedAt) |
| Stale cache after admin approves new courses | Low | Low | 1h TTL acceptable; admin no manual invalidate UI cho demo |
| Network timeout cold start | Med | Low | SDK timeout 15s + fallback on AbortError |

## Security Considerations
- `ANTHROPIC_API_KEY` server-only — never in `NEXT_PUBLIC_*`. Verify bundle doesn't leak.
- Recommendation Server Action requires `requireAuth()`.
- User context to LLM excludes PII: NO email/password/real name (send "Người dùng" generic + course titles + ratings).
- Cache `userId UNIQUE` — không leak recommendations of other users.
- Rate limit refresh action to prevent intentional cost burn.
- Log LLM cost estimate per call to server console (Phase 11 admin analytics can aggregate later).
- Reasoning text from LLM → React auto-escape (plain text render).

## Next steps
→ [Phase 10 — File Attachments](./phase-10-file-attachments.md)

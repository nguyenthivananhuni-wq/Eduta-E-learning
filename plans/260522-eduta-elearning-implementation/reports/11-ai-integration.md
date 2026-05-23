# Report 11 — AI Integration (Claude API)

> **NOTE (2026-05-23):** Phase renumbered. This report now serves **[Phase 09 — AI Recommendation](../phase-09-ai-recommendation.md)** (was Phase 11). See [BRAINSTORM_DECISIONS.md](../BRAINSTORM_DECISIONS.md).

Architecture + prompt template + cost + fallback strategy for Phase 09 personalized recommendations (formerly Phase 11).

## Architecture overview

```
┌───────────────────────┐
│  Server Component     │
│  /dashboard           │
└──────────┬────────────┘
           │ getRecommendations()
           ▼
┌──────────────────────────────────────────────┐
│ lib/actions/recommendation.actions.ts (RSC)  │
└──────────┬───────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────┐
│ lib/ai/recommendations.ts                  │
│  - check RecommendationCache (1h TTL)      │
│  - fetch user context (enrollments + reviews) │
│  - fetch available courses                 │
│  - branch:                                  │
│     - claude !== null → LLM path           │
│     - else → fallback                      │
│  - parse + validate JSON via zod           │
│  - upsert cache                            │
└──────────┬──────────────┬─────────────────┘
           │              │
           ▼              ▼
┌────────────────┐  ┌──────────────────┐
│ lib/ai/client  │  │ lib/ai/fallback  │
│ Anthropic SDK  │  │ Rule-based logic │
└────────────────┘  └──────────────────┘
```

## Files layout

```
lib/ai/
├── client.ts         # Anthropic SDK singleton or null
├── recommendations.ts # main entrypoint
├── prompts.ts        # Vietnamese prompt builders
├── schema.ts         # zod schemas for LLM response
└── fallback.ts       # rule-based recommender
```

## Client singleton (`lib/ai/client.ts`)

```ts
import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;

export const claude = apiKey
  ? new Anthropic({ apiKey })
  : null;

export const CLAUDE_MODEL = "claude-haiku-4-5-20251001";
```

> Server-only. NEVER import from a `"use client"` file.

## Prompt template (`lib/ai/prompts.ts`)

### System prompt
```
Bạn là chuyên gia gợi ý khóa học cho nền tảng học trực tuyến Eduta tại Việt Nam.
Nhiệm vụ: phân tích sở thích người học (qua khóa đã đăng ký, điểm đánh giá) và đề xuất khóa học phù hợp.

QUY TẮC TRẢ LỜI:
1. CHỈ trả về JSON đúng schema bên dưới, KHÔNG kèm văn bản nào khác.
2. courseId PHẢI nằm trong danh sách "Khóa học có sẵn".
3. Trường "reason" tiếng Việt, < 30 từ, lý do vì sao gợi ý khóa này.
4. Trường "summary" tiếng Việt, < 50 từ, tổng kết phong cách học của người dùng.

JSON schema:
{
  "recommendations": [
    { "courseId": "string", "reason": "string" }
  ],
  "summary": "string"
}
```

### User prompt builder
```ts
buildUserPrompt({
  userEnrollments,    // [{ title, category, rating? }]
  availableCourses,   // [{ id, title, category, avgRating, description }]
  count               // 3
})
```

Returns:
```
Bối cảnh người dùng:
Khóa đã đăng ký ({n} khóa):
- "Tiếng Anh 10 — Global Success" (Ngoại ngữ), đánh giá: 5/5
- "JavaScript căn bản" (Lập trình), chưa đánh giá

Khóa học có sẵn (chưa đăng ký):
[
  { "id": "ck...", "title": "...", "category": "...", "avgRating": 4.3, "description": "..." },
  ...
]

Hãy chọn TOP 3 khóa học phù hợp nhất với người này.
```

## Response schema (`lib/ai/schema.ts`)

```ts
import { z } from "zod";

export const llmResponseSchema = z.object({
  recommendations: z.array(
    z.object({
      courseId: z.string(),
      reason: z.string().min(5).max(200),
    })
  ).min(1).max(10),
  summary: z.string().min(5).max(300),
});

export type LLMResponse = z.infer<typeof llmResponseSchema>;
```

## Example LLM response

```json
{
  "recommendations": [
    {
      "courseId": "cln1234abc",
      "reason": "Bạn thích Ngoại ngữ; khóa này tiếp nối trình độ tiếng Anh hiện tại."
    },
    {
      "courseId": "cln5678def",
      "reason": "Khóa Lập trình nhập môn, kết nối tốt với JS căn bản bạn đã học."
    },
    {
      "courseId": "cln9012ghi",
      "reason": "Đánh giá cao 4.8/5, phù hợp với người mới bắt đầu thiết kế."
    }
  ],
  "summary": "Người học đa lĩnh vực, ưu tiên nội dung tiếng Anh và công nghệ căn bản, thích khóa có rating cao."
}
```

## Main function (`lib/ai/recommendations.ts`)

```ts
export async function getPersonalizedRecommendations(
  userId: string,
  count: number = 3
): Promise<{ courseIds: string[]; reasoning: string }> {
  // 1. Cache check
  const cache = await db.recommendationCache.findUnique({ where: { userId } });
  if (cache && (Date.now() - cache.generatedAt.getTime()) < 3600_000) {
    return {
      courseIds: JSON.parse(cache.courseIds),
      reasoning: cache.reasoning,
    };
  }

  // 2. Build context
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: { course: { select: { title: true, category: true } } },
  });
  const reviews = await db.review.findMany({ where: { userId }, select: { courseId: true, rating: true } });
  const enrolledIds = enrollments.map(e => e.courseId);

  // 3. Available courses
  const available = await db.course.findMany({
    where: { status: "APPROVED", id: { notIn: enrolledIds } },
    select: { id: true, title: true, category: true, avgRating: true, description: true },
    take: 50, // limit context size
  });

  if (available.length === 0) {
    return { courseIds: [], reasoning: "Bạn đã đăng ký tất cả khóa hiện có." };
  }

  // 4. LLM or fallback
  if (claude) {
    try {
      const userContext = enrollments.map(e => ({
        title: e.course.title,
        category: e.course.category,
        rating: reviews.find(r => r.courseId === e.courseId)?.rating,
      }));
      const response = await claude.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: buildUserPrompt({ userEnrollments: userContext, availableCourses: available, count }),
        }],
      });
      const text = response.content[0].type === "text" ? response.content[0].text : "";
      const parsed = llmResponseSchema.parse(JSON.parse(text));
      // sanity: filter hallucinated courseIds
      const validIds = new Set(available.map(c => c.id));
      const courseIds = parsed.recommendations
        .map(r => r.courseId)
        .filter(id => validIds.has(id))
        .slice(0, count);
      const reasoning = parsed.summary;
      // upsert cache
      await db.recommendationCache.upsert({
        where: { userId },
        create: { userId, courseIds: JSON.stringify(courseIds), reasoning, generatedAt: new Date() },
        update: { courseIds: JSON.stringify(courseIds), reasoning, generatedAt: new Date() },
      });
      return { courseIds, reasoning };
    } catch (err) {
      console.error("[AI] LLM failed, falling back:", err);
      // fall through to fallback
    }
  }

  // 5. Fallback
  return fallbackRecommendations(userId, enrollments, available, count);
}
```

## Fallback (`lib/ai/fallback.ts`)

```ts
export async function fallbackRecommendations(
  userId: string,
  enrollments: { course: { category: string } }[],
  available: { id: string; category: string; avgRating: number | null }[],
  count: number
): Promise<{ courseIds: string[]; reasoning: string }> {
  const userCategories = new Set(enrollments.map(e => e.course.category));

  // Score: in-category + avgRating
  const scored = available
    .map(c => ({
      id: c.id,
      score: (userCategories.has(c.category) ? 100 : 0) + (c.avgRating ?? 0) * 10,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);

  const courseIds = scored.map(s => s.id);
  const reasoning = userCategories.size > 0
    ? `Dựa trên các chủ đề bạn đã học (${[...userCategories].join(", ")}) và đánh giá cao nhất.`
    : "Gợi ý khóa học phổ biến nhất hiện nay.";

  await db.recommendationCache.upsert({
    where: { userId },
    create: { userId, courseIds: JSON.stringify(courseIds), reasoning, generatedAt: new Date() },
    update: { courseIds: JSON.stringify(courseIds), reasoning, generatedAt: new Date() },
  });
  return { courseIds, reasoning };
}
```

## Cost estimate

| Component                      | Tokens (input) | Tokens (output) | Cost per call |
|--------------------------------|----------------|-----------------|---------------|
| System prompt                  | ~150           | -               | -             |
| User context + courses (50)    | ~1500          | -               | -             |
| Output (3 recs + summary)      | -              | ~200            | -             |
| **Total per call**             | **~1650 in**   | **~200 out**    | **~$0.0013**  |

Claude Haiku 4.5 pricing (approx):
- Input: $0.80 / 1M tokens
- Output: $4.00 / 1M tokens
- Per call: (1650 × 0.0000008) + (200 × 0.000004) = $0.00132 + $0.0008 = **~$0.002**

With 1h cache: ~24 calls/user/day max. For 100 users → ~2400/day → ~$5/month. For đồ án demo: pocket change.

## Env setup

`.env.example` addition:
```
# AI Recommendation (optional)
# Get key at https://console.anthropic.com
ANTHROPIC_API_KEY=
```

If absent → fallback always used. Document in README.

## Failure modes + behavior

| Failure                                       | Behavior                                          |
|-----------------------------------------------|---------------------------------------------------|
| `ANTHROPIC_API_KEY` empty                     | Skip LLM, use fallback                            |
| Network timeout (>15s)                        | AbortError caught, fallback                       |
| Rate limit 429                                | Caught, fallback for this call (cache still 1h)   |
| Invalid API key 401                           | Caught + console.error, fallback                  |
| JSON parse error from response                | Caught + console.error, fallback                  |
| zod schema mismatch                           | Caught, fallback                                  |
| Hallucinated courseId not in available list   | Filtered out before saving                        |
| All available filtered out                    | Empty array, reasoning="Đã đăng ký hết"          |
| Refresh action called >5x/hour                | Reject with "Bạn đã refresh quá nhiều lần"        |

## Observability (minimum)

- Console log on every cache miss + LLM call.
- Console log on every fallback trigger with reason.
- (Future) Phase 13 analytics: count LLM calls + cost per day, surface in admin dashboard.

## Security recap

1. API key server-only (`ANTHROPIC_API_KEY`, NO `NEXT_PUBLIC_` prefix).
2. `lib/ai/*` files only imported in `"use server"` modules + Server Components.
3. User context sent to Claude: NO email, NO password, NO real name. Only course titles + ratings + categories.
4. Cache `courseIds` stored as JSON string (SQLite no JSON type).
5. Refresh throttle prevents intentional cost burn.
6. Hallucinated IDs filtered against available list → no UI render of fake courses.

## Future enhancements (out of scope for Phase 11)

- Per-lesson recommendation ("vì bạn học bài X, gợi ý bài Y").
- AI tutor chat (Claude conversation in lesson sidebar).
- AI quiz generator from lesson content.
- Admin dashboard for AI cost tracking.
- Embedding-based similarity (alternative to LLM, lower latency).

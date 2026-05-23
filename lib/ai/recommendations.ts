import "server-only";
import { db } from "@/lib/db";
import { getAnthropic, CLAUDE_MODEL } from "./client";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts";
import { recommendationResponseSchema, type RecommendationResponse } from "./schema";
import { buildFallbackRecommendations } from "./fallback";

const CACHE_TTL_MS = 60 * 60 * 1000;
const REFRESH_WINDOW_MS = 60 * 60 * 1000;
const REFRESH_LIMIT_PER_WINDOW = 5;
const LLM_TIMEOUT_MS = 15_000;
const LLM_MAX_TOKENS = 1024;

type Source = "claude" | "fallback";

type StoredCache = {
  recommendations: RecommendationResponse["recommendations"];
  summary: string;
  source: Source;
  generatedAt: Date;
};

function isFresh(date: Date): boolean {
  return Date.now() - date.getTime() < CACHE_TTL_MS;
}

async function readCache(userId: string): Promise<StoredCache | null> {
  const row = await db.recommendationCache.findUnique({ where: { userId } });
  if (!row) return null;
  try {
    const courseIds = JSON.parse(row.courseIds) as string[];
    const reasoning = JSON.parse(row.reasoningJson) as Record<string, string>;
    return {
      recommendations: courseIds.map((id) => ({
        courseId: id,
        reason: reasoning[id] ?? "",
      })),
      summary: row.summary,
      source: row.source as Source,
      generatedAt: row.generatedAt,
    };
  } catch {
    return null;
  }
}

async function writeCache(
  userId: string,
  data: RecommendationResponse,
  source: Source
) {
  const courseIds = data.recommendations.map((r) => r.courseId);
  const reasoning = Object.fromEntries(
    data.recommendations.map((r) => [r.courseId, r.reason])
  );
  await db.recommendationCache.upsert({
    where: { userId },
    update: {
      courseIds: JSON.stringify(courseIds),
      reasoningJson: JSON.stringify(reasoning),
      summary: data.summary,
      source,
      generatedAt: new Date(),
    },
    create: {
      userId,
      courseIds: JSON.stringify(courseIds),
      reasoningJson: JSON.stringify(reasoning),
      summary: data.summary,
      source,
      refreshWindow: new Date(),
    },
  });
}

async function callClaude(
  userId: string,
  count: number
): Promise<RecommendationResponse | null> {
  const client = getAnthropic();
  if (!client) return null;

  // Build context
  const [enrollments, available] = await Promise.all([
    db.enrollment.findMany({
      where: { userId },
      orderBy: { enrolledAt: "desc" },
      take: 10,
      select: {
        course: {
          select: { id: true, title: true, category: true },
        },
      },
    }),
    db.course.findMany({
      where: {
        status: "APPROVED",
        enrollments: { none: { userId } },
      },
      orderBy: [
        { avgRating: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take: 20,
      select: {
        id: true,
        title: true,
        category: true,
        description: true,
        avgRating: true,
      },
    }),
  ]);

  if (available.length === 0) return null;

  // Pull user's ratings for enrolled courses
  const ratingRows = await db.review.findMany({
    where: { userId, courseId: { in: enrollments.map((e) => e.course.id) } },
    select: { courseId: true, rating: true },
  });
  const ratingMap = new Map(ratingRows.map((r) => [r.courseId, r.rating]));

  const userPrompt = buildUserPrompt({
    enrolledCourses: enrollments.map((e) => ({
      title: e.course.title,
      category: e.course.category,
      rating: ratingMap.get(e.course.id) ?? null,
    })),
    availableCourses: available,
    count,
  });

  const availableIdSet = new Set(available.map((c) => c.id));

  try {
    const response = await client.messages.create(
      {
        model: CLAUDE_MODEL,
        max_tokens: LLM_MAX_TOKENS,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      },
      { timeout: LLM_TIMEOUT_MS }
    );

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;
    const raw = textBlock.text.trim();

    // Strip code fences if Claude added any (shouldn't happen per prompt, but defensive)
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    const json = JSON.parse(cleaned);
    const parsed = recommendationResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.warn("[ai] Claude response failed schema validation", parsed.error.issues);
      return null;
    }

    const filtered = parsed.data.recommendations.filter((r) =>
      availableIdSet.has(r.courseId)
    );
    if (filtered.length === 0) return null;

    return {
      recommendations: filtered.slice(0, count),
      summary: parsed.data.summary,
    };
  } catch (e) {
    console.warn("[ai] Claude call failed:", (e as Error).message);
    return null;
  }
}

export type ResolvedRecommendation = {
  courseId: string;
  reason: string;
  course: {
    id: string;
    slug: string;
    title: string;
    description: string;
    thumbnail: string;
    category: string;
    price: number;
    avgRating: number | null;
    reviewCount: number;
    _count: { modules: number; enrollments: number };
  };
};

export type RecommendationsResult = {
  items: ResolvedRecommendation[];
  summary: string;
  source: Source;
  generatedAt: Date;
};

async function hydrateRecommendations(
  data: RecommendationResponse
): Promise<ResolvedRecommendation[]> {
  const ids = data.recommendations.map((r) => r.courseId);
  if (ids.length === 0) return [];
  const courses = await db.course.findMany({
    where: { id: { in: ids }, status: "APPROVED" },
    include: { _count: { select: { modules: true, enrollments: true } } },
  });
  const byId = new Map(courses.map((c) => [c.id, c]));
  return data.recommendations
    .filter((r) => byId.has(r.courseId))
    .map((r) => ({ courseId: r.courseId, reason: r.reason, course: byId.get(r.courseId)! }));
}

export async function getPersonalizedRecommendations(
  userId: string,
  count = 3
): Promise<RecommendationsResult> {
  const cached = await readCache(userId);
  if (cached && isFresh(cached.generatedAt)) {
    const items = await hydrateRecommendations({
      recommendations: cached.recommendations,
      summary: cached.summary,
    });
    return {
      items,
      summary: cached.summary,
      source: cached.source,
      generatedAt: cached.generatedAt,
    };
  }

  // Try LLM first
  const fromClaude = await callClaude(userId, count);
  const data = fromClaude ?? (await buildFallbackRecommendations(userId, count));
  const source: Source = fromClaude ? "claude" : "fallback";

  await writeCache(userId, data, source);

  const items = await hydrateRecommendations(data);
  return {
    items,
    summary: data.summary,
    source,
    generatedAt: new Date(),
  };
}

export async function refreshRecommendations(
  userId: string,
  count = 3
): Promise<{ ok: true; result: RecommendationsResult } | { ok: false; error: string }> {
  const existing = await db.recommendationCache.findUnique({
    where: { userId },
    select: { refreshCount: true, refreshWindow: true },
  });

  let nextCount = 1;
  let nextWindow = new Date();
  if (existing) {
    const windowExpired =
      Date.now() - existing.refreshWindow.getTime() > REFRESH_WINDOW_MS;
    if (windowExpired) {
      nextCount = 1;
      nextWindow = new Date();
    } else {
      if (existing.refreshCount >= REFRESH_LIMIT_PER_WINDOW) {
        return {
          ok: false,
          error: "Bạn đã làm mới quá nhiều lần. Vui lòng thử lại sau 1 giờ.",
        };
      }
      nextCount = existing.refreshCount + 1;
      nextWindow = existing.refreshWindow;
    }
  }

  await db.recommendationCache.upsert({
    where: { userId },
    update: { refreshCount: nextCount, refreshWindow: nextWindow, generatedAt: new Date(0) },
    create: {
      userId,
      courseIds: "[]",
      reasoningJson: "{}",
      summary: "",
      source: "fallback",
      refreshCount: nextCount,
      refreshWindow: nextWindow,
      generatedAt: new Date(0),
    },
  });

  const result = await getPersonalizedRecommendations(userId, count);
  return { ok: true, result };
}

export async function getSimilarCourses(courseId: string, count = 3) {
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, category: true },
  });
  if (!course) return [];

  let candidates = await db.course.findMany({
    where: {
      status: "APPROVED",
      id: { not: courseId },
      category: course.category,
    },
    orderBy: [
      { avgRating: { sort: "desc", nulls: "last" } },
      { enrollments: { _count: "desc" } },
      { createdAt: "desc" },
    ],
    take: count,
    include: { _count: { select: { modules: true, enrollments: true } } },
  });

  if (candidates.length < count) {
    const needed = count - candidates.length;
    const skip = [courseId, ...candidates.map((c) => c.id)];
    const extra = await db.course.findMany({
      where: {
        status: "APPROVED",
        id: { notIn: skip },
      },
      orderBy: [
        { avgRating: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take: needed,
      include: { _count: { select: { modules: true, enrollments: true } } },
    });
    candidates = [...candidates, ...extra];
  }

  return candidates;
}

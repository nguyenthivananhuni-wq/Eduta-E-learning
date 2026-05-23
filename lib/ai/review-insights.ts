import "server-only";
import { db } from "@/lib/db";
import { getAnthropic, CLAUDE_MODEL } from "./client";
import { INSIGHT_SYSTEM_PROMPT, buildInsightUserPrompt } from "./insight-prompts";
import {
  insightResponseSchema,
  normalizeTopics,
  type InsightResponse,
} from "./insight-schema";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const LLM_TIMEOUT_MS = 15_000;
const LLM_MAX_TOKENS = 800;
const REVIEW_LIMIT = 50;
const MIN_REVIEWS_FOR_INSIGHT = 3;

export type ResolvedInsight = {
  pros: string[];
  cons: string[];
  topics: string[];
  sentiment: "positive" | "mixed" | "negative";
  summary: string;
  sampleSize: number;
  source: "claude" | "fallback";
  generatedAt: Date;
};

function isFresh(date: Date): boolean {
  return Date.now() - date.getTime() < CACHE_TTL_MS;
}

async function readCache(courseId: string): Promise<ResolvedInsight | null> {
  const row = await db.reviewInsight.findUnique({ where: { courseId } });
  if (!row) return null;
  try {
    return {
      pros: JSON.parse(row.prosJson),
      cons: JSON.parse(row.consJson),
      topics: JSON.parse(row.topicsJson),
      sentiment: row.sentiment as ResolvedInsight["sentiment"],
      summary: row.summary,
      sampleSize: row.sampleSize,
      source: row.source as ResolvedInsight["source"],
      generatedAt: row.generatedAt,
    };
  } catch {
    return null;
  }
}

async function writeCache(
  courseId: string,
  data: InsightResponse,
  sampleSize: number,
  source: "claude" | "fallback"
) {
  await db.reviewInsight.upsert({
    where: { courseId },
    update: {
      prosJson: JSON.stringify(data.pros),
      consJson: JSON.stringify(data.cons),
      topicsJson: JSON.stringify(data.topics),
      sentiment: data.sentiment,
      summary: data.summary,
      sampleSize,
      source,
      generatedAt: new Date(),
    },
    create: {
      courseId,
      prosJson: JSON.stringify(data.pros),
      consJson: JSON.stringify(data.cons),
      topicsJson: JSON.stringify(data.topics),
      sentiment: data.sentiment,
      summary: data.summary,
      sampleSize,
      source,
    },
  });
}

async function callClaudeInsight(args: {
  courseTitle: string;
  courseDescription: string;
  reviews: { rating: number; comment: string }[];
}): Promise<InsightResponse | null> {
  const client = getAnthropic();
  if (!client) return null;

  const userPrompt = buildInsightUserPrompt(args);

  try {
    const response = await client.messages.create(
      {
        model: CLAUDE_MODEL,
        max_tokens: LLM_MAX_TOKENS,
        system: INSIGHT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      },
      { timeout: LLM_TIMEOUT_MS }
    );

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") return null;

    const raw = textBlock.text.trim();
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();

    const json = JSON.parse(cleaned);
    const parsed = insightResponseSchema.safeParse(json);
    if (!parsed.success) {
      console.warn("[ai-insight] response failed schema", parsed.error.issues);
      return null;
    }

    return {
      ...parsed.data,
      topics: normalizeTopics(parsed.data.topics),
    };
  } catch (e) {
    console.warn("[ai-insight] Claude call failed:", (e as Error).message);
    return null;
  }
}

/**
 * Returns parsed insight for a course. Null when:
 * - Fewer than MIN_REVIEWS_FOR_INSIGHT reviews exist
 * - No ANTHROPIC_API_KEY configured AND no cached insight
 * - LLM call failed AND no cached insight
 *
 * Cache TTL 24h. Caller can force refresh by deleting the row first.
 */
export async function getReviewInsight(
  courseId: string
): Promise<ResolvedInsight | null> {
  const cached = await readCache(courseId);
  if (cached && isFresh(cached.generatedAt)) return cached;

  const reviewCount = await db.review.count({ where: { courseId } });
  if (reviewCount < MIN_REVIEWS_FOR_INSIGHT) {
    // Not enough data — skip LLM, return stale cache if exists else null
    return cached;
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { title: true, description: true },
  });
  if (!course) return cached;

  const reviews = await db.review.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    take: REVIEW_LIMIT,
    select: { rating: true, comment: true },
  });

  const result = await callClaudeInsight({
    courseTitle: course.title,
    courseDescription: course.description,
    reviews,
  });

  if (!result) {
    // LLM unavailable or failed — return stale cache if any, else null
    return cached;
  }

  await writeCache(courseId, result, reviews.length, "claude");
  return {
    ...result,
    sampleSize: reviews.length,
    source: "claude",
    generatedAt: new Date(),
  };
}

export async function invalidateCourseInsight(courseId: string): Promise<void> {
  await db.reviewInsight.deleteMany({ where: { courseId } });
}

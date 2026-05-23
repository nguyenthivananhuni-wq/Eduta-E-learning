import "server-only";
import { db } from "@/lib/db";
import type { RecommendationResponse } from "./schema";

const FALLBACK_REASON_TEMPLATE =
  "Khóa học chất lượng cao trong chủ đề bạn quan tâm.";
const FALLBACK_DEFAULT_REASON =
  "Khóa học phổ biến được nhiều học viên đánh giá tốt.";
const FALLBACK_SUMMARY_WITH_HISTORY =
  "Gợi ý dựa trên lịch sử học của bạn (cấu hình API Claude để có gợi ý cá nhân hóa sâu hơn).";
const FALLBACK_SUMMARY_NEW_USER =
  "Bắt đầu với những khóa được đánh giá cao nhất trên Eduta.";

export async function buildFallbackRecommendations(
  userId: string,
  count = 3
): Promise<RecommendationResponse> {
  const enrolled = await db.enrollment.findMany({
    where: { userId },
    select: { courseId: true, course: { select: { category: true } } },
  });
  const enrolledIds = enrolled.map((e) => e.courseId);
  const enrolledCategories = Array.from(
    new Set(enrolled.map((e) => e.course.category).filter(Boolean))
  );

  // First pass: same categories as user history, exclude enrolled
  let candidates = enrolledCategories.length
    ? await db.course.findMany({
        where: {
          status: "APPROVED",
          category: { in: enrolledCategories },
          id: { notIn: enrolledIds },
        },
        orderBy: [
          { avgRating: { sort: "desc", nulls: "last" } },
          { createdAt: "desc" },
        ],
        take: count,
        select: { id: true, category: true, avgRating: true },
      })
    : [];

  // Pad with globally top-rated if needed
  if (candidates.length < count) {
    const needed = count - candidates.length;
    const skipIds = [...enrolledIds, ...candidates.map((c) => c.id)];
    const extra = await db.course.findMany({
      where: {
        status: "APPROVED",
        id: { notIn: skipIds },
      },
      orderBy: [
        { avgRating: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
      take: needed,
      select: { id: true, category: true, avgRating: true },
    });
    candidates = [...candidates, ...extra];
  }

  return {
    recommendations: candidates.map((c) => ({
      courseId: c.id,
      reason: enrolledCategories.includes(c.category)
        ? FALLBACK_REASON_TEMPLATE
        : FALLBACK_DEFAULT_REASON,
    })),
    summary: enrolledCategories.length
      ? FALLBACK_SUMMARY_WITH_HISTORY
      : FALLBACK_SUMMARY_NEW_USER,
  };
}

import "server-only";
import { db } from "@/lib/db";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type RatingDistribution = {
  counts: Record<1 | 2 | 3 | 4 | 5, number>;
  total: number;
  positivePercent: number;
};

export async function getRatingDistribution(
  courseId: string
): Promise<RatingDistribution> {
  const grouped = await db.review.groupBy({
    by: ["rating"],
    where: { courseId },
    _count: { id: true },
  });

  const counts: RatingDistribution["counts"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  for (const row of grouped) {
    const r = row.rating as 1 | 2 | 3 | 4 | 5;
    if (r >= 1 && r <= 5) {
      counts[r] = row._count.id;
      total += row._count.id;
    }
  }

  const positive = counts[4] + counts[5];
  const positivePercent = total === 0 ? 0 : Math.round((positive / total) * 100);

  return { counts, total, positivePercent };
}

export type RatingTrend = {
  recentAvg: number | null;
  recentCount: number;
  diffFromOverall: number | null;
};

export async function getRatingTrend(
  courseId: string,
  days = 30
): Promise<RatingTrend> {
  const since = new Date(Date.now() - days * ONE_DAY_MS);

  const [recent, overall] = await Promise.all([
    db.review.aggregate({
      where: { courseId, createdAt: { gte: since } },
      _avg: { rating: true },
      _count: { id: true },
    }),
    db.review.aggregate({
      where: { courseId },
      _avg: { rating: true },
    }),
  ]);

  const recentAvg = recent._avg.rating;
  const overallAvg = overall._avg.rating;
  const diff = recentAvg != null && overallAvg != null ? recentAvg - overallAvg : null;

  return {
    recentAvg,
    recentCount: recent._count.id,
    diffFromOverall: diff,
  };
}

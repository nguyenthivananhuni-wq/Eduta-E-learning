import "server-only";
import { db } from "@/lib/db";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type DailyRevenuePoint = {
  date: string; // ISO yyyy-mm-dd
  shortLabel: string; // e.g. "12/05"
  amount: number;
};

export async function getInstructorRevenueTrend(
  instructorId: string,
  days = 30
): Promise<DailyRevenuePoint[]> {
  const since = new Date(Date.now() - days * ONE_DAY_MS);
  const txs = await db.transaction.findMany({
    where: {
      userId: instructorId,
      type: "EARNING",
      status: "COMPLETED",
      createdAt: { gte: since },
    },
    select: { amount: true, createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * ONE_DAY_MS);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const t of txs) {
    const key = t.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + t.amount);
    }
  }

  return Array.from(buckets.entries()).map(([date, amount]) => ({
    date,
    shortLabel: date.slice(5).replace("-", "/"),
    amount,
  }));
}

export type CourseRevenueRow = {
  courseId: string;
  title: string;
  slug: string;
  revenue: number;
};

export async function getRevenueByOwnCourse(
  instructorId: string,
  limit = 5
): Promise<CourseRevenueRow[]> {
  const ownCourses = await db.course.findMany({
    where: { instructorId },
    select: { id: true, title: true, slug: true },
  });
  if (ownCourses.length === 0) return [];

  const courseIds = ownCourses.map((c) => c.id);
  const grouped = await db.transaction.groupBy({
    by: ["courseId"],
    where: {
      userId: instructorId,
      type: "EARNING",
      status: "COMPLETED",
      courseId: { in: courseIds },
    },
    _sum: { amount: true },
  });

  const byId = new Map(ownCourses.map((c) => [c.id, c]));
  const rows: CourseRevenueRow[] = [];
  for (const g of grouped) {
    if (!g.courseId) continue;
    const c = byId.get(g.courseId);
    if (!c) continue;
    rows.push({
      courseId: c.id,
      title: c.title,
      slug: c.slug,
      revenue: g._sum.amount ?? 0,
    });
  }
  // Include 0-revenue own courses for full visibility
  for (const c of ownCourses) {
    if (!rows.find((r) => r.courseId === c.id)) {
      rows.push({ courseId: c.id, title: c.title, slug: c.slug, revenue: 0 });
    }
  }
  rows.sort((a, b) => b.revenue - a.revenue);
  return rows.slice(0, limit);
}

export type MonthlyDelta = {
  thisMonth: number;
  lastMonth: number;
  deltaPercent: number | null;
};

export async function getInstructorMonthlyEarningDelta(
  instructorId: string
): Promise<MonthlyDelta> {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisMonth, lastMonth] = await Promise.all([
    db.transaction.aggregate({
      where: {
        userId: instructorId,
        type: "EARNING",
        status: "COMPLETED",
        createdAt: { gte: startOfThisMonth },
      },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: {
        userId: instructorId,
        type: "EARNING",
        status: "COMPLETED",
        createdAt: { gte: startOfLastMonth, lt: startOfThisMonth },
      },
      _sum: { amount: true },
    }),
  ]);

  const t = thisMonth._sum.amount ?? 0;
  const l = lastMonth._sum.amount ?? 0;
  let deltaPercent: number | null = null;
  if (l > 0) {
    deltaPercent = Math.round(((t - l) / l) * 100);
  } else if (t > 0) {
    deltaPercent = null; // last month was 0, hide percent → just show "Mới"
  } else {
    deltaPercent = 0;
  }
  return { thisMonth: t, lastMonth: l, deltaPercent };
}

export type StudentDelta = {
  thisMonth: number;
  total: number;
};

export async function getInstructorStudentDelta(
  instructorId: string
): Promise<StudentDelta> {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [thisMonthCount, totalCount] = await Promise.all([
    db.enrollment.count({
      where: {
        course: { instructorId },
        enrolledAt: { gte: startOfThisMonth },
      },
    }),
    db.enrollment.count({
      where: { course: { instructorId } },
    }),
  ]);

  return { thisMonth: thisMonthCount, total: totalCount };
}

export async function getInstructorOverallAvgRating(
  instructorId: string
): Promise<{ avgRating: number | null; courseCount: number }> {
  const courses = await db.course.findMany({
    where: { instructorId, avgRating: { not: null }, reviewCount: { gt: 0 } },
    select: { avgRating: true, reviewCount: true },
  });
  if (courses.length === 0) {
    return { avgRating: null, courseCount: 0 };
  }
  // Weighted average: sum(avg * count) / sum(count)
  let weightedSum = 0;
  let totalReviews = 0;
  for (const c of courses) {
    weightedSum += (c.avgRating ?? 0) * c.reviewCount;
    totalReviews += c.reviewCount;
  }
  return {
    avgRating: totalReviews > 0 ? weightedSum / totalReviews : null,
    courseCount: courses.length,
  };
}

import "server-only";
import { db } from "@/lib/db";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function getRevenueTotal(): Promise<number> {
  const agg = await db.transaction.aggregate({
    where: { type: "PURCHASE", status: "COMPLETED" },
    _sum: { amount: true },
  });
  return Math.abs(agg._sum.amount ?? 0);
}

export async function getInstructorEarningsTotal(): Promise<number> {
  const agg = await db.transaction.aggregate({
    where: { type: "EARNING", status: "COMPLETED" },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

export async function getActiveUserCount(days = 30): Promise<number> {
  const since = new Date(Date.now() - days * ONE_DAY_MS);
  const rows = await db.lessonProgress.findMany({
    where: { completedAt: { gte: since } },
    select: { userId: true },
    distinct: ["userId"],
  });
  return rows.length;
}

export type TopCourseRow = {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  enrollments: number;
  avgRating: number | null;
};

export async function getTopCourses(limit = 5): Promise<TopCourseRow[]> {
  const grouped = await db.enrollment.groupBy({
    by: ["courseId"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  const courses = await db.course.findMany({
    where: { id: { in: grouped.map((g) => g.courseId) } },
    select: { id: true, slug: true, title: true, thumbnail: true, avgRating: true },
  });
  const byId = new Map(courses.map((c) => [c.id, c]));
  return grouped
    .map((g) => {
      const c = byId.get(g.courseId);
      if (!c) return null;
      return {
        ...c,
        enrollments: g._count.id,
      };
    })
    .filter((x): x is TopCourseRow => x != null);
}

export type TopInstructorRow = {
  id: string;
  name: string;
  email: string;
  earnings: number;
};

export async function getTopInstructors(limit = 5): Promise<TopInstructorRow[]> {
  const grouped = await db.transaction.groupBy({
    by: ["userId"],
    where: { type: "EARNING", status: "COMPLETED" },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });
  if (grouped.length === 0) return [];

  const users = await db.user.findMany({
    where: { id: { in: grouped.map((g) => g.userId) } },
    select: { id: true, name: true, email: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  return grouped
    .map((g) => {
      const u = byId.get(g.userId);
      if (!u) return null;
      return { ...u, earnings: g._sum.amount ?? 0 };
    })
    .filter((x): x is TopInstructorRow => x != null);
}

export type GrowthPoint = { date: string; count: number };

export async function getUserGrowth(days = 30): Promise<GrowthPoint[]> {
  const since = new Date(Date.now() - days * ONE_DAY_MS);
  const users = await db.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * ONE_DAY_MS);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  for (const u of users) {
    const key = u.createdAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

export async function getPendingReportsCount(): Promise<number> {
  return db.report.count({ where: { status: "PENDING" } });
}

export type DailyRevenuePoint = {
  date: string;
  shortLabel: string;
  amount: number;
};

export async function getPlatformRevenueTrend(days = 90): Promise<DailyRevenuePoint[]> {
  const since = new Date(Date.now() - days * ONE_DAY_MS);
  const txs = await db.transaction.findMany({
    where: {
      type: "PURCHASE",
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
      // Buyer amount is negative; aggregate by absolute value for platform revenue
      buckets.set(key, (buckets.get(key) ?? 0) + Math.abs(t.amount));
    }
  }

  return Array.from(buckets.entries()).map(([date, amount]) => ({
    date,
    shortLabel: date.slice(5).replace("-", "/"),
    amount,
  }));
}

export type CategoryRevenueRow = {
  category: string;
  revenue: number;
};

export async function getCategoryRevenue(): Promise<CategoryRevenueRow[]> {
  const grouped = await db.transaction.groupBy({
    by: ["courseId"],
    where: {
      type: "PURCHASE",
      status: "COMPLETED",
      courseId: { not: null },
    },
    _sum: { amount: true },
  });
  if (grouped.length === 0) return [];

  const courseIds = grouped
    .map((g) => g.courseId)
    .filter((id): id is string => id != null);
  const courses = await db.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, category: true },
  });
  const categoryById = new Map(courses.map((c) => [c.id, c.category]));

  const byCategory = new Map<string, number>();
  for (const g of grouped) {
    if (!g.courseId) continue;
    const cat = categoryById.get(g.courseId);
    if (!cat) continue;
    const amt = Math.abs(g._sum.amount ?? 0);
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + amt);
  }

  return Array.from(byCategory.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}

export type EnrollmentTrendPoint = {
  date: string;
  shortLabel: string;
  count: number;
};

export async function getPlatformEnrollmentTrend(
  days = 30
): Promise<EnrollmentTrendPoint[]> {
  const since = new Date(Date.now() - days * ONE_DAY_MS);
  const rows = await db.enrollment.findMany({
    where: { enrolledAt: { gte: since } },
    select: { enrolledAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * ONE_DAY_MS);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const key = r.enrolledAt.toISOString().slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({
    date,
    shortLabel: date.slice(5).replace("-", "/"),
    count,
  }));
}

export type ConversionMetrics = {
  totalStudents: number;
  payingCount: number;
  payingPercent: number;
  activeLearnersCount: number;
  activeLearnersPercent: number;
};

export async function getConversionMetrics(): Promise<ConversionMetrics> {
  const [totalStudents, payingCount, activeLearnersCount] = await Promise.all([
    db.user.count({ where: { role: "STUDENT" } }),
    db.user.count({
      where: {
        role: "STUDENT",
        transactions: { some: { type: "PURCHASE", status: "COMPLETED" } },
      },
    }),
    db.user.count({
      where: {
        role: "STUDENT",
        progress: { some: { completed: true } },
      },
    }),
  ]);

  return {
    totalStudents,
    payingCount,
    payingPercent: totalStudents > 0 ? (payingCount / totalStudents) * 100 : 0,
    activeLearnersCount,
    activeLearnersPercent:
      totalStudents > 0 ? (activeLearnersCount / totalStudents) * 100 : 0,
  };
}

import "server-only";
import { db } from "@/lib/db";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type CourseKpi = {
  enrollments: number;
  revenue: number;
  completionRate: number; // 0-100
  avgRating: number | null;
  reviewCount: number;
};

export async function getCourseKpi(courseId: string): Promise<CourseKpi> {
  const [enrollments, course, earningAgg, lessonCount, completedFinalCount] =
    await Promise.all([
      db.enrollment.count({ where: { courseId } }),
      db.course.findUnique({
        where: { id: courseId },
        select: { avgRating: true, reviewCount: true },
      }),
      db.transaction.aggregate({
        where: {
          courseId,
          type: "EARNING",
          status: "COMPLETED",
        },
        _sum: { amount: true },
      }),
      db.lesson.count({ where: { module: { courseId } } }),
      db.lessonProgress.count({
        where: {
          completed: true,
          lesson: { module: { courseId } },
        },
      }),
    ]);

  // Completion rate proxy = % of (enrolled * lessons) actually completed.
  // For demo this gives a single intuitive number.
  const totalSlots = enrollments * lessonCount;
  const completionRate =
    totalSlots > 0 ? Math.round((completedFinalCount / totalSlots) * 100) : 0;

  return {
    enrollments,
    revenue: earningAgg._sum.amount ?? 0,
    completionRate,
    avgRating: course?.avgRating ?? null,
    reviewCount: course?.reviewCount ?? 0,
  };
}

export type EnrollmentTrendPoint = {
  date: string;
  shortLabel: string;
  count: number;
};

export async function getCourseEnrollmentTrend(
  courseId: string,
  days = 30
): Promise<EnrollmentTrendPoint[]> {
  const since = new Date(Date.now() - days * ONE_DAY_MS);
  const rows = await db.enrollment.findMany({
    where: { courseId, enrolledAt: { gte: since } },
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

export type FunnelPoint = {
  lessonId: string;
  label: string;
  moduleTitle: string;
  completed: number;
  total: number;
  pct: number;
};

export async function getCourseCompletionFunnel(
  courseId: string
): Promise<FunnelPoint[]> {
  const enrolled = await db.enrollment.count({ where: { courseId } });
  if (enrolled === 0) return [];

  const lessons = await db.lesson.findMany({
    where: { module: { courseId } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    select: {
      id: true,
      title: true,
      order: true,
      module: { select: { title: true, order: true } },
    },
  });
  if (lessons.length === 0) return [];

  const lessonIds = lessons.map((l) => l.id);
  const completionCounts = await db.lessonProgress.groupBy({
    by: ["lessonId"],
    where: { lessonId: { in: lessonIds }, completed: true },
    _count: { id: true },
  });
  const countMap = new Map(completionCounts.map((c) => [c.lessonId, c._count.id]));

  return lessons.map((l, idx) => {
    const completed = countMap.get(l.id) ?? 0;
    return {
      lessonId: l.id,
      label: `${idx + 1}. ${l.title}`,
      moduleTitle: l.module.title,
      completed,
      total: enrolled,
      pct: enrolled > 0 ? (completed / enrolled) * 100 : 0,
    };
  });
}

export type QuizPerformanceRow = {
  lessonId: string;
  lessonTitle: string;
  attempts: number;
  avgScore: number | null;
};

export async function getCourseQuizPerformance(
  courseId: string
): Promise<QuizPerformanceRow[]> {
  const lessons = await db.lesson.findMany({
    where: { module: { courseId }, quiz: { isNot: null } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    select: { id: true, title: true },
  });
  if (lessons.length === 0) return [];

  const lessonIds = lessons.map((l) => l.id);
  const grouped = await db.lessonProgress.groupBy({
    by: ["lessonId"],
    where: {
      lessonId: { in: lessonIds },
      quizScore: { not: null },
    },
    _avg: { quizScore: true },
    _count: { id: true },
  });
  const byId = new Map(grouped.map((g) => [g.lessonId, g]));

  return lessons.map((l) => {
    const g = byId.get(l.id);
    return {
      lessonId: l.id,
      lessonTitle: l.title,
      attempts: g?._count.id ?? 0,
      avgScore: g?._avg.quizScore ?? null,
    };
  });
}

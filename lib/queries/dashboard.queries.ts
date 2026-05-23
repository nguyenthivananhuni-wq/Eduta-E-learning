import "server-only";
import { db } from "@/lib/db";

type EnrolledCourseData = {
  enrollmentId: string;
  enrolledAt: Date;
  course: {
    id: string;
    slug: string;
    title: string;
    thumbnail: string;
    category: string;
  };
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  continueLessonId: string | null;
  lastQuizScore: number | null;
};

export async function getDashboardData(userId: string): Promise<{
  enrolledCourses: EnrolledCourseData[];
  stats: {
    courseCount: number;
    completedLessons: number;
    hoursStudied: number;
  };
}> {
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    orderBy: { enrolledAt: "desc" },
    include: {
      course: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              order: true,
              lessons: {
                orderBy: { order: "asc" },
                select: { id: true, order: true },
              },
            },
          },
        },
      },
    },
  });

  // Collect all lesson IDs across all enrolled courses
  const allLessonIds = enrollments.flatMap((e) =>
    e.course.modules.flatMap((m) => m.lessons.map((l) => l.id))
  );

  const progressRows = allLessonIds.length
    ? await db.lessonProgress.findMany({
        where: { userId, lessonId: { in: allLessonIds } },
        select: {
          lessonId: true,
          completed: true,
          quizScore: true,
          completedAt: true,
        },
      })
    : [];

  const progressByLesson = new Map<
    string,
    { completed: boolean; quizScore: number | null; completedAt: Date | null }
  >();
  for (const p of progressRows) {
    progressByLesson.set(p.lessonId, {
      completed: p.completed,
      quizScore: p.quizScore,
      completedAt: p.completedAt,
    });
  }

  const enrolledCourses: EnrolledCourseData[] = enrollments.map((e) => {
    const lessonIds = e.course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const totalLessons = lessonIds.length;
    const completedLessons = lessonIds.filter(
      (id) => progressByLesson.get(id)?.completed
    ).length;
    const percentage =
      totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

    // Continue learning = first incomplete lesson, else first lesson
    const continueLessonId =
      lessonIds.find((id) => !progressByLesson.get(id)?.completed) ??
      lessonIds[0] ??
      null;

    // Last quiz score among completed lessons
    const completedScores = lessonIds
      .map((id) => progressByLesson.get(id))
      .filter((p) => p?.completed && p.quizScore != null)
      .map((p) => ({ score: p!.quizScore!, completedAt: p!.completedAt }))
      .sort(
        (a, b) =>
          (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)
      );
    const lastQuizScore = completedScores[0]?.score ?? null;

    return {
      enrollmentId: e.id,
      enrolledAt: e.enrolledAt,
      course: {
        id: e.course.id,
        slug: e.course.slug,
        title: e.course.title,
        thumbnail: e.course.thumbnail,
        category: e.course.category,
      },
      totalLessons,
      completedLessons,
      percentage,
      continueLessonId,
      lastQuizScore,
    };
  });

  // Aggregate stats
  const totalCompleted = enrolledCourses.reduce(
    (sum, c) => sum + c.completedLessons,
    0
  );
  // Mock: assume 10 mins per completed lesson → hours = round(mins / 60, 1)
  const hoursStudied = Math.round((totalCompleted * 10) / 60);

  return {
    enrolledCourses,
    stats: {
      courseCount: enrolledCourses.length,
      completedLessons: totalCompleted,
      hoursStudied,
    },
  };
}

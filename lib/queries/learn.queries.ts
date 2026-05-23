import "server-only";
import { db } from "@/lib/db";
import type { ProgressMap } from "@/lib/utils/progress";

/**
 * Fetch full course structure + per-lesson progress for a given user.
 * Used by the learn layout (sidebar) + lesson page.
 */
export async function getCourseStructure(slug: string, userId: string) {
  const course = await db.course.findUnique({
    where: { slug },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: {
          lessons: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              title: true,
              order: true,
              quiz: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!course) return null;

  const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: { id: true },
  });

  const progressRows = allLessonIds.length
    ? await db.lessonProgress.findMany({
        where: { userId, lessonId: { in: allLessonIds } },
        select: { lessonId: true, completed: true, quizScore: true },
      })
    : [];

  const progressMap: ProgressMap = {};
  for (const p of progressRows) {
    progressMap[p.lessonId] = { completed: p.completed, quizScore: p.quizScore };
  }

  return {
    course,
    isEnrolled: !!enrollment,
    progressMap,
    allLessonIds,
  };
}

/**
 * Fetch a lesson by id, including quiz questions (WITHOUT correctIndex for security).
 * Returns null if lesson doesn't exist or doesn't belong to the given course slug.
 */
export async function getLessonForViewing(courseSlug: string, lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          courseId: true,
          course: { select: { slug: true, title: true, id: true } },
        },
      },
      quiz: { select: { id: true, questions: true } },
      attachments: {
        orderBy: { order: "asc" },
        select: { id: true, name: true, url: true },
      },
    },
  });

  if (!lesson || lesson.module.course.slug !== courseSlug) return null;
  return lesson;
}

/**
 * Compute prev/next lesson IDs given the course structure and current lesson.
 */
export function computeLessonNav(
  modules: Array<{ lessons: Array<{ id: string }> }>,
  currentLessonId: string
): { prevId: string | null; nextId: string | null } {
  const flat = modules.flatMap((m) => m.lessons.map((l) => l.id));
  const idx = flat.indexOf(currentLessonId);
  if (idx === -1) return { prevId: null, nextId: null };
  return {
    prevId: idx > 0 ? flat[idx - 1] ?? null : null,
    nextId: idx < flat.length - 1 ? flat[idx + 1] ?? null : null,
  };
}

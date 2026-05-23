export type ProgressMap = Record<string, { completed: boolean; quizScore: number | null }>;

export function calcCourseProgress(
  allLessonIds: string[],
  progressMap: ProgressMap
): { completed: number; total: number; percent: number } {
  const total = allLessonIds.length;
  if (total === 0) return { completed: 0, total: 0, percent: 0 };
  const completed = allLessonIds.filter((id) => progressMap[id]?.completed).length;
  const percent = Math.round((completed / total) * 100);
  return { completed, total, percent };
}

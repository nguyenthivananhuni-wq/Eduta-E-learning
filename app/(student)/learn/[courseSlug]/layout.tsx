import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth-helpers";
import { getCourseStructure } from "@/lib/queries/learn.queries";
import { calcCourseProgress } from "@/lib/utils/progress";
import { LearnShell } from "@/components/learn/LearnShell";

type Params = Promise<{ courseSlug: string }>;

export default async function LearnLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const session = await requireAuth();
  const { courseSlug } = await params;

  const data = await getCourseStructure(courseSlug, session.user.id);
  if (!data) notFound();
  if (!data.isEnrolled) {
    redirect(`/courses/${courseSlug}`);
  }

  const { course, progressMap, allLessonIds } = data;
  const { completed, total, percent } = calcCourseProgress(allLessonIds, progressMap);

  return (
    <LearnShell
      courseSlug={courseSlug}
      courseTitle={course.title}
      modules={course.modules}
      progressMap={progressMap}
      progressPercent={percent}
      completedCount={completed}
      totalLessons={total}
    >
      {children}
    </LearnShell>
  );
}

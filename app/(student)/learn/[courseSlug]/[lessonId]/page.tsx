import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { requireAuth } from "@/lib/auth-helpers";
import {
  getCourseStructure,
  getLessonForViewing,
  computeLessonNav,
} from "@/lib/queries/learn.queries";
import { VideoPlayer } from "@/components/learn/VideoPlayer";
import { LessonContent } from "@/components/learn/LessonContent";
import { LessonAttachments } from "@/components/learn/LessonAttachments";
import { CompletionButton } from "@/components/learn/CompletionButton";
import { QuizPlayer } from "@/components/learn/QuizPlayer";
import { LessonNav } from "@/components/learn/LessonNav";

type Params = Promise<{ courseSlug: string; lessonId: string }>;

type ClientQuestion = { question: string; options: string[] };

function parseQuizQuestions(json: string | undefined): ClientQuestion[] | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Array<{
      question: string;
      options: string[];
      correctIndex: number;
    }>;
    // Strip correctIndex before sending to client
    return parsed.map((q) => ({ question: q.question, options: q.options }));
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Params }) {
  const { courseSlug, lessonId } = await params;
  const lesson = await getLessonForViewing(courseSlug, lessonId);
  return { title: lesson?.title ?? "Bài học" };
}

export default async function LessonPage({ params }: { params: Params }) {
  const session = await requireAuth();
  const { courseSlug, lessonId } = await params;

  const [lesson, structure] = await Promise.all([
    getLessonForViewing(courseSlug, lessonId),
    getCourseStructure(courseSlug, session.user.id),
  ]);

  if (!lesson || !structure || !structure.isEnrolled) notFound();

  const { course, progressMap } = structure;
  const lessonProgress = progressMap[lessonId];
  const completed = lessonProgress?.completed ?? false;
  const previousScore = lessonProgress?.quizScore ?? null;

  const quizQuestions = parseQuizQuestions(lesson.quiz?.questions);
  const hasQuiz = !!quizQuestions && quizQuestions.length > 0;

  const { prevId, nextId } = computeLessonNav(course.modules, lessonId);

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 lg:py-10 space-y-8">
      {/* Title */}
      <div>
        <Badge variant="outline" className="mb-2">
          {lesson.module.title}
        </Badge>
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{lesson.title}</h1>
      </div>

      {/* Video */}
      <VideoPlayer videoUrl={lesson.videoUrl} title={lesson.title} />

      {/* Markdown content */}
      <LessonContent content={lesson.content} />

      {/* Attachments */}
      <LessonAttachments attachments={lesson.attachments} />

      <Separator />

      {/* Mark complete */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Đã xem xong bài này? Đánh dấu hoàn thành để theo dõi tiến độ.
        </p>
        <CompletionButton
          lessonId={lesson.id}
          courseSlug={courseSlug}
          completed={completed}
          hasQuiz={hasQuiz}
        />
      </div>

      {/* Quiz */}
      {hasQuiz && quizQuestions && (
        <>
          <Separator />
          <QuizPlayer
            lessonId={lesson.id}
            courseSlug={courseSlug}
            questions={quizQuestions}
            previousScore={previousScore}
          />
        </>
      )}

      {/* Prev/Next */}
      <LessonNav courseSlug={courseSlug} prevId={prevId} nextId={nextId} />
    </div>
  );
}

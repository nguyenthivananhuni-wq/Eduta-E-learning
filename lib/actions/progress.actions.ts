"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const lessonIdSchema = z.string().min(1);

async function getLessonContext(lessonId: string, userId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      module: {
        select: {
          courseId: true,
          course: { select: { slug: true } },
        },
      },
    },
  });
  if (!lesson) return { ok: false as const, error: "Không tìm thấy bài học" };

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: lesson.module.courseId } },
    select: { id: true },
  });
  if (!enrollment) return { ok: false as const, error: "Bạn chưa đăng ký khóa học này" };

  return {
    ok: true as const,
    courseId: lesson.module.courseId,
    courseSlug: lesson.module.course.slug,
  };
}

async function computeNextLessonId(courseId: string, currentLessonId: string): Promise<string | null> {
  const lessons = await db.lesson.findMany({
    where: { module: { courseId } },
    orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    select: { id: true },
  });
  const idx = lessons.findIndex((l) => l.id === currentLessonId);
  if (idx === -1 || idx >= lessons.length - 1) return null;
  return lessons[idx + 1]?.id ?? null;
}

export async function markLessonComplete(
  lessonId: string
): Promise<Result<{ nextLessonId: string | null }>> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = lessonIdSchema.safeParse(lessonId);
  if (!parsed.success) return { ok: false, error: "ID bài học không hợp lệ" };

  const ctx = await getLessonContext(lessonId, userId);
  if (!ctx.ok) return ctx;

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { completed: true, completedAt: new Date() },
    create: { userId, lessonId, completed: true, completedAt: new Date() },
  });

  const nextLessonId = await computeNextLessonId(ctx.courseId, lessonId);

  revalidatePath(`/learn/${ctx.courseSlug}/${lessonId}`);
  revalidatePath(`/learn/${ctx.courseSlug}`, "layout");
  revalidatePath("/dashboard");

  return { ok: true, nextLessonId };
}

const submitQuizSchema = z.object({
  lessonId: z.string().min(1),
  answers: z.array(z.number().int().min(0)).min(1).max(50),
});

type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export async function submitQuiz(input: unknown): Promise<
  Result<{
    score: number;
    total: number;
    correctCount: number;
    correctIndexes: number[];
    nextLessonId: string | null;
  }>
> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = submitQuizSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Dữ liệu nộp quiz không hợp lệ" };

  const { lessonId, answers } = parsed.data;
  const ctx = await getLessonContext(lessonId, userId);
  if (!ctx.ok) return ctx;

  const quiz = await db.quiz.findUnique({
    where: { lessonId },
    select: { questions: true },
  });
  if (!quiz) return { ok: false, error: "Bài học này không có quiz" };

  let questions: QuizQuestion[];
  try {
    questions = JSON.parse(quiz.questions) as QuizQuestion[];
  } catch {
    return { ok: false, error: "Dữ liệu quiz bị lỗi" };
  }

  if (answers.length !== questions.length) {
    return { ok: false, error: "Vui lòng trả lời đầy đủ các câu hỏi" };
  }

  // Validate each answer index within options range
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;
    const a = answers[i]!;
    if (a >= q.options.length) {
      return { ok: false, error: "Đáp án không hợp lệ" };
    }
  }

  const correctIndexes = questions.map((q) => q.correctIndex);
  const correctCount = answers.reduce(
    (sum, a, i) => sum + (a === correctIndexes[i] ? 1 : 0),
    0
  );
  const score = Math.round((correctCount / questions.length) * 100);

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { completed: true, quizScore: score, completedAt: new Date() },
    create: {
      userId,
      lessonId,
      completed: true,
      quizScore: score,
      completedAt: new Date(),
    },
  });

  const nextLessonId = await computeNextLessonId(ctx.courseId, lessonId);

  revalidatePath(`/learn/${ctx.courseSlug}/${lessonId}`);
  revalidatePath(`/learn/${ctx.courseSlug}`, "layout");
  revalidatePath("/dashboard");

  return {
    ok: true,
    score,
    total: questions.length,
    correctCount,
    correctIndexes,
    nextLessonId,
  };
}

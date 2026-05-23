"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCourseEditAccess } from "@/lib/auth-helpers";
import { quizSchema } from "@/lib/validations/course";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

async function lessonCourseAndSlug(lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true, course: { select: { slug: true } } } } },
  });
  return lesson?.module
    ? { courseId: lesson.module.courseId, slug: lesson.module.course.slug }
    : null;
}

function revalidateLearnPaths(info: { courseId: string; slug: string }, lessonId: string) {
  revalidatePath(`/admin/courses/${info.courseId}/edit`);
  revalidatePath(`/instructor/courses/${info.courseId}/edit`);
  revalidatePath(`/learn/${info.slug}/${lessonId}`);
}

export async function upsertQuiz(input: unknown): Promise<Result> {
  const parsed = quizSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu quiz không hợp lệ" };
  }

  const { lessonId, questions } = parsed.data;
  const info = await lessonCourseAndSlug(lessonId);
  if (!info) return { ok: false, error: "Không tìm thấy bài học" };
  const denied = await assertCourseEditAccess(info.courseId);
  if (denied) return { ok: false, error: denied };

  const serialized = JSON.stringify(questions);
  await db.quiz.upsert({
    where: { lessonId },
    update: { questions: serialized },
    create: { lessonId, questions: serialized },
  });

  revalidateLearnPaths(info, lessonId);
  return { ok: true };
}

export async function deleteQuiz(lessonId: string): Promise<Result> {
  const info = await lessonCourseAndSlug(lessonId);
  if (!info) return { ok: false, error: "Không tìm thấy bài học" };
  const denied = await assertCourseEditAccess(info.courseId);
  if (denied) return { ok: false, error: denied };

  try {
    await db.quiz.delete({ where: { lessonId } });
    revalidateLearnPaths(info, lessonId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Không xóa được quiz" };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCourseEditAccess } from "@/lib/auth-helpers";
import { lessonSchema, lessonUpdateSchema } from "@/lib/validations/course";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

async function moduleCourseId(moduleId: string): Promise<string | null> {
  const mod = await db.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  return mod?.courseId ?? null;
}

async function lessonCourseAndSlug(lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { module: { select: { courseId: true, course: { select: { slug: true } } } } },
  });
  return lesson?.module
    ? { courseId: lesson.module.courseId, slug: lesson.module.course.slug }
    : null;
}

function revalidateCourse(courseId: string, lessonSlug?: { slug: string; lessonId: string }) {
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/instructor/courses/${courseId}/edit`);
  if (lessonSlug) {
    revalidatePath(`/learn/${lessonSlug.slug}/${lessonSlug.lessonId}`);
  }
}

export async function createLesson(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { moduleId, title, videoUrl, content } = parsed.data;

  const courseId = await moduleCourseId(moduleId);
  if (!courseId) return { ok: false, error: "Không tìm thấy module" };
  const denied = await assertCourseEditAccess(courseId);
  if (denied) return { ok: false, error: denied };

  const last = await db.lesson.findFirst({
    where: { moduleId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (last?.order ?? 0) + 1;

  const lesson = await db.lesson.create({
    data: { moduleId, title, videoUrl, content, order },
  });

  revalidateCourse(courseId);
  return { ok: true, id: lesson.id };
}

export async function updateLesson(id: string, input: unknown): Promise<Result> {
  const parsed = lessonUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const info = await lessonCourseAndSlug(id);
  if (!info) return { ok: false, error: "Không tìm thấy bài học" };
  const denied = await assertCourseEditAccess(info.courseId);
  if (denied) return { ok: false, error: denied };

  await db.lesson.update({ where: { id }, data: parsed.data });
  revalidateCourse(info.courseId, { slug: info.slug, lessonId: id });
  return { ok: true };
}

export async function deleteLesson(id: string): Promise<Result> {
  const info = await lessonCourseAndSlug(id);
  if (!info) return { ok: false, error: "Không tìm thấy bài học" };
  const denied = await assertCourseEditAccess(info.courseId);
  if (denied) return { ok: false, error: denied };

  try {
    await db.lesson.delete({ where: { id } });
    revalidateCourse(info.courseId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Không xóa được bài học" };
  }
}

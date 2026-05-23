"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCourseEditAccess } from "@/lib/auth-helpers";
import {
  attachmentSchema,
  attachmentUpdateSchema,
} from "@/lib/validations/attachment";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const MAX_ATTACHMENTS_PER_LESSON = 20;

async function lessonContext(lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      module: {
        select: { courseId: true, course: { select: { slug: true } } },
      },
    },
  });
  return lesson?.module
    ? {
        courseId: lesson.module.courseId,
        slug: lesson.module.course.slug,
        lessonId,
      }
    : null;
}

async function attachmentContext(attachmentId: string) {
  const att = await db.attachment.findUnique({
    where: { id: attachmentId },
    select: {
      id: true,
      lessonId: true,
      lesson: {
        select: {
          module: {
            select: { courseId: true, course: { select: { slug: true } } },
          },
        },
      },
    },
  });
  return att?.lesson?.module
    ? {
        courseId: att.lesson.module.courseId,
        slug: att.lesson.module.course.slug,
        lessonId: att.lessonId,
      }
    : null;
}

function revalidateAfter(slug: string, lessonId: string, courseId: string) {
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/instructor/courses/${courseId}/edit`);
  revalidatePath(`/learn/${slug}/${lessonId}`);
}

export async function addLessonAttachment(
  input: unknown
): Promise<Result<{ id: string }>> {
  const parsed = attachmentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const ctx = await lessonContext(parsed.data.lessonId);
  if (!ctx) return { ok: false, error: "Không tìm thấy bài học" };

  const denied = await assertCourseEditAccess(ctx.courseId);
  if (denied) return { ok: false, error: denied };

  const count = await db.attachment.count({ where: { lessonId: ctx.lessonId } });
  if (count >= MAX_ATTACHMENTS_PER_LESSON) {
    return {
      ok: false,
      error: `Tối đa ${MAX_ATTACHMENTS_PER_LESSON} tài liệu mỗi bài học`,
    };
  }

  const last = await db.attachment.findFirst({
    where: { lessonId: ctx.lessonId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (last?.order ?? 0) + 1;

  const att = await db.attachment.create({
    data: {
      lessonId: ctx.lessonId,
      name: parsed.data.name.trim(),
      url: parsed.data.url,
      order,
    },
  });

  revalidateAfter(ctx.slug, ctx.lessonId, ctx.courseId);
  return { ok: true, id: att.id };
}

export async function updateLessonAttachment(
  id: string,
  input: unknown
): Promise<Result> {
  const parsed = attachmentUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const ctx = await attachmentContext(id);
  if (!ctx) return { ok: false, error: "Không tìm thấy tài liệu" };

  const denied = await assertCourseEditAccess(ctx.courseId);
  if (denied) return { ok: false, error: denied };

  await db.attachment.update({
    where: { id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.url !== undefined ? { url: parsed.data.url } : {}),
    },
  });

  revalidateAfter(ctx.slug, ctx.lessonId, ctx.courseId);
  return { ok: true };
}

export async function removeLessonAttachment(id: string): Promise<Result> {
  const ctx = await attachmentContext(id);
  if (!ctx) return { ok: false, error: "Không tìm thấy tài liệu" };

  const denied = await assertCourseEditAccess(ctx.courseId);
  if (denied) return { ok: false, error: denied };

  try {
    await db.attachment.delete({ where: { id } });
    revalidateAfter(ctx.slug, ctx.lessonId, ctx.courseId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Không xóa được tài liệu" };
  }
}

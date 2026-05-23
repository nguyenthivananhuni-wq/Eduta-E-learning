"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { assertCourseEditAccess } from "@/lib/auth-helpers";
import { moduleSchema, moduleUpdateSchema } from "@/lib/validations/course";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

async function revalidateCourse(courseId: string) {
  revalidatePath(`/admin/courses/${courseId}/edit`);
  revalidatePath(`/instructor/courses/${courseId}/edit`);
}

async function moduleCourseId(moduleId: string): Promise<string | null> {
  const mod = await db.module.findUnique({
    where: { id: moduleId },
    select: { courseId: true },
  });
  return mod?.courseId ?? null;
}

export async function createModule(input: unknown): Promise<Result<{ id: string }>> {
  const parsed = moduleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { courseId, title } = parsed.data;
  const denied = await assertCourseEditAccess(courseId);
  if (denied) return { ok: false, error: denied };

  const last = await db.module.findFirst({
    where: { courseId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const order = (last?.order ?? 0) + 1;

  const mod = await db.module.create({
    data: { courseId, title, order },
  });

  await revalidateCourse(courseId);
  return { ok: true, id: mod.id };
}

export async function updateModule(id: string, input: unknown): Promise<Result> {
  const parsed = moduleUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const courseId = await moduleCourseId(id);
  if (!courseId) return { ok: false, error: "Không tìm thấy module" };
  const denied = await assertCourseEditAccess(courseId);
  if (denied) return { ok: false, error: denied };

  await db.module.update({
    where: { id },
    data: parsed.data,
  });

  await revalidateCourse(courseId);
  return { ok: true };
}

export async function deleteModule(id: string): Promise<Result> {
  const courseId = await moduleCourseId(id);
  if (!courseId) return { ok: false, error: "Không tìm thấy module" };
  const denied = await assertCourseEditAccess(courseId);
  if (denied) return { ok: false, error: denied };

  try {
    await db.module.delete({ where: { id } });
    await revalidateCourse(courseId);
    return { ok: true };
  } catch {
    return { ok: false, error: "Không xóa được module" };
  }
}

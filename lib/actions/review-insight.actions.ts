"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { can } from "@/lib/auth/roles";
import {
  getReviewInsight,
  invalidateCourseInsight,
} from "@/lib/ai/review-insights";

type Result = { ok: true } | { ok: false; error: string };

const REFRESH_COOLDOWN_MS = 60 * 1000;

export async function refreshReviewInsight(courseId: string): Promise<Result> {
  const session = await requireAuth();

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, slug: true, instructorId: true },
  });
  if (!course) return { ok: false, error: "Không tìm thấy khóa học" };

  const isAdmin = can(session.user.role, "moderate");
  const isOwner = course.instructorId === session.user.id;
  if (!isAdmin && !isOwner) {
    return { ok: false, error: "Bạn không có quyền cập nhật phân tích này" };
  }

  // Simple cooldown check via existing cache row
  const existing = await db.reviewInsight.findUnique({
    where: { courseId },
    select: { updatedAt: true },
  });
  if (existing && Date.now() - existing.updatedAt.getTime() < REFRESH_COOLDOWN_MS) {
    return {
      ok: false,
      error: "Vui lòng đợi 1 phút trước khi cập nhật lại",
    };
  }

  await invalidateCourseInsight(courseId);
  await getReviewInsight(courseId);

  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/instructor");
  return { ok: true };
}

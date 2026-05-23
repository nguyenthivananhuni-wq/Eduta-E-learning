"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { reviewSchema, reviewUpdateSchema } from "@/lib/validations/review";
import { recomputeCourseRating } from "@/lib/queries/review.queries";
import { invalidateCourseInsight } from "@/lib/ai/review-insights";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

function revalidateAfterMutation(slug?: string) {
  revalidatePath("/courses");
  revalidatePath("/dashboard");
  revalidatePath("/instructor");
  if (slug) revalidatePath(`/courses/${slug}`);
}

export async function createReview(input: unknown): Promise<Result> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  const { courseId, rating, comment } = parsed.data;

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, slug: true, status: true, instructorId: true },
  });
  if (!course) return { ok: false, error: "Không tìm thấy khóa học" };
  if (course.status !== "APPROVED") {
    return { ok: false, error: "Khóa học chưa được duyệt" };
  }
  if (course.instructorId === userId) {
    return { ok: false, error: "Bạn không thể đánh giá khóa học của chính mình" };
  }

  const enrolled = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { id: true },
  });
  if (!enrolled) {
    return { ok: false, error: "Bạn cần đăng ký khóa học trước khi đánh giá" };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.review.create({
        data: { userId, courseId, rating, comment: comment.trim() },
      });
      await recomputeCourseRating(courseId, tx);
    });
    await invalidateCourseInsight(courseId);
    revalidateAfterMutation(course.slug);
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Bạn đã đánh giá khóa học này rồi" };
    }
    return { ok: false, error: "Không gửi được đánh giá, vui lòng thử lại" };
  }
}

export async function updateReview(reviewId: string, input: unknown): Promise<Result> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = reviewUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      course: { select: { slug: true } },
    },
  });
  if (!review) return { ok: false, error: "Không tìm thấy đánh giá" };
  if (review.userId !== userId) {
    return { ok: false, error: "Bạn không có quyền sửa đánh giá này" };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: reviewId },
        data: { rating: parsed.data.rating, comment: parsed.data.comment.trim() },
      });
      await recomputeCourseRating(review.courseId, tx);
    });
    await invalidateCourseInsight(review.courseId);
    revalidateAfterMutation(review.course.slug);
    return { ok: true };
  } catch {
    return { ok: false, error: "Không cập nhật được đánh giá" };
  }
}

export async function deleteReview(reviewId: string): Promise<Result> {
  const session = await requireAuth();
  const userId = session.user.id;

  const review = await db.review.findUnique({
    where: { id: reviewId },
    select: {
      id: true,
      userId: true,
      courseId: true,
      course: { select: { slug: true } },
    },
  });
  if (!review) return { ok: false, error: "Không tìm thấy đánh giá" };
  if (review.userId !== userId) {
    return { ok: false, error: "Bạn không có quyền xóa đánh giá này" };
  }

  try {
    await db.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await recomputeCourseRating(review.courseId, tx);
    });
    await invalidateCourseInsight(review.courseId);
    revalidateAfterMutation(review.course.slug);
    return { ok: true };
  } catch {
    return { ok: false, error: "Không xóa được đánh giá" };
  }
}

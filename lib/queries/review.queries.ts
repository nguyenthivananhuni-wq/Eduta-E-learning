import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const REVIEWS_LIMIT = 20;

export async function getCourseReviews(courseId: string, limit = REVIEWS_LIMIT) {
  return db.review.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true } },
    },
  });
}

export async function getUserReviewForCourse(userId: string, courseId: string) {
  return db.review.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
}

export async function getInstructorFeedback(instructorId: string, limit = 10) {
  return db.review.findMany({
    where: { course: { instructorId } },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { id: true, name: true } },
      course: { select: { id: true, slug: true, title: true } },
    },
  });
}

export async function getUnreviewedEnrolledCourses(userId: string, limit = 5) {
  return db.enrollment.findMany({
    where: {
      userId,
      course: { status: "APPROVED" },
      AND: {
        course: { reviews: { none: { userId } } },
      },
    },
    orderBy: { enrolledAt: "desc" },
    take: limit,
    include: {
      course: {
        select: { id: true, slug: true, title: true, thumbnail: true, category: true },
      },
    },
  });
}

/**
 * Recompute denormalized avgRating + reviewCount on Course.
 * Must be called inside a transaction so the update lands atomically with
 * the review mutation that triggered it.
 */
export async function recomputeCourseRating(
  courseId: string,
  tx: Prisma.TransactionClient
) {
  const agg = await tx.review.aggregate({
    where: { courseId },
    _avg: { rating: true },
    _count: { id: true },
  });
  await tx.course.update({
    where: { id: courseId },
    data: {
      avgRating: agg._avg.rating,
      reviewCount: agg._count.id,
    },
  });
}

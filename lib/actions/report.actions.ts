"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import {
  reportSchema,
  resolveSchema,
  actionsByTarget,
  reportActionLabels,
} from "@/lib/validations/report";
import { recomputeCourseRating } from "@/lib/queries/review.queries";
import { invalidateCourseInsight } from "@/lib/ai/review-insights";

type Result = { ok: true } | { ok: false; error: string };

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const REPORT_LIMIT_PER_DAY = 10;

export async function reportContent(input: unknown): Promise<Result> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  const { targetType, targetId, reason } = parsed.data;

  // Self-target checks
  if (targetType === "USER" && targetId === userId) {
    return { ok: false, error: "Không thể báo cáo chính mình" };
  }
  if (targetType === "COURSE") {
    const c = await db.course.findUnique({
      where: { id: targetId },
      select: { id: true, instructorId: true },
    });
    if (!c) return { ok: false, error: "Không tìm thấy khóa học" };
    if (c.instructorId === userId) {
      return { ok: false, error: "Không thể báo cáo khóa học của chính mình" };
    }
  }
  if (targetType === "REVIEW") {
    const r = await db.review.findUnique({
      where: { id: targetId },
      select: { id: true, userId: true },
    });
    if (!r) return { ok: false, error: "Không tìm thấy đánh giá" };
    if (r.userId === userId) {
      return { ok: false, error: "Không thể báo cáo đánh giá của chính mình" };
    }
  }

  // Throttle: max N reports per day
  const since = new Date(Date.now() - ONE_DAY_MS);
  const recent = await db.report.count({
    where: { reporterId: userId, createdAt: { gte: since } },
  });
  if (recent >= REPORT_LIMIT_PER_DAY) {
    return { ok: false, error: "Bạn đã báo cáo quá nhiều trong 24 giờ. Vui lòng thử lại sau." };
  }

  // Prevent duplicate pending reports from same user on same target
  const existing = await db.report.findFirst({
    where: { reporterId: userId, targetType, targetId, status: "PENDING" },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "Bạn đã gửi báo cáo đang chờ xử lý cho mục này" };
  }

  await db.report.create({
    data: {
      reporterId: userId,
      targetType,
      targetId,
      reason: reason.trim(),
    },
  });

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return { ok: true };
}

export async function resolveReport(reportId: string, input: unknown): Promise<Result> {
  const session = await requireAdmin();
  const adminId = session.user.id;

  const parsed = resolveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }
  const { action, resolution } = parsed.data;

  const report = await db.report.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, targetType: true, targetId: true, reporterId: true },
  });
  if (!report) return { ok: false, error: "Không tìm thấy báo cáo" };
  if (report.status !== "PENDING") return { ok: false, error: "Báo cáo đã được xử lý" };

  // Guard: hành động phải hợp lệ với loại đối tượng
  if (!actionsByTarget[report.targetType].includes(action)) {
    return { ok: false, error: "Hành động không hợp lệ cho loại báo cáo này" };
  }

  // Side-effects cần chạy SAU transaction
  let reviewCourseId: string | null = null;
  let touchedCourse = false;
  let touchedUser = false;

  try {
    await db.$transaction(async (tx) => {
      if (action === "UNPUBLISH_COURSE") {
        const course = await tx.course.findUnique({
          where: { id: report.targetId },
          select: { id: true, instructorId: true, title: true },
        });
        if (course) {
          await tx.course.update({
            where: { id: course.id },
            data: {
              status: "DRAFT",
              rejectionReason: resolution?.trim() || "Bị gỡ duyệt do báo cáo vi phạm",
              reviewedAt: new Date(),
              reviewedBy: adminId,
            },
          });
          if (course.instructorId) {
            await tx.notification.create({
              data: {
                userId: course.instructorId,
                type: "COURSE_UNPUBLISHED",
                title: "Khóa học bị gỡ duyệt",
                message: `"${course.title}" đã bị gỡ khỏi trang chính do báo cáo vi phạm. Bạn có thể chỉnh sửa và gửi duyệt lại.`,
                link: `/instructor/courses/${course.id}/edit`,
              },
            });
          }
          touchedCourse = true;
        }
      } else if (action === "DELETE_COURSE") {
        const course = await tx.course.findUnique({
          where: { id: report.targetId },
          select: { id: true, instructorId: true, title: true },
        });
        if (course) {
          if (course.instructorId) {
            await tx.notification.create({
              data: {
                userId: course.instructorId,
                type: "COURSE_REMOVED",
                title: "Khóa học bị gỡ bỏ",
                message: `"${course.title}" đã bị gỡ khỏi Eduta do vi phạm bị báo cáo.`,
                link: null,
              },
            });
          }
          await tx.course.delete({ where: { id: course.id } });
          touchedCourse = true;
        }
      } else if (action === "DELETE_REVIEW") {
        const review = await tx.review.findUnique({
          where: { id: report.targetId },
          select: { id: true, courseId: true },
        });
        if (review) {
          await tx.review.delete({ where: { id: review.id } });
          await recomputeCourseRating(review.courseId, tx);
          reviewCourseId = review.courseId;
        }
      } else if (action === "SUSPEND_USER") {
        const target = await tx.user.findUnique({
          where: { id: report.targetId },
          select: { id: true, role: true, suspended: true },
        });
        if (target) {
          if (target.role === "ADMIN") throw new Error("CANNOT_SUSPEND_ADMIN");
          if (target.id === adminId) throw new Error("CANNOT_SUSPEND_SELF");
          if (!target.suspended) {
            await tx.user.update({ where: { id: target.id }, data: { suspended: true } });
            await tx.notification.create({
              data: {
                userId: target.id,
                type: "ACCOUNT_SUSPENDED",
                title: "Tài khoản đã bị tạm khóa",
                message: "Admin đã tạm khóa tài khoản của bạn do vi phạm bị báo cáo.",
                link: null,
              },
            });
          }
          touchedUser = true;
        }
      }

      // Đóng report — ghi hành động vào resolution
      const label = reportActionLabels[action];
      const resolutionText = [label, resolution?.trim()].filter(Boolean).join(" — ");
      await tx.report.update({
        where: { id: reportId },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          resolvedBy: adminId,
          resolution: resolutionText,
        },
      });

      // Thông báo lại người báo cáo
      await tx.notification.create({
        data: {
          userId: report.reporterId,
          type: "REPORT_RESOLVED",
          title: "Báo cáo của bạn đã được xử lý",
          message: `Cảm ơn bạn đã báo cáo. Kết quả xử lý: ${label}.`,
          link: null,
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "CANNOT_SUSPEND_ADMIN") {
      return { ok: false, error: "Không thể khóa tài khoản admin" };
    }
    if (e instanceof Error && e.message === "CANNOT_SUSPEND_SELF") {
      return { ok: false, error: "Không thể tự khóa tài khoản của mình" };
    }
    return { ok: false, error: "Không xử lý được báo cáo, vui lòng thử lại" };
  }

  // Side-effects ngoài transaction
  if (reviewCourseId) await invalidateCourseInsight(reviewCourseId);
  if (touchedCourse) {
    revalidateTag("courses");
    revalidatePath("/courses");
    revalidatePath("/admin/courses");
  }
  if (touchedUser) revalidatePath("/admin/users");
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return { ok: true };
}

export async function dismissReport(reportId: string): Promise<Result> {
  const session = await requireAdmin();

  const report = await db.report.findUnique({
    where: { id: reportId },
    select: { id: true, status: true, reporterId: true },
  });
  if (!report) return { ok: false, error: "Không tìm thấy báo cáo" };
  if (report.status !== "PENDING") return { ok: false, error: "Báo cáo đã được xử lý" };

  await db.$transaction([
    db.report.update({
      where: { id: reportId },
      data: {
        status: "DISMISSED",
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
      },
    }),
    db.notification.create({
      data: {
        userId: report.reporterId,
        type: "REPORT_DISMISSED",
        title: "Báo cáo của bạn đã được xem xét",
        message: "Cảm ơn bạn đã báo cáo. Admin đã xem xét và xác định không có vi phạm.",
        link: null,
      },
    }),
  ]);

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return { ok: true };
}

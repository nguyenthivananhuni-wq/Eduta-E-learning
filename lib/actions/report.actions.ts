"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import { reportSchema, resolveSchema } from "@/lib/validations/report";

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

  const parsed = resolveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const report = await db.report.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  });
  if (!report) return { ok: false, error: "Không tìm thấy báo cáo" };
  if (report.status !== "PENDING") return { ok: false, error: "Báo cáo đã được xử lý" };

  await db.report.update({
    where: { id: reportId },
    data: {
      status: "RESOLVED",
      resolvedAt: new Date(),
      resolvedBy: session.user.id,
      resolution: parsed.data.resolution?.trim() ?? null,
    },
  });

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return { ok: true };
}

export async function dismissReport(reportId: string): Promise<Result> {
  const session = await requireAdmin();

  const report = await db.report.findUnique({
    where: { id: reportId },
    select: { id: true, status: true },
  });
  if (!report) return { ok: false, error: "Không tìm thấy báo cáo" };
  if (report.status !== "PENDING") return { ok: false, error: "Báo cáo đã được xử lý" };

  await db.report.update({
    where: { id: reportId },
    data: {
      status: "DISMISSED",
      resolvedAt: new Date(),
      resolvedBy: session.user.id,
    },
  });

  revalidatePath("/admin/reports");
  revalidatePath("/admin");
  return { ok: true };
}

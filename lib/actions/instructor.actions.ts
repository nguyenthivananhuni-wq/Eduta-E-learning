"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth, requireAdmin } from "@/lib/auth-helpers";
import { can } from "@/lib/auth/roles";
import {
  instructorApplicationSchema,
  rejectApplicationSchema,
} from "@/lib/validations/instructor";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

export async function applyInstructor(input: unknown): Promise<Result> {
  const session = await requireAuth();
  const userId = session.user.id;

  if (can(session.user.role, "teach")) {
    return { ok: false, error: "Bạn đã là giảng viên" };
  }

  const parsed = instructorApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const pending = await db.instructorApplication.findFirst({
    where: { userId, status: "PENDING" },
    select: { id: true },
  });
  if (pending) {
    return { ok: false, error: "Bạn đã có đơn đang chờ duyệt" };
  }

  try {
    await db.instructorApplication.create({
      data: {
        userId,
        bio: parsed.data.bio,
        expertise: parsed.data.expertise,
        motivation: parsed.data.motivation ?? null,
      },
    });
    revalidatePath("/become-instructor");
    revalidatePath("/admin/instructor-applications");
    return { ok: true };
  } catch {
    return { ok: false, error: "Không gửi được đơn, vui lòng thử lại" };
  }
}

export async function approveApplication(id: string): Promise<Result> {
  const session = await requireAdmin();
  const adminId = session.user.id;

  const app = await db.instructorApplication.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });
  if (!app) return { ok: false, error: "Không tìm thấy đơn" };
  if (app.status !== "PENDING") return { ok: false, error: "Đơn đã được xử lý" };

  try {
    await db.$transaction([
      db.instructorApplication.update({
        where: { id },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: adminId,
        },
      }),
      db.user.update({
        where: { id: app.userId },
        data: { role: "INSTRUCTOR" },
      }),
      db.notification.create({
        data: {
          userId: app.userId,
          type: "APPLICATION_APPROVED",
          title: "Đơn đăng ký giảng viên đã được duyệt",
          message: "Chúc mừng! Bạn giờ đã là giảng viên. Hãy tạo khóa học đầu tiên.",
          link: "/instructor",
        },
      }),
    ]);
    revalidatePath("/admin/instructor-applications");
    return { ok: true };
  } catch {
    return { ok: false, error: "Không duyệt được đơn" };
  }
}

export async function rejectApplication(id: string, input: unknown): Promise<Result> {
  const session = await requireAdmin();
  const adminId = session.user.id;

  const parsed = rejectApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Lý do không hợp lệ" };
  }

  const app = await db.instructorApplication.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true },
  });
  if (!app) return { ok: false, error: "Không tìm thấy đơn" };
  if (app.status !== "PENDING") return { ok: false, error: "Đơn đã được xử lý" };

  try {
    await db.$transaction([
      db.instructorApplication.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: parsed.data.reason,
          reviewedAt: new Date(),
          reviewedBy: adminId,
        },
      }),
      db.notification.create({
        data: {
          userId: app.userId,
          type: "APPLICATION_REJECTED",
          title: "Đơn đăng ký giảng viên bị từ chối",
          message: `Lý do: ${parsed.data.reason}`,
          link: "/become-instructor",
        },
      }),
    ]);
    revalidatePath("/admin/instructor-applications");
    return { ok: true };
  } catch {
    return { ok: false, error: "Không từ chối được đơn" };
  }
}

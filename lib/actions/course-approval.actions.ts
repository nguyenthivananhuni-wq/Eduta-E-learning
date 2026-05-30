"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin, requireInstructor } from "@/lib/auth-helpers";
import { can } from "@/lib/auth/roles";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const rejectSchema = z.object({
  reason: z.string().min(10, "Lý do phải có ít nhất 10 ký tự").max(500),
});

export async function submitForReview(courseId: string): Promise<Result> {
  const session = await requireInstructor();

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      instructorId: true,
      status: true,
      modules: { select: { lessons: { select: { id: true }, take: 1 } } },
    },
  });
  if (!course) return { ok: false, error: "Không tìm thấy khóa học" };

  const isAdmin = can(session.user.role, "moderate");
  if (!isAdmin && course.instructorId !== session.user.id) {
    return { ok: false, error: "Không có quyền submit khóa học này" };
  }

  if (course.status !== "DRAFT" && course.status !== "REJECTED") {
    return { ok: false, error: "Khóa học không ở trạng thái có thể submit" };
  }

  const hasLessons = course.modules.some((m) => m.lessons.length > 0);
  if (!hasLessons) {
    return { ok: false, error: "Khóa học phải có ít nhất 1 bài học trước khi submit" };
  }

  try {
    await db.course.update({
      where: { id: courseId },
      data: {
        status: "PENDING",
        rejectionReason: null,
      },
    });
    revalidatePath("/admin/courses");
    revalidatePath("/admin/courses/pending");
    revalidatePath("/instructor/courses");
    revalidatePath(`/instructor/courses/${courseId}/edit`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Không submit được" };
  }
}

export async function approveCourse(courseId: string): Promise<Result> {
  const session = await requireAdmin();
  const adminId = session.user.id;

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, slug: true, status: true, instructorId: true },
  });
  if (!course) return { ok: false, error: "Không tìm thấy khóa học" };
  if (course.status !== "PENDING") {
    return { ok: false, error: "Khóa học không ở trạng thái chờ duyệt" };
  }

  try {
    await db.$transaction([
      db.course.update({
        where: { id: courseId },
        data: {
          status: "APPROVED",
          reviewedAt: new Date(),
          reviewedBy: adminId,
          rejectionReason: null,
        },
      }),
      ...(course.instructorId
        ? [
            db.notification.create({
              data: {
                userId: course.instructorId,
                type: "COURSE_APPROVED",
                title: "Khóa học của bạn đã được duyệt",
                message: `"${course.title}" đã xuất hiện trên trang chính của Eduta.`,
                link: `/courses/${course.slug}`,
              },
            }),
          ]
        : []),
    ]);
    revalidatePath("/admin/courses");
    revalidatePath("/admin/courses/pending");
    revalidatePath("/instructor/courses");
    revalidateTag("courses");
    revalidatePath("/courses");
    revalidatePath(`/courses/${course.slug}`);
    return { ok: true };
  } catch {
    return { ok: false, error: "Không duyệt được khóa học" };
  }
}

export async function rejectCourse(courseId: string, input: unknown): Promise<Result> {
  const session = await requireAdmin();
  const adminId = session.user.id;

  const parsed = rejectSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Lý do không hợp lệ" };
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, slug: true, status: true, instructorId: true },
  });
  if (!course) return { ok: false, error: "Không tìm thấy khóa học" };
  if (course.status !== "PENDING") {
    return { ok: false, error: "Khóa học không ở trạng thái chờ duyệt" };
  }

  try {
    await db.$transaction([
      db.course.update({
        where: { id: courseId },
        data: {
          status: "REJECTED",
          rejectionReason: parsed.data.reason,
          reviewedAt: new Date(),
          reviewedBy: adminId,
        },
      }),
      ...(course.instructorId
        ? [
            db.notification.create({
              data: {
                userId: course.instructorId,
                type: "COURSE_REJECTED",
                title: "Khóa học bị từ chối",
                message: `"${course.title}" — Lý do: ${parsed.data.reason}`,
                link: `/instructor/courses/${courseId}/edit`,
              },
            }),
          ]
        : []),
    ]);
    revalidatePath("/admin/courses");
    revalidatePath("/admin/courses/pending");
    revalidatePath("/instructor/courses");
    return { ok: true };
  } catch {
    return { ok: false, error: "Không từ chối được" };
  }
}

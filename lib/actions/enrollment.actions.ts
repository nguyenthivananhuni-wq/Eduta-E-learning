"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { INSTRUCTOR_EARNING_PERCENT } from "@/lib/constants";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const idSchema = z.string().min(1);

export async function enrollCourse(
  courseId: string
): Promise<Result<{ slug: string; firstLessonId: string }>> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = idSchema.safeParse(courseId);
  if (!parsed.success) {
    return { ok: false, error: "ID khóa học không hợp lệ" };
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      slug: true,
      title: true,
      price: true,
      status: true,
      instructorId: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          lessons: {
            orderBy: { order: "asc" },
            select: { id: true },
            take: 1,
          },
        },
        take: 1,
      },
    },
  });

  if (!course) return { ok: false, error: "Không tìm thấy khóa học" };
  if (course.status !== "APPROVED") {
    return { ok: false, error: "Khóa học chưa được duyệt" };
  }
  // Giảng viên/admin không thể ghi danh khóa học của chính mình (đồng bộ với chặn tự đánh giá).
  if (course.instructorId && course.instructorId === userId) {
    return { ok: false, error: "Bạn không thể ghi danh khóa học của chính mình" };
  }

  const firstLesson = course.modules[0]?.lessons[0];
  if (!firstLesson) {
    return { ok: false, error: "Khóa học chưa có bài học, vui lòng quay lại sau" };
  }

  // Check already enrolled
  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId: course.id } },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, slug: course.slug, firstLessonId: firstLesson.id };
  }

  // Free course → simple enroll
  if (course.price === 0) {
    try {
      await db.enrollment.create({ data: { userId, courseId: course.id } });
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) {
        return { ok: false, error: "Không đăng ký được, vui lòng thử lại" };
      }
    }
    revalidatePath("/dashboard");
    revalidatePath(`/courses/${course.slug}`);
    return { ok: true, slug: course.slug, firstLessonId: firstLesson.id };
  }

  // Paid course → wallet purchase via atomic transaction
  const wallet = await db.wallet.findUnique({
    where: { userId },
    select: { balance: true },
  });
  if (!wallet || wallet.balance < course.price) {
    return { ok: false, error: "Số dư ví không đủ để mua khóa học này" };
  }

  const instructorEarning = Math.floor((course.price * INSTRUCTOR_EARNING_PERCENT) / 100);

  try {
    await db.$transaction(async (tx) => {
      // Deduct from buyer
      const buyerWallet = await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: course.price } },
        select: { balance: true },
      });
      if (buyerWallet.balance < 0) {
        throw new Error("INSUFFICIENT");
      }

      // Buyer transaction
      await tx.transaction.create({
        data: {
          userId,
          type: "PURCHASE",
          status: "COMPLETED",
          amount: -course.price,
          courseId: course.id,
          description: `Mua khóa học: ${course.title}`,
        },
      });

      // Credit instructor (if has instructor + earning > 0)
      if (course.instructorId && instructorEarning > 0) {
        // upsert handles instructors who don't have a wallet row yet
        await tx.wallet.upsert({
          where: { userId: course.instructorId },
          create: { userId: course.instructorId, balance: instructorEarning },
          update: { balance: { increment: instructorEarning } },
        });
        await tx.transaction.create({
          data: {
            userId: course.instructorId,
            type: "EARNING",
            status: "COMPLETED",
            amount: instructorEarning,
            courseId: course.id,
            description: `Doanh thu từ: ${course.title}`,
          },
        });
        await tx.notification.create({
          data: {
            userId: course.instructorId,
            type: "EARNING",
            title: "Bạn có doanh thu mới",
            message: `Bạn vừa nhận ${instructorEarning.toLocaleString("vi-VN")}đ từ khóa "${course.title}"`,
            link: "/instructor",
          },
        });
      }

      // Create enrollment
      await tx.enrollment.create({
        data: { userId, courseId: course.id },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "INSUFFICIENT") {
      return { ok: false, error: "Số dư ví không đủ" };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // Already enrolled race condition
      return { ok: true, slug: course.slug, firstLessonId: firstLesson.id };
    }
    return { ok: false, error: "Không hoàn tất thanh toán, vui lòng thử lại" };
  }

  revalidatePath("/dashboard");
  revalidatePath("/wallet");
  revalidatePath(`/courses/${course.slug}`);
  return { ok: true, slug: course.slug, firstLessonId: firstLesson.id };
}

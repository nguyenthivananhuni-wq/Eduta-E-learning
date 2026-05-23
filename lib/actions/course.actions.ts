"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireInstructor } from "@/lib/auth-helpers";
import { courseSchema } from "@/lib/validations/course";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

async function assertCourseOwnership(id: string) {
  const session = await requireInstructor();
  const course = await db.course.findUnique({
    where: { id },
    select: { id: true, instructorId: true, slug: true },
  });
  if (!course) return { ok: false as const, error: "Không tìm thấy khóa học" };

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && course.instructorId !== session.user.id) {
    return { ok: false as const, error: "Bạn không có quyền chỉnh sửa khóa học này" };
  }
  return { ok: true as const, session, course };
}

export async function createCourse(input: unknown): Promise<Result<{ id: string }>> {
  const session = await requireInstructor();

  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    const course = await db.course.create({
      data: {
        ...parsed.data,
        instructorId: session.user.id,
        status: "DRAFT",
      },
    });
    revalidatePath("/admin/courses");
    revalidatePath("/instructor/courses");
    revalidatePath("/courses");
    return { ok: true, id: course.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Slug đã tồn tại, vui lòng chọn slug khác" };
    }
    return { ok: false, error: "Lỗi khi tạo khóa học" };
  }
}

export async function updateCourse(id: string, input: unknown): Promise<Result> {
  const check = await assertCourseOwnership(id);
  if (!check.ok) return check;

  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  try {
    await db.course.update({ where: { id }, data: parsed.data });
    revalidatePath("/admin/courses");
    revalidatePath("/instructor/courses");
    revalidatePath(`/admin/courses/${id}/edit`);
    revalidatePath(`/instructor/courses/${id}/edit`);
    revalidatePath("/courses");
    revalidatePath(`/courses/${parsed.data.slug}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { ok: false, error: "Slug đã tồn tại" };
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return { ok: false, error: "Không tìm thấy khóa học" };
    }
    return { ok: false, error: "Lỗi khi cập nhật" };
  }
}

export async function deleteCourse(id: string): Promise<Result> {
  const check = await assertCourseOwnership(id);
  if (!check.ok) return check;
  try {
    await db.course.delete({ where: { id } });
    revalidatePath("/admin/courses");
    revalidatePath("/instructor/courses");
    revalidatePath("/courses");
    return { ok: true };
  } catch {
    return { ok: false, error: "Không xóa được khóa học" };
  }
}

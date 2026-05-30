import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { can, type Role } from "@/lib/auth/roles";

/**
 * Re-check user với DB ở mỗi request (NODE runtime).
 * Vá lỗ hổng JWT: tài khoản bị khóa/xóa hoặc đổi role chỉ có hiệu lực khi token hết hạn.
 * Bọc trong `cache()` để dedupe khi nhiều helper gọi trong cùng một lần render.
 */
const getFreshUser = cache(
  async (userId: string): Promise<{ role: Role; suspended: boolean } | null> => {
    return db.user.findUnique({
      where: { id: userId },
      select: { role: true, suspended: true },
    });
  }
);

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const fresh = await getFreshUser(session.user.id);
  if (!fresh) redirect("/login"); // tài khoản đã bị xóa
  if (fresh.suspended) redirect("/login?suspended=1"); // khóa có hiệu lực ngay

  // Dùng role tươi từ DB (đổi role có hiệu lực ngay, không cần đăng nhập lại)
  session.user.role = fresh.role;
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (!can(session.user.role, "moderate")) redirect("/");
  return session;
}

export async function requireInstructor() {
  const session = await requireAuth();
  if (!can(session.user.role, "teach")) {
    redirect("/become-instructor");
  }
  return session;
}

export async function getSession() {
  return await auth();
}

/**
 * Verify the current session has edit rights to the course identified by `courseId`.
 * Returns `null` on success. Returns an error string if denied.
 *
 * Admins bypass ownership checks. Instructors must own the course.
 */
export async function assertCourseEditAccess(courseId: string): Promise<string | null> {
  const session = await auth();
  if (!session?.user) return "Chưa đăng nhập";

  const role = session.user.role;
  if (can(role, "moderate")) return null;
  if (!can(role, "teach")) return "Không có quyền";

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (!course) return "Không tìm thấy khóa học";
  if (course.instructorId !== session.user.id) return "Không có quyền chỉnh sửa khóa học này";
  return null;
}

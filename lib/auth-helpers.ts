import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/");
  return session;
}

export async function requireInstructor() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "INSTRUCTOR" && session.user.role !== "ADMIN") {
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
  if (role === "ADMIN") return null;
  if (role !== "INSTRUCTOR") return "Không có quyền";

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true },
  });
  if (!course) return "Không tìm thấy khóa học";
  if (course.instructorId !== session.user.id) return "Không có quyền chỉnh sửa khóa học này";
  return null;
}

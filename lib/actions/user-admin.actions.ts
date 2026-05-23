"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-helpers";

type Result = { ok: true } | { ok: false; error: string };

function revalidateUserPages() {
  revalidatePath("/admin/users");
  revalidatePath("/admin");
  revalidatePath("/admin/analytics");
}

export async function suspendUser(userId: string): Promise<Result> {
  const session = await requireAdmin();
  if (userId === session.user.id) {
    return { ok: false, error: "Bạn không thể tự khóa tài khoản của mình" };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, suspended: true },
  });
  if (!user) return { ok: false, error: "Không tìm thấy người dùng" };
  if (user.suspended) return { ok: false, error: "Tài khoản đã bị khóa" };

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { suspended: true } }),
    db.notification.create({
      data: {
        userId,
        type: "ACCOUNT_SUSPENDED",
        title: "Tài khoản đã bị tạm khóa",
        message: "Admin đã tạm khóa tài khoản của bạn. Liên hệ hỗ trợ nếu cần làm rõ.",
        link: null,
      },
    }),
  ]);

  revalidateUserPages();
  return { ok: true };
}

export async function unsuspendUser(userId: string): Promise<Result> {
  await requireAdmin();

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, suspended: true },
  });
  if (!user) return { ok: false, error: "Không tìm thấy người dùng" };
  if (!user.suspended) return { ok: false, error: "Tài khoản đang hoạt động" };

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { suspended: false } }),
    db.notification.create({
      data: {
        userId,
        type: "ACCOUNT_REACTIVATED",
        title: "Tài khoản đã được mở khóa",
        message: "Bạn có thể đăng nhập và tiếp tục sử dụng Eduta.",
        link: null,
      },
    }),
  ]);

  revalidateUserPages();
  return { ok: true };
}

export async function promoteToAdmin(userId: string): Promise<Result> {
  const session = await requireAdmin();
  if (userId === session.user.id) {
    return { ok: false, error: "Bạn đã là admin" };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });
  if (!user) return { ok: false, error: "Không tìm thấy người dùng" };
  if (user.role === "ADMIN") return { ok: false, error: "Người dùng đã là admin" };

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { role: "ADMIN" } }),
    db.notification.create({
      data: {
        userId,
        type: "ROLE_PROMOTED",
        title: "Bạn được nâng quyền admin",
        message: "Đăng nhập lại để áp dụng quyền mới.",
        link: "/admin",
      },
    }),
  ]);

  revalidateUserPages();
  return { ok: true };
}

export async function deleteUser(userId: string): Promise<Result> {
  const session = await requireAdmin();
  if (userId === session.user.id) {
    return { ok: false, error: "Bạn không thể xóa tài khoản của chính mình" };
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) return { ok: false, error: "Không tìm thấy người dùng" };

  try {
    await db.user.delete({ where: { id: userId } });
    revalidateUserPages();
    return { ok: true };
  } catch {
    return { ok: false, error: "Không xóa được người dùng" };
  }
}

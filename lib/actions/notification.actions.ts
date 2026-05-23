"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

export async function markNotificationRead(id: string): Promise<Result> {
  const session = await requireAuth();
  try {
    await db.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { read: true },
    });
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Không cập nhật được" };
  }
}

export async function markAllNotificationsRead(): Promise<Result> {
  const session = await requireAuth();
  try {
    await db.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    });
    revalidatePath("/");
    return { ok: true };
  } catch {
    return { ok: false, error: "Không cập nhật được" };
  }
}

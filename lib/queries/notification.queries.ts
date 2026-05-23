import "server-only";
import { db } from "@/lib/db";

export async function getNotifications(userId: string, take = 20) {
  return db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: { userId, read: false },
  });
}

import "server-only";
import { db } from "@/lib/db";

export async function getWallet(userId: string) {
  let wallet = await db.wallet.findUnique({
    where: { userId },
    select: { id: true, balance: true, updatedAt: true },
  });
  if (!wallet) {
    wallet = await db.wallet.create({
      data: { userId, balance: 0 },
      select: { id: true, balance: true, updatedAt: true },
    });
  }
  return wallet;
}

export async function getWalletBalance(userId: string): Promise<number> {
  const wallet = await db.wallet.findUnique({
    where: { userId },
    select: { balance: true },
  });
  return wallet?.balance ?? 0;
}

export async function getTransactions(userId: string, take = 50) {
  return db.transaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      course: { select: { id: true, slug: true, title: true } },
    },
  });
}

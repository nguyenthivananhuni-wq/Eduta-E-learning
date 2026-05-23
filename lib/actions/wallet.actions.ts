"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-helpers";
import { TOPUP_MAX } from "@/lib/constants";

type Result<T = unknown> = ({ ok: true } & T) | { ok: false; error: string };

const topupSchema = z.object({
  amount: z
    .number()
    .int("Số tiền phải là số nguyên")
    .positive("Số tiền phải lớn hơn 0")
    .max(TOPUP_MAX, `Số tiền tối đa là ${TOPUP_MAX.toLocaleString("vi-VN")}đ`),
});

export async function topupWallet(input: unknown): Promise<Result<{ balance: number }>> {
  const session = await requireAuth();
  const userId = session.user.id;

  const parsed = topupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { amount } = parsed.data;

  try {
    const wallet = await db.$transaction(async (tx) => {
      // Ensure wallet exists
      await tx.wallet.upsert({
        where: { userId },
        update: {},
        create: { userId, balance: 0 },
      });

      const updated = await tx.wallet.update({
        where: { userId },
        data: { balance: { increment: amount } },
        select: { balance: true },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "TOPUP",
          status: "COMPLETED",
          amount,
          description: `Nạp ví ${amount.toLocaleString("vi-VN")}đ (mock payment)`,
        },
      });

      return updated;
    });

    revalidatePath("/wallet");
    return { ok: true, balance: wallet.balance };
  } catch {
    return { ok: false, error: "Không nạp được, vui lòng thử lại" };
  }
}

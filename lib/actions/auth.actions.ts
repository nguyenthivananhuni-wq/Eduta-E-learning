"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function registerUser(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Dữ liệu không hợp lệ" };
  }

  const { email, name, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "Email đã được sử dụng" };
  }

  const hash = await bcrypt.hash(password, 10);
  const adminEmail = process.env.ADMIN_EMAIL;

  await db.user.create({
    data: {
      email,
      name,
      password: hash,
      role: email === adminEmail ? "ADMIN" : "STUDENT",
      wallet: { create: { balance: 0 } },
    },
  });

  return { ok: true };
}

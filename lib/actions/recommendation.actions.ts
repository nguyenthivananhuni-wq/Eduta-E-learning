"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-helpers";
import { refreshRecommendations } from "@/lib/ai/recommendations";

type Result = { ok: true } | { ok: false; error: string };

export async function refreshRecommendationsAction(): Promise<Result> {
  const session = await requireAuth();
  const result = await refreshRecommendations(session.user.id, 3);
  if (!result.ok) return result;
  revalidatePath("/dashboard");
  return { ok: true };
}

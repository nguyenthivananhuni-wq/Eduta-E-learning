import { z } from "zod";

export const recommendationResponseSchema = z.object({
  recommendations: z
    .array(
      z.object({
        courseId: z.string().min(1),
        reason: z.string().min(3).max(300),
      })
    )
    .min(1)
    .max(10),
  summary: z.string().min(3).max(500),
});

export type RecommendationResponse = z.infer<typeof recommendationResponseSchema>;

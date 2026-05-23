import { z } from "zod";

export const reportTargetTypes = ["COURSE", "USER", "REVIEW"] as const;

export const reportSchema = z.object({
  targetType: z.enum(reportTargetTypes),
  targetId: z.string().min(1, "Target ID không hợp lệ"),
  reason: z
    .string()
    .min(10, "Lý do phải có ít nhất 10 ký tự")
    .max(500, "Lý do tối đa 500 ký tự"),
});

export const resolveSchema = z.object({
  resolution: z.string().min(3).max(500).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;

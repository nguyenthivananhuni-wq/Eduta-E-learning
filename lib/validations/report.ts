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

/** Hành động enforce khi admin xử lý báo cáo. NONE = chỉ ghi chú, không đụng nội dung. */
export const reportActions = [
  "NONE",
  "UNPUBLISH_COURSE",
  "DELETE_COURSE",
  "DELETE_REVIEW",
  "SUSPEND_USER",
] as const;

export type ReportAction = (typeof reportActions)[number];

/** Nhãn tiếng Việt cho hành động — dùng chung client (UI) + server (ghi resolution). */
export const reportActionLabels: Record<ReportAction, string> = {
  NONE: "Chỉ ghi chú (không hành động)",
  UNPUBLISH_COURSE: "Gỡ duyệt khóa học",
  DELETE_COURSE: "Xóa khóa học",
  DELETE_REVIEW: "Xóa đánh giá",
  SUSPEND_USER: "Khóa tài khoản người dùng",
};

/** Hành động "mạnh tay" cần bước xác nhận trên UI. */
export const destructiveActions: ReadonlySet<ReportAction> = new Set([
  "DELETE_COURSE",
  "DELETE_REVIEW",
  "SUSPEND_USER",
]);

/** Hành động hợp lệ theo loại đối tượng bị báo cáo. */
export const actionsByTarget: Record<
  (typeof reportTargetTypes)[number],
  readonly ReportAction[]
> = {
  COURSE: ["NONE", "UNPUBLISH_COURSE", "DELETE_COURSE"],
  REVIEW: ["NONE", "DELETE_REVIEW"],
  USER: ["NONE", "SUSPEND_USER"],
};

export const resolveSchema = z.object({
  action: z.enum(reportActions).default("NONE"),
  resolution: z.string().max(500).optional(),
});

export type ReportInput = z.infer<typeof reportSchema>;

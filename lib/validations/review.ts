import { z } from "zod";

export const reviewSchema = z.object({
  courseId: z.string().min(1, "Course ID không hợp lệ"),
  rating: z
    .number()
    .int()
    .min(1, "Vui lòng chọn từ 1 đến 5 sao")
    .max(5, "Tối đa 5 sao"),
  comment: z
    .string()
    .min(5, "Nhận xét phải có ít nhất 5 ký tự")
    .max(1000, "Nhận xét tối đa 1000 ký tự"),
});

export const reviewUpdateSchema = reviewSchema.omit({ courseId: true });

export type ReviewInput = z.infer<typeof reviewSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;

import { z } from "zod";

export const instructorApplicationSchema = z.object({
  bio: z
    .string()
    .min(30, "Giới thiệu phải có ít nhất 30 ký tự")
    .max(1000, "Giới thiệu tối đa 1000 ký tự"),
  expertise: z
    .string()
    .min(10, "Vui lòng nêu chuyên môn (ít nhất 10 ký tự)")
    .max(500),
  motivation: z.string().max(1000).optional(),
});

export type InstructorApplicationInput = z.infer<typeof instructorApplicationSchema>;

export const rejectApplicationSchema = z.object({
  reason: z.string().min(5, "Lý do phải có ít nhất 5 ký tự").max(500),
});

import { z } from "zod";
import { CATEGORIES } from "@/lib/constants";
import { YOUTUBE_URL_REGEX } from "@/lib/utils/youtube";

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const courseSchema = z.object({
  title: z.string().min(3, "Tiêu đề phải có ít nhất 3 ký tự").max(120),
  slug: z
    .string()
    .min(3, "Slug phải có ít nhất 3 ký tự")
    .max(80)
    .regex(slugRegex, "Slug chỉ được chứa chữ thường, số và dấu gạch ngang"),
  description: z.string().min(10, "Mô tả phải có ít nhất 10 ký tự").max(2000),
  thumbnail: z.string().url("Thumbnail phải là URL hợp lệ"),
  price: z.number().int().min(0, "Giá không được âm").max(100_000_000),
  category: z.enum(CATEGORIES, { message: "Vui lòng chọn danh mục hợp lệ" }),
});

export type CourseInput = z.infer<typeof courseSchema>;

export const moduleSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2, "Tên module phải có ít nhất 2 ký tự").max(120),
});

export const moduleUpdateSchema = z.object({
  title: z.string().min(2).max(120),
});

export type ModuleInput = z.infer<typeof moduleSchema>;

export const lessonSchema = z.object({
  moduleId: z.string().min(1),
  title: z.string().min(2, "Tên bài học phải có ít nhất 2 ký tự").max(150),
  videoUrl: z
    .string()
    .regex(YOUTUBE_URL_REGEX, "Phải là URL YouTube hợp lệ (youtube.com/watch?v=... hoặc youtu.be/...)"),
  content: z.string().max(50_000),
});

export const lessonUpdateSchema = lessonSchema.omit({ moduleId: true }).partial();

export type LessonInput = z.infer<typeof lessonSchema>;

export const quizQuestionSchema = z
  .object({
    question: z.string().min(3, "Câu hỏi phải có ít nhất 3 ký tự").max(500),
    options: z
      .array(z.string().min(1, "Đáp án không được rỗng").max(200))
      .min(2, "Cần tối thiểu 2 lựa chọn")
      .max(6, "Tối đa 6 lựa chọn"),
    correctIndex: z.number().int().min(0),
  })
  .refine((q) => q.correctIndex < q.options.length, {
    message: "Đáp án đúng không hợp lệ",
    path: ["correctIndex"],
  });

export const quizSchema = z.object({
  lessonId: z.string().min(1),
  questions: z
    .array(quizQuestionSchema)
    .min(1, "Cần ít nhất 1 câu hỏi")
    .max(20, "Tối đa 20 câu hỏi"),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizInput = z.infer<typeof quizSchema>;

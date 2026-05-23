import { z } from "zod";

const safeUrl = z
  .string()
  .url("URL không hợp lệ")
  .refine(
    (u) => {
      try {
        const parsed = new URL(u);
        const scheme = parsed.protocol.toLowerCase().replace(":", "");
        return scheme === "http" || scheme === "https";
      } catch {
        return false;
      }
    },
    { message: "Chỉ chấp nhận URL http hoặc https" }
  );

export const attachmentSchema = z.object({
  lessonId: z.string().min(1, "Lesson ID không hợp lệ"),
  name: z
    .string()
    .min(2, "Tên tài liệu phải có ít nhất 2 ký tự")
    .max(100, "Tên tài liệu tối đa 100 ký tự"),
  url: safeUrl,
});

export const attachmentUpdateSchema = attachmentSchema
  .omit({ lessonId: true })
  .partial()
  .refine((data) => data.name !== undefined || data.url !== undefined, {
    message: "Cần ít nhất 1 trường để cập nhật",
  });

export type AttachmentInput = z.infer<typeof attachmentSchema>;
export type AttachmentUpdateInput = z.infer<typeof attachmentUpdateSchema>;

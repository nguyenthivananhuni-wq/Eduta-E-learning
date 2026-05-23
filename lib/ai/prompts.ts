import "server-only";

export type UserContextItem = {
  title: string;
  category: string;
  rating: number | null;
};

export type AvailableCourse = {
  id: string;
  title: string;
  category: string;
  description: string;
  avgRating: number | null;
};

export const SYSTEM_PROMPT = `Bạn là chuyên gia gợi ý khóa học cho nền tảng học online Eduta (tiếng Việt).
Nhiệm vụ: dựa trên lịch sử học của người dùng, chọn các khóa học PHÙ HỢP NHẤT từ danh sách có sẵn.

QUY TẮC BẮT BUỘC:
- Trả lời CHỈ JSON đúng schema: { "recommendations": [{ "courseId": string, "reason": string }], "summary": string }.
- KHÔNG thêm bất kỳ text nào ngoài JSON, KHÔNG dùng markdown code fence.
- courseId PHẢI nằm trong danh sách "available courses". Không tự bịa.
- reason: 1 câu tiếng Việt, < 30 từ, giải thích vì sao phù hợp.
- summary: 1 câu tiếng Việt mô tả định hướng học tập gợi ý.`;

export function buildUserPrompt(args: {
  enrolledCourses: UserContextItem[];
  availableCourses: AvailableCourse[];
  count: number;
}): string {
  const { enrolledCourses, availableCourses, count } = args;

  const enrolledBlock = enrolledCourses.length
    ? enrolledCourses
        .map(
          (c) =>
            `- ${c.title} (${c.category})${c.rating != null ? ` — học viên đánh giá ${c.rating}/5` : ""}`
        )
        .join("\n")
    : "(người dùng chưa đăng ký khóa nào)";

  const availableBlock = availableCourses
    .map((c) => {
      const desc = c.description.slice(0, 200).replace(/\s+/g, " ").trim();
      const rating = c.avgRating != null ? `, avgRating=${c.avgRating.toFixed(1)}` : "";
      return `- id="${c.id}"${rating}, category="${c.category}", title="${c.title}", desc="${desc}"`;
    })
    .join("\n");

  return `Lịch sử học của người dùng:
${enrolledBlock}

Danh sách khóa học có sẵn (chưa đăng ký):
${availableBlock}

Hãy chọn TOP ${count} khóa phù hợp nhất và trả JSON theo schema.`;
}

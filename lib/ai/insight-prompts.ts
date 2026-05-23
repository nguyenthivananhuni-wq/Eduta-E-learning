import "server-only";
import { TOPIC_WHITELIST } from "./insight-schema";

export type ReviewSample = {
  rating: number;
  comment: string;
};

export const INSIGHT_SYSTEM_PROMPT = `Bạn là chuyên gia phân tích phản hồi học viên cho nền tảng Eduta (tiếng Việt).
Nhiệm vụ: đọc các đánh giá → tóm tắt thành ưu/nhược điểm + chủ đề chính + cảm nhận chung.

QUY TẮC BẮT BUỘC:
- Trả lời CHỈ JSON đúng schema:
  {
    "pros": string[],
    "cons": string[],
    "topics": string[],
    "sentiment": "positive" | "mixed" | "negative",
    "summary": string
  }
- KHÔNG thêm text ngoài JSON, KHÔNG dùng markdown code fence.
- pros: 2-5 câu ngắn về điểm mạnh được nhắc nhiều nhất, mỗi câu < 25 từ tiếng Việt.
- cons: 0-3 câu ngắn về điểm yếu được đề cập, mỗi câu < 25 từ.
- topics: 2-5 chủ đề chính, CHỈ chọn từ danh sách: ${TOPIC_WHITELIST.join(", ")}.
- sentiment: dựa trên rating trung bình + tone comment.
- summary: 1-2 câu tổng quát phù hợp giới thiệu cho người chưa biết khóa.
- KHÔNG bịa thông tin không có trong review. Nếu khóa toàn 5★ thì cons có thể rỗng [].`;

export function buildInsightUserPrompt(args: {
  courseTitle: string;
  courseDescription: string;
  reviews: ReviewSample[];
}): string {
  const { courseTitle, courseDescription, reviews } = args;
  const reviewBlock = reviews
    .map((r) => {
      const comment = r.comment.slice(0, 300).replace(/\s+/g, " ").trim();
      return `- [${r.rating}★] ${comment}`;
    })
    .join("\n");

  return `Khóa học: "${courseTitle}"
Mô tả: ${courseDescription.slice(0, 200)}

Tổng số đánh giá: ${reviews.length}

Các đánh giá:
${reviewBlock}

Hãy phân tích và trả JSON theo schema.`;
}

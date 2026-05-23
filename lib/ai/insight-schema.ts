import { z } from "zod";

export const TOPIC_WHITELIST = [
  "nội dung",
  "giảng viên",
  "quiz",
  "tốc độ",
  "tài liệu",
  "thực hành",
  "ngữ pháp",
  "từ vựng",
  "khác",
] as const;

export const insightResponseSchema = z.object({
  pros: z.array(z.string().min(3).max(150)).min(2).max(6),
  cons: z.array(z.string().min(3).max(150)).max(4),
  topics: z.array(z.string().min(1).max(40)).max(6),
  sentiment: z.enum(["positive", "mixed", "negative"]),
  summary: z.string().min(10).max(300),
});

export type InsightResponse = z.infer<typeof insightResponseSchema>;

export function normalizeTopics(topics: string[]): string[] {
  const set = new Set<string>();
  for (const t of topics) {
    const lower = t.toLowerCase().trim();
    const matched = TOPIC_WHITELIST.find((w) => lower.includes(w));
    if (matched) set.add(matched);
  }
  return Array.from(set).slice(0, 5);
}

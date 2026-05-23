import { Sparkles, ThumbsUp, ThumbsDown, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshInsightButton } from "./RefreshInsightButton";
import { getReviewInsight } from "@/lib/ai/review-insights";

type Props = {
  courseId: string;
  canRefresh: boolean;
};

const SENTIMENT_META: Record<string, { label: string; color: string }> = {
  positive: { label: "Phản hồi tích cực", color: "text-emerald-600 bg-emerald-500/10" },
  mixed: { label: "Phản hồi hỗn hợp", color: "text-amber-600 bg-amber-500/10" },
  negative: { label: "Phản hồi tiêu cực", color: "text-rose-600 bg-rose-500/10" },
};

export async function ReviewInsightSection({ courseId, canRefresh }: Props) {
  const insight = await getReviewInsight(courseId);

  // No insight available (no key + no cache, or < 3 reviews + no cache)
  if (!insight) return null;

  const sentimentMeta = SENTIMENT_META[insight.sentiment] ?? SENTIMENT_META.mixed!;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h3 className="flex items-center gap-2 font-semibold">
              <Sparkles className="size-4 text-primary" />
              AI phân tích {insight.sampleSize} đánh giá
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{insight.summary}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${sentimentMeta.color}`}>
              {sentimentMeta.label}
            </span>
            {canRefresh && <RefreshInsightButton courseId={courseId} />}
          </div>
        </div>

        {insight.topics.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="size-3.5 text-muted-foreground" />
            {insight.topics.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">
                {t}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          {insight.pros.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-emerald-700 dark:text-emerald-400">
                <ThumbsUp className="size-3.5" />
                Học viên thích
              </h4>
              <ul className="space-y-1.5">
                {insight.pros.map((p, i) => (
                  <li key={i} className="text-sm leading-relaxed flex gap-2">
                    <span className="text-emerald-500 shrink-0">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insight.cons.length > 0 && (
            <div>
              <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-rose-700 dark:text-rose-400">
                <ThumbsDown className="size-3.5" />
                Cần cải thiện
              </h4>
              <ul className="space-y-1.5">
                {insight.cons.map((c, i) => (
                  <li key={i} className="text-sm leading-relaxed flex gap-2">
                    <span className="text-rose-500 shrink-0">•</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground italic">
          Tự động tổng hợp bằng AI dựa trên {insight.sampleSize} đánh giá gần nhất. Cập nhật:{" "}
          {new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(
            insight.generatedAt
          )}
        </p>
      </CardContent>
    </Card>
  );
}

import { Star, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { RatingStars } from "./RatingStars";
import { cn } from "@/lib/utils/cn";
import type { RatingDistribution, RatingTrend } from "@/lib/queries/rating-stats.queries";

type Props = {
  avgRating: number | null;
  distribution: RatingDistribution;
  trend: RatingTrend;
};

const MIN_REVIEWS_FOR_CHART = 3;

export function RatingBreakdown({ avgRating, distribution, trend }: Props) {
  const { counts, total, positivePercent } = distribution;

  if (total === 0) return null;

  if (total < MIN_REVIEWS_FOR_CHART) {
    return (
      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <Star className="size-4 inline mr-2" />
        Khóa học có {total} đánh giá. Cần thêm{" "}
        {MIN_REVIEWS_FOR_CHART - total} đánh giá để xem phân phối.
      </div>
    );
  }

  const trendIcon =
    trend.diffFromOverall == null
      ? Minus
      : trend.diffFromOverall > 0.1
        ? TrendingUp
        : trend.diffFromOverall < -0.1
          ? TrendingDown
          : Minus;
  const trendColor =
    trend.diffFromOverall == null
      ? "text-muted-foreground"
      : trend.diffFromOverall > 0.1
        ? "text-emerald-600"
        : trend.diffFromOverall < -0.1
          ? "text-rose-600"
          : "text-muted-foreground";
  const TrendIcon = trendIcon;

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-start">
        {/* Average summary */}
        <div className="text-center sm:text-left sm:border-r sm:pr-6 space-y-2">
          <p className="text-4xl font-bold leading-none">
            {avgRating?.toFixed(1) ?? "—"}
          </p>
          <RatingStars value={avgRating ?? 0} size="md" />
          <p className="text-xs text-muted-foreground">
            {total} đánh giá
          </p>
          <div className="flex items-center gap-1.5 justify-center sm:justify-start">
            <div className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Star className="size-3 fill-current" />
              {positivePercent}% tích cực
            </div>
          </div>
          {trend.recentCount > 0 && trend.diffFromOverall != null && (
            <p className={cn("text-xs flex items-center gap-1 justify-center sm:justify-start", trendColor)}>
              <TrendIcon className="size-3" />
              {Math.abs(trend.diffFromOverall) < 0.05
                ? "Ổn định 30 ngày qua"
                : trend.diffFromOverall > 0
                  ? `Tăng ${trend.diffFromOverall.toFixed(1)} sao (30 ngày)`
                  : `Giảm ${Math.abs(trend.diffFromOverall).toFixed(1)} sao (30 ngày)`}
            </p>
          )}
        </div>

        {/* Distribution bars */}
        <div className="space-y-1.5">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = counts[star];
            const pct = total === 0 ? 0 : (count / total) * 100;
            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-8 text-right tabular-nums shrink-0">
                  {star} sao
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      star >= 4
                        ? "bg-emerald-500"
                        : star === 3
                          ? "bg-amber-400"
                          : "bg-rose-400"
                    )}
                    style={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
                  />
                </div>
                <span className="w-10 text-right tabular-nums text-muted-foreground shrink-0">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

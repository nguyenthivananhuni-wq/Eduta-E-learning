import Link from "next/link";
import Image from "next/image";
import { Sparkles, BookOpen, Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/reviews/RatingStars";
import { RefreshRecommendations } from "./RefreshRecommendations";
import { formatVND } from "@/lib/utils/format";
import { getPersonalizedRecommendations } from "@/lib/ai/recommendations";

type Props = {
  userId: string;
};

export async function RecommendationsSection({ userId }: Props) {
  const result = await getPersonalizedRecommendations(userId, 3);

  if (result.items.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Sparkles className="size-5 text-primary" />
            Đề xuất cho bạn
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {result.summary}
          </p>
        </div>
        <RefreshRecommendations />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((item) => (
          <Link
            key={item.courseId}
            href={`/courses/${item.course.slug}`}
            className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <div className="relative aspect-video overflow-hidden bg-muted">
              <Image
                src={item.course.thumbnail}
                alt={item.course.title}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col flex-1 p-4">
              <Badge variant="outline" className="self-start text-xs mb-2">
                {item.course.category}
              </Badge>
              <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                {item.course.title}
              </h3>
              {item.course.avgRating != null && item.course.reviewCount > 0 && (
                <div className="flex items-center gap-1.5 mt-2 text-xs">
                  <RatingStars value={item.course.avgRating} size="sm" />
                  <span className="text-muted-foreground">
                    ({item.course.reviewCount})
                  </span>
                </div>
              )}
              <div className="flex items-start gap-1.5 mt-3 rounded-md bg-primary/5 p-2.5 text-xs text-foreground/80">
                <Lightbulb className="size-3.5 text-primary shrink-0 mt-0.5" />
                <p className="leading-relaxed line-clamp-3">{item.reason}</p>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <BookOpen className="size-3" />
                  {item.course._count.modules} chương
                </span>
                <span className="font-semibold text-primary">
                  {formatVND(item.course.price)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {result.source === "fallback" && (
        <p className="text-xs text-muted-foreground mt-3 italic">
          (Đang dùng gợi ý quy tắc đơn giản. Thêm <code className="font-mono">ANTHROPIC_API_KEY</code> vào .env để bật gợi ý AI cá nhân hóa.)
        </p>
      )}
    </section>
  );
}

import Link from "next/link";
import Image from "next/image";
import { Clock, BookOpen, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/reviews/RatingStars";
import { formatVND } from "@/lib/utils/format";

type Props = {
  course: {
    slug: string;
    title: string;
    description?: string;
    thumbnail: string;
    category: string;
    price: number;
    avgRating?: number | null;
    reviewCount?: number;
    _count?: { modules: number; enrollments: number };
  };
};

export function CourseCard({ course }: Props) {
  const moduleCount = course._count?.modules ?? 0;
  const enrollmentCount = course._count?.enrollments ?? 0;
  const isComingSoon = moduleCount === 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="relative aspect-video overflow-hidden bg-muted">
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {isComingSoon && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur">
              Sắp ra mắt
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            {course.category}
          </Badge>
        </div>
        <h3 className="font-semibold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        {course.description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2 flex-1">
            {course.description}
          </p>
        )}

        {course.avgRating != null && (course.reviewCount ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 mt-3 text-xs">
            <RatingStars value={course.avgRating} size="sm" />
            <span className="font-medium">{course.avgRating.toFixed(1)}</span>
            <span className="text-muted-foreground">({course.reviewCount})</span>
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3" />
            {moduleCount} chương
          </span>
          {enrollmentCount > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {enrollmentCount} học viên
            </span>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <span className="font-semibold text-primary">{formatVND(course.price)}</span>
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
            Xem chi tiết
            <ArrowRight className="size-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

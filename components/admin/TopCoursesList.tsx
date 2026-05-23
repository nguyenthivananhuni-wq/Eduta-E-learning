import Link from "next/link";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RatingStars } from "@/components/reviews/RatingStars";
import type { TopCourseRow } from "@/lib/queries/analytics.queries";

export function TopCoursesList({ courses }: { courses: TopCourseRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-5" />
          Top khóa học (theo lượt đăng ký)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {courses.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Chưa có dữ liệu
          </p>
        ) : (
          <ul className="space-y-3">
            {courses.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3">
                <span className="size-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div className="relative size-12 shrink-0 rounded-md overflow-hidden bg-muted">
                  <Image src={c.thumbnail} alt={c.title} fill sizes="48px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/courses/${c.slug}`} className="text-sm font-medium hover:underline line-clamp-1">
                    {c.title}
                  </Link>
                  {c.avgRating != null && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <RatingStars value={c.avgRating} size="sm" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-semibold tabular-nums shrink-0">
                  {c.enrollments.toLocaleString("vi-VN")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

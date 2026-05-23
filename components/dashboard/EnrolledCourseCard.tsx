import Link from "next/link";
import Image from "next/image";
import { PlayCircle, CheckCircle2, ArrowRight, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/shared/ProgressBar";

type Props = {
  course: {
    slug: string;
    title: string;
    thumbnail: string;
    category: string;
  };
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  continueLessonId: string | null;
  lastQuizScore: number | null;
};

export function EnrolledCourseCard({
  course,
  totalLessons,
  completedLessons,
  percentage,
  continueLessonId,
  lastQuizScore,
}: Props) {
  const isCompleted = percentage === 100;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border bg-card group">
      <Link
        href={
          continueLessonId
            ? `/learn/${course.slug}/${continueLessonId}`
            : `/courses/${course.slug}`
        }
        className="relative aspect-video overflow-hidden bg-muted block"
      >
        <Image
          src={course.thumbnail}
          alt={course.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {isCompleted && (
          <div className="absolute top-3 right-3">
            <Badge variant="success" className="gap-1">
              <Trophy className="size-3" />
              Hoàn thành
            </Badge>
          </div>
        )}
      </Link>

      <div className="flex flex-col flex-1 p-5 space-y-3">
        <div>
          <Badge variant="outline" className="text-xs mb-2">
            {course.category}
          </Badge>
          <h3 className="font-semibold text-base leading-snug line-clamp-2">
            <Link
              href={`/courses/${course.slug}`}
              className="hover:text-primary transition-colors"
            >
              {course.title}
            </Link>
          </h3>
        </div>

        <ProgressBar
          value={percentage}
          label={`${completedLessons}/${totalLessons} bài`}
        />

        {lastQuizScore != null && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3 text-emerald-500" />
            Điểm quiz gần nhất: <strong className="text-foreground">{lastQuizScore}/100</strong>
          </div>
        )}

        <div className="pt-2 mt-auto">
          {continueLessonId ? (
            <Button asChild className="w-full" variant={isCompleted ? "outline" : "default"}>
              <Link href={`/learn/${course.slug}/${continueLessonId}`}>
                {isCompleted ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    Xem lại
                  </>
                ) : completedLessons === 0 ? (
                  <>
                    <PlayCircle className="size-4" />
                    Bắt đầu học
                  </>
                ) : (
                  <>
                    <PlayCircle className="size-4" />
                    Tiếp tục học
                  </>
                )}
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          ) : (
            <Button disabled className="w-full" variant="outline">
              Khóa chưa có bài học
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

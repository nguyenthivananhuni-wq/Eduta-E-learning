import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, ArrowRight, Star } from "lucide-react";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from "@/components/courses/CourseCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { RecommendationsSection } from "@/components/dashboard/RecommendationsSection";
import { getUnreviewedEnrolledCourses } from "@/lib/queries/review.queries";

function RecommendationsSkeleton() {
  return (
    <section className="mb-8">
      <Skeleton className="h-6 w-48 mb-3" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border bg-card overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export const metadata = { title: "Học của tôi" };

export default async function DashboardPage() {
  const session = await requireAuth();

  const [enrollments, unreviewed] = await Promise.all([
    db.enrollment.findMany({
      where: { userId: session.user.id },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: {
          include: { _count: { select: { modules: true, enrollments: true } } },
        },
      },
    }),
    getUnreviewedEnrolledCourses(session.user.id, 5),
  ]);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Học của tôi</h1>
        <p className="text-muted-foreground mt-1">
          Xin chào <strong>{session.user.name}</strong>, đây là các khóa học bạn đang theo học
        </p>
      </div>

      <Suspense fallback={<RecommendationsSkeleton />}>
        <RecommendationsSection userId={session.user.id} />
      </Suspense>

      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={BookOpen}
              title="Bạn chưa đăng ký khóa học nào"
              description="Khám phá danh mục khóa học để bắt đầu hành trình học tập của bạn"
              action={{ label: "Khám phá khóa học", href: "/courses" }}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {unreviewed.length > 0 && (
            <Card className="mb-8 border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/10">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="size-4 text-amber-500 fill-amber-400" />
                  <h2 className="font-semibold">Đánh giá khóa học bạn đã học</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Phản hồi của bạn giúp học viên khác và giảng viên cải thiện khóa học.
                </p>
                <ul className="space-y-2">
                  {unreviewed.map((e) => (
                    <li
                      key={e.id}
                      className="flex items-center gap-3 rounded-md bg-background p-2.5 border"
                    >
                      <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                        <Image
                          src={e.course.thumbnail}
                          alt={e.course.title}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/courses/${e.course.slug}`}
                          className="text-sm font-medium hover:underline line-clamp-1"
                        >
                          {e.course.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{e.course.category}</p>
                      </div>
                      <ReviewForm
                        courseId={e.course.id}
                        trigger={
                          <Button size="sm" variant="outline">
                            <Star className="size-3" />
                            Đánh giá
                          </Button>
                        }
                      />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              Bạn đang theo học <strong>{enrollments.length}</strong> khóa
            </p>
            <Button asChild variant="ghost" size="sm">
              <Link href="/courses">
                Tìm khóa mới
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enrollments.map((e) => (
              <CourseCard key={e.id} course={e.course} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

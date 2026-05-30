import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, BookOpen, Users, PlayCircle, FileQuestion, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { can } from "@/lib/auth/roles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { RatingStars } from "@/components/reviews/RatingStars";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { SimilarCourses } from "@/components/courses/SimilarCourses";
import { ReportButton } from "@/components/reports/ReportButton";
import { RatingBreakdown } from "@/components/reviews/RatingBreakdown";
import { ReviewInsightSection } from "@/components/reviews/ReviewInsightSection";
import {
  getRatingDistribution,
  getRatingTrend,
} from "@/lib/queries/rating-stats.queries";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/lib/utils/format";
import { getCourseBySlug, isUserEnrolled, getFirstLessonId } from "@/lib/queries/course.queries";
import { getWalletBalance } from "@/lib/queries/wallet.queries";
import { getCourseReviews, getUserReviewForCourse } from "@/lib/queries/review.queries";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Không tìm thấy khóa học" };
  return {
    title: course.title,
    description: course.description.slice(0, 160),
  };
}

export default async function CourseDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  if (!course) notFound();

  const session = await auth();
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  const isOwner = userId && course.instructorId === userId;
  const isAdmin = can(userRole, "moderate");
  if (course.status !== "APPROVED" && !isOwner && !isAdmin) notFound();

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const totalQuizzes = course.modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.quiz).length,
    0
  );
  const isComingSoon = totalLessons === 0;

  const [enrolled, firstLessonId, balance, reviews, ownReview, distribution, trend] =
    await Promise.all([
      userId ? isUserEnrolled(userId, course.id) : false,
      isComingSoon ? null : getFirstLessonId(course.id),
      userId ? getWalletBalance(userId) : 0,
      getCourseReviews(course.id),
      userId ? getUserReviewForCourse(userId, course.id) : null,
      getRatingDistribution(course.id),
      getRatingTrend(course.id, 30),
    ]);

  const canReview = enrolled && !ownReview && !isOwner;
  const canRefreshInsight = !!(isAdmin || isOwner);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <Badge variant="outline" className="mb-3">
              {course.category}
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              {course.title}
            </h1>
            <p className="text-lg text-muted-foreground mt-3">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-muted-foreground">
              {course.reviewCount > 0 && course.avgRating != null && (
                <span className="flex items-center gap-1.5">
                  <RatingStars value={course.avgRating} size="sm" />
                  <span className="font-medium text-foreground">
                    {course.avgRating.toFixed(1)}
                  </span>
                  <span>({course.reviewCount} đánh giá)</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <BookOpen className="size-4" />
                {course.modules.length} chương
              </span>
              <span className="flex items-center gap-1.5">
                <PlayCircle className="size-4" />
                {totalLessons} bài học
              </span>
              {totalQuizzes > 0 && (
                <span className="flex items-center gap-1.5">
                  <FileQuestion className="size-4" />
                  {totalQuizzes} quiz
                </span>
              )}
              {course._count.enrollments > 0 && (
                <span className="flex items-center gap-1.5">
                  <Users className="size-4" />
                  {course._count.enrollments} học viên
                </span>
              )}
            </div>

            {userId && !isOwner && (
              <div className="mt-4">
                <ReportButton
                  targetType="COURSE"
                  targetId={course.id}
                  targetLabel={course.title}
                  variant="link"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Curriculum */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Nội dung khóa học</h2>
            {isComingSoon ? (
              <div className="rounded-lg border-2 border-dashed p-10 text-center">
                <Clock className="size-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Khóa học đang được biên soạn</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Vui lòng quay lại sau. Cảm ơn bạn đã quan tâm!
                </p>
              </div>
            ) : (
              <Accordion type="multiple" defaultValue={[course.modules[0]?.id ?? ""]}>
                {course.modules.map((mod, idx) => (
                  <AccordionItem key={mod.id} value={mod.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-3 text-left">
                        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-medium">{mod.title}</p>
                          <p className="text-xs text-muted-foreground font-normal mt-0.5">
                            {mod.lessons.length} bài học
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1 pl-10">
                        {mod.lessons.map((lesson, lIdx) => (
                          <li
                            key={lesson.id}
                            className="flex items-center gap-3 py-2 text-sm"
                          >
                            <span className="text-muted-foreground text-xs w-6">
                              {lIdx + 1}.
                            </span>
                            <PlayCircle className="size-4 text-muted-foreground shrink-0" />
                            <span className="flex-1">{lesson.title}</span>
                            {lesson.quiz && (
                              <Badge variant="outline" className="text-xs">
                                Quiz
                              </Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </div>

          <Separator />

          {/* Reviews */}
          <div>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-2xl font-bold">Đánh giá học viên</h2>
                {course.reviewCount > 0 && course.avgRating != null && (
                  <div className="flex items-center gap-2 mt-1.5 text-sm text-muted-foreground">
                    <RatingStars value={course.avgRating} size="sm" />
                    <span>
                      <span className="font-semibold text-foreground">
                        {course.avgRating.toFixed(1)}
                      </span>{" "}
                      / 5 ({course.reviewCount} đánh giá)
                    </span>
                  </div>
                )}
              </div>
              {canReview && <ReviewForm courseId={course.id} />}
              {ownReview && (
                <ReviewForm
                  courseId={course.id}
                  existing={{
                    id: ownReview.id,
                    rating: ownReview.rating,
                    comment: ownReview.comment,
                  }}
                />
              )}
            </div>

            {!userId && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground mb-4">
                <Button asChild variant="link" className="p-0 h-auto">
                  <a href={`/login?callbackUrl=/courses/${course.slug}`}>Đăng nhập</a>
                </Button>{" "}
                và đăng ký khóa học để có thể đánh giá.
              </div>
            )}
            {userId && !enrolled && !isOwner && (
              <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground mb-4">
                Bạn cần đăng ký khóa học trước khi đánh giá.
              </div>
            )}

            <div className="space-y-4">
              {course.reviewCount > 0 && (
                <RatingBreakdown
                  avgRating={course.avgRating}
                  distribution={distribution}
                  trend={trend}
                />
              )}

              <ReviewInsightSection
                courseId={course.id}
                canRefresh={canRefreshInsight}
              />

              <ReviewList
                reviews={reviews}
                currentUserId={userId}
                totalCount={course.reviewCount}
              />
            </div>
          </div>
        </div>

        {/* Sidebar (sticky on lg) */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="overflow-hidden">
            <div className="relative aspect-video bg-muted">
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                sizes="(min-width: 1024px) 33vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-3xl font-bold text-primary">
                  {formatVND(course.price)}
                </p>
                {course.price > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Thanh toán 1 lần, học trọn đời
                  </p>
                )}
              </div>

              <EnrollButton
                courseId={course.id}
                slug={course.slug}
                firstLessonId={firstLessonId}
                isEnrolled={enrolled}
                isLoggedIn={!!userId}
                isComingSoon={isComingSoon}
                isOwner={!!isOwner}
                price={course.price}
                balance={balance}
              />

              {enrolled && (
                <p className="text-xs text-emerald-600 flex items-center gap-1 justify-center">
                  <CheckCircle2 className="size-3" />
                  Bạn đã đăng ký khóa học này
                </p>
              )}

              <Separator />

              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <BookOpen className="size-4 shrink-0" />
                  {course.modules.length} chương, {totalLessons} bài học
                </li>
                {totalQuizzes > 0 && (
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <FileQuestion className="size-4 shrink-0" />
                    {totalQuizzes} quiz luyện tập
                  </li>
                )}
                <li className="flex items-center gap-2 text-muted-foreground">
                  <PlayCircle className="size-4 shrink-0" />
                  Video bài giảng
                </li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>

      <SimilarCourses courseId={course.id} />
    </div>
  );
}

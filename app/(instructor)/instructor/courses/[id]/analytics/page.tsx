import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Wallet,
  CheckCircle2,
  Star,
  FileQuestion,
} from "lucide-react";
import { requireAuth } from "@/lib/auth-helpers";
import { can } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/reviews/RatingStars";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { CompletionFunnel } from "@/components/dashboard/CompletionFunnel";
import { BarChart, type BarPoint } from "@/components/charts/BarChart";
import { formatVND } from "@/lib/utils/format";
import {
  getCourseKpi,
  getCourseEnrollmentTrend,
  getCourseCompletionFunnel,
  getCourseQuizPerformance,
} from "@/lib/queries/course-analytics.queries";
import { getCourseReviews } from "@/lib/queries/review.queries";

export const metadata = { title: "Phân tích khóa học" };

type Params = Promise<{ id: string }>;

export default async function CourseAnalyticsPage({ params }: { params: Params }) {
  const session = await requireAuth();
  const { id } = await params;

  const course = await db.course.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      instructorId: true,
      status: true,
    },
  });
  if (!course) notFound();

  const isOwner = course.instructorId === session.user.id;
  const isAdmin = can(session.user.role, "moderate");
  if (!isOwner && !isAdmin) {
    redirect("/instructor/courses");
  }

  const [kpi, enrollmentTrend, funnel, quizPerf, recentReviews] = await Promise.all([
    getCourseKpi(course.id),
    getCourseEnrollmentTrend(course.id, 30),
    getCourseCompletionFunnel(course.id),
    getCourseQuizPerformance(course.id),
    getCourseReviews(course.id, 5),
  ]);

  // Map enrollment trend to RevenueChart-shaped data for visual reuse
  const enrollmentPoints = enrollmentTrend.map((p) => ({
    date: p.date,
    shortLabel: p.shortLabel,
    amount: p.count,
  }));

  const quizPoints: BarPoint[] = quizPerf
    .filter((q) => q.attempts > 0 && q.avgScore != null)
    .map((q) => ({
      label: q.lessonTitle,
      value: Math.round(q.avgScore ?? 0),
      secondary: `${q.attempts} lượt`,
      colorClass:
        (q.avgScore ?? 0) >= 80
          ? "bg-emerald-500/70"
          : (q.avgScore ?? 0) >= 50
            ? "bg-amber-400/70"
            : "bg-rose-400/70",
    }));

  const kpiCards = [
    {
      label: "Học viên",
      value: kpi.enrollments.toString(),
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Doanh thu",
      value: formatVND(kpi.revenue),
      icon: Wallet,
      color: "text-emerald-500",
    },
    {
      label: "Tỷ lệ hoàn thành",
      value: `${kpi.completionRate}%`,
      icon: CheckCircle2,
      color: "text-purple-500",
    },
    {
      label: "Đánh giá",
      value:
        kpi.avgRating != null
          ? `${kpi.avgRating.toFixed(1)} / 5`
          : "Chưa có",
      icon: Star,
      color: "text-amber-500",
    },
  ];

  return (
    <div className="container max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button asChild variant="ghost" size="sm">
          <Link href="/instructor/courses">
            <ArrowLeft className="size-4" />
            Quay lại danh sách
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={`/instructor/courses/${course.id}/edit`}>Chỉnh sửa khóa</Link>
        </Button>
      </div>

      <div>
        <Badge variant="outline" className="mb-2">
          Phân tích
        </Badge>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground mt-1">
          Trạng thái:{" "}
          {course.status === "APPROVED" ? (
            <span className="text-emerald-600 font-medium">Đã duyệt</span>
          ) : course.status === "PENDING" ? (
            <span className="text-amber-600 font-medium">Chờ duyệt</span>
          ) : course.status === "REJECTED" ? (
            <span className="text-rose-600 font-medium">Bị từ chối</span>
          ) : (
            <span className="font-medium">Bản nháp</span>
          )}
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k) => (
          <Card key={k.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{k.label}</CardTitle>
              <k.icon className={`size-4 ${k.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{k.value}</div>
              {k.label === "Đánh giá" && kpi.avgRating != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {kpi.reviewCount} đánh giá
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <RevenueChart
          title="Học viên mới (30 ngày)"
          data={enrollmentPoints}
          height={140}
        />
        <CompletionFunnel points={funnel} />
      </div>

      {/* Quiz performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileQuestion className="size-5 text-primary" />
            Hiệu suất quiz
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Điểm trung bình của học viên trên từng quiz (0-100)
          </p>
        </CardHeader>
        <CardContent>
          <BarChart
            orientation="horizontal"
            data={quizPoints}
            formatValue={(v) => `${v} điểm`}
            emptyLabel="Chưa có học viên hoàn thành quiz"
          />
        </CardContent>
      </Card>

      {/* Recent reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Đánh giá gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {recentReviews.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chưa có đánh giá nào
            </p>
          ) : (
            <ul className="divide-y">
              {recentReviews.slice(0, 5).map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{r.user.name}</span>
                        <RatingStars value={r.rating} size="sm" />
                      </div>
                      <p className="text-sm mt-1 line-clamp-3 whitespace-pre-wrap">
                        {r.comment}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground shrink-0">
                      {new Intl.DateTimeFormat("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                      }).format(r.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

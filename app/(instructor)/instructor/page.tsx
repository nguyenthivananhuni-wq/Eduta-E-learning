import Link from "next/link";
import {
  BookOpen,
  Users,
  Wallet,
  TrendingUp,
  Plus,
  MessageSquare,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import { requireInstructor } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RatingStars } from "@/components/reviews/RatingStars";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { RevenueByCourseList } from "@/components/dashboard/RevenueByCourseList";
import { formatVND } from "@/lib/utils/format";
import { getWalletBalance } from "@/lib/queries/wallet.queries";
import { getInstructorFeedback } from "@/lib/queries/review.queries";
import {
  getInstructorRevenueTrend,
  getRevenueByOwnCourse,
  getInstructorMonthlyEarningDelta,
  getInstructorStudentDelta,
  getInstructorOverallAvgRating,
} from "@/lib/queries/instructor-analytics.queries";
import { cn } from "@/lib/utils/cn";

export const metadata = { title: "Trang chủ giảng viên" };

export default async function InstructorHomePage() {
  const session = await requireInstructor();
  const userId = session.user.id;

  const [
    courses,
    balance,
    feedback,
    revenueTrend,
    revenueByCourse,
    monthlyDelta,
    studentDelta,
    ratingInfo,
  ] = await Promise.all([
    db.course.findMany({
      where: { instructorId: userId },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { enrollments: true } } },
    }),
    getWalletBalance(userId),
    getInstructorFeedback(userId, 10),
    getInstructorRevenueTrend(userId, 30),
    getRevenueByOwnCourse(userId, 5),
    getInstructorMonthlyEarningDelta(userId),
    getInstructorStudentDelta(userId),
    getInstructorOverallAvgRating(userId),
  ]);

  const totalEarning = revenueByCourse.reduce((sum, r) => sum + r.revenue, 0);
  const approvedCount = courses.filter((c) => c.status === "APPROVED").length;
  const pendingCount = courses.filter((c) => c.status === "PENDING").length;

  const deltaSubtext = (() => {
    if (monthlyDelta.deltaPercent == null && monthlyDelta.thisMonth > 0) {
      return "Mới có doanh thu tháng này";
    }
    if (monthlyDelta.deltaPercent == null) {
      return "Chưa có doanh thu tháng này";
    }
    if (monthlyDelta.deltaPercent > 0) {
      return `Tăng ${monthlyDelta.deltaPercent}% vs tháng trước`;
    }
    if (monthlyDelta.deltaPercent < 0) {
      return `Giảm ${Math.abs(monthlyDelta.deltaPercent)}% vs tháng trước`;
    }
    return "Ngang bằng tháng trước";
  })();

  const deltaIcon =
    monthlyDelta.deltaPercent == null || monthlyDelta.deltaPercent === 0
      ? Minus
      : monthlyDelta.deltaPercent > 0
        ? ArrowUpRight
        : ArrowDownRight;
  const deltaColorClass =
    monthlyDelta.deltaPercent == null || monthlyDelta.deltaPercent === 0
      ? "text-muted-foreground"
      : monthlyDelta.deltaPercent > 0
        ? "text-emerald-600"
        : "text-rose-600";

  const stats = [
    {
      label: "Khóa học của tôi",
      value: courses.length.toString(),
      subtext: `${approvedCount} đã duyệt • ${pendingCount} chờ duyệt`,
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      label: "Tổng học viên",
      value: studentDelta.total.toString(),
      subtext:
        studentDelta.thisMonth > 0
          ? `+${studentDelta.thisMonth} tháng này`
          : "Chưa có đăng ký tháng này",
      icon: Users,
      color: "text-green-500",
    },
    {
      label: "Doanh thu tháng này",
      value: formatVND(monthlyDelta.thisMonth),
      subtext: deltaSubtext,
      subtextIcon: deltaIcon,
      subtextColor: deltaColorClass,
      icon: TrendingUp,
      color: "text-purple-500",
    },
    {
      label: "Số dư ví",
      value: formatVND(balance),
      subtext: `Tổng doanh thu: ${formatVND(totalEarning)}`,
      icon: Wallet,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="container max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Xin chào, {session.user.name}</h1>
          <p className="text-muted-foreground mt-1">Tổng quan hoạt động giảng dạy</p>
        </div>
        <Button asChild>
          <Link href="/instructor/courses/new">
            <Plus className="size-4" />
            Tạo khóa mới
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => {
          const SubIcon = "subtextIcon" in s ? s.subtextIcon : null;
          return (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                <s.icon className={`size-4 ${s.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
                <p
                  className={cn(
                    "text-xs mt-1 flex items-center gap-1",
                    "subtextColor" in s ? s.subtextColor : "text-muted-foreground"
                  )}
                >
                  {SubIcon && <SubIcon className="size-3" />}
                  {s.subtext}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {ratingInfo.avgRating != null && (
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <Star className="size-8 text-amber-400 fill-amber-400 shrink-0" />
            <div className="flex-1">
              <p className="text-2xl font-bold">{ratingInfo.avgRating.toFixed(2)} / 5</p>
              <p className="text-sm text-muted-foreground">
                Trung bình đánh giá trên {ratingInfo.courseCount} khóa có review
              </p>
            </div>
            <RatingStars value={ratingInfo.avgRating} size="md" />
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueTrend} />
        <RevenueByCourseList rows={revenueByCourse} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            Phản hồi học viên
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chưa có đánh giá nào trên các khóa học của bạn
            </p>
          ) : (
            <ul className="divide-y">
              {feedback.map((r) => (
                <li key={r.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{r.user.name}</span>
                        <RatingStars value={r.rating} size="sm" />
                      </div>
                      <Link
                        href={`/courses/${r.course.slug}`}
                        className="text-xs text-muted-foreground hover:underline"
                      >
                        {r.course.title}
                      </Link>
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

      <Card>
        <CardHeader>
          <CardTitle>Khóa học gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="py-8 text-center">
              <BookOpen className="size-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                Bạn chưa có khóa học nào
              </p>
              <Button asChild>
                <Link href="/instructor/courses/new">Tạo khóa học đầu tiên</Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y">
              {courses.slice(0, 5).map((c) => (
                <li key={c.id} className="py-3 flex items-center gap-4">
                  <Link
                    href={`/instructor/courses/${c.id}/edit`}
                    className="flex-1 min-w-0 hover:underline"
                  >
                    <p className="font-medium truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {c._count.enrollments} học viên • {formatVND(c.price)}
                    </p>
                  </Link>
                  {c.status === "APPROVED" ? (
                    <Badge variant="success">Đã duyệt</Badge>
                  ) : c.status === "PENDING" ? (
                    <Badge variant="outline" className="border-amber-500 text-amber-600">
                      Chờ duyệt
                    </Badge>
                  ) : c.status === "REJECTED" ? (
                    <Badge variant="destructive">Bị từ chối</Badge>
                  ) : (
                    <Badge variant="outline">Bản nháp</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

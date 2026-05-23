import { db } from "@/lib/db";
import { AnalyticsCards } from "@/components/admin/AnalyticsCards";
import { TopCoursesList } from "@/components/admin/TopCoursesList";
import { TopInstructorsList } from "@/components/admin/TopInstructorsList";
import { UserGrowthChart } from "@/components/admin/UserGrowthChart";
import { CategoryRevenueChart } from "@/components/admin/CategoryRevenueChart";
import { ConversionStats } from "@/components/admin/ConversionStats";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import {
  getRevenueTotal,
  getInstructorEarningsTotal,
  getActiveUserCount,
  getTopCourses,
  getTopInstructors,
  getUserGrowth,
  getPlatformRevenueTrend,
  getCategoryRevenue,
  getPlatformEnrollmentTrend,
  getConversionMetrics,
} from "@/lib/queries/analytics.queries";

export const metadata = { title: "Analytics — Admin" };

export default async function AdminAnalyticsPage() {
  const [
    revenue,
    instructorEarnings,
    totalUsers,
    activeUsers30d,
    totalCourses,
    approvedCourses,
    topCourses,
    topInstructors,
    growth,
    revenueTrend,
    categoryRevenue,
    enrollmentTrend,
    conversion,
  ] = await Promise.all([
    getRevenueTotal(),
    getInstructorEarningsTotal(),
    db.user.count(),
    getActiveUserCount(30),
    db.course.count(),
    db.course.count({ where: { status: "APPROVED" } }),
    getTopCourses(5),
    getTopInstructors(5),
    getUserGrowth(30),
    getPlatformRevenueTrend(90),
    getCategoryRevenue(),
    getPlatformEnrollmentTrend(30),
    getConversionMetrics(),
  ]);

  // Adapt enrollment trend points → reuse RevenueChart shape (label + amount)
  const enrollmentChartData = enrollmentTrend.map((p) => ({
    date: p.date,
    shortLabel: p.shortLabel,
    amount: p.count,
  }));

  return (
    <div className="container max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Tổng quan hoạt động và doanh thu nền tảng
        </p>
      </div>

      <AnalyticsCards
        revenue={revenue}
        instructorEarnings={instructorEarnings}
        totalUsers={totalUsers}
        activeUsers30d={activeUsers30d}
        totalCourses={totalCourses}
        approvedCourses={approvedCourses}
      />

      <RevenueChart title="Doanh thu 90 ngày qua" data={revenueTrend} height={160} />

      <ConversionStats metrics={conversion} />

      <div className="grid lg:grid-cols-2 gap-6">
        <RevenueChart title="Lượt đăng ký 30 ngày" data={enrollmentChartData} />
        <UserGrowthChart data={growth} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <TopCoursesList courses={topCourses} />
        <TopInstructorsList instructors={topInstructors} />
      </div>

      <CategoryRevenueChart rows={categoryRevenue} />
    </div>
  );
}

import { TrendingUp, Users, BookOpen, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatVND } from "@/lib/utils/format";

type Props = {
  revenue: number;
  instructorEarnings: number;
  totalUsers: number;
  activeUsers30d: number;
  totalCourses: number;
  approvedCourses: number;
};

export function AnalyticsCards({
  revenue,
  instructorEarnings,
  totalUsers,
  activeUsers30d,
  totalCourses,
  approvedCourses,
}: Props) {
  const platformShare = revenue - instructorEarnings;

  const cards = [
    {
      label: "Tổng doanh thu",
      value: formatVND(revenue),
      sub: `Nền tảng giữ ${formatVND(platformShare)}`,
      icon: Wallet,
      color: "text-primary",
    },
    {
      label: "Trả giảng viên",
      value: formatVND(instructorEarnings),
      sub: "70% từ mỗi lượt mua",
      icon: TrendingUp,
      color: "text-emerald-500",
    },
    {
      label: "Người dùng",
      value: totalUsers.toLocaleString("vi-VN"),
      sub: `${activeUsers30d} hoạt động trong 30 ngày`,
      icon: Users,
      color: "text-blue-500",
    },
    {
      label: "Khóa học",
      value: totalCourses.toLocaleString("vi-VN"),
      sub: `${approvedCourses} đã duyệt`,
      icon: BookOpen,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{c.label}</CardTitle>
            <c.icon className={`size-4 ${c.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{c.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

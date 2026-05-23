import { Target, Wallet, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { ConversionMetrics } from "@/lib/queries/analytics.queries";

type Row = {
  icon: typeof Target;
  label: string;
  value: number; // 0-100
  count: number;
  total: number;
  description: string;
  color: string;
};

export function ConversionStats({ metrics }: { metrics: ConversionMetrics }) {
  const rows: Row[] = [
    {
      icon: Wallet,
      label: "Tỷ lệ học viên đã mua khóa",
      value: metrics.payingPercent,
      count: metrics.payingCount,
      total: metrics.totalStudents,
      description: "Số học viên đã có ít nhất 1 giao dịch mua thành công",
      color: "text-emerald-500",
    },
    {
      icon: GraduationCap,
      label: "Tỷ lệ học viên đã học",
      value: metrics.activeLearnersPercent,
      count: metrics.activeLearnersCount,
      total: metrics.totalStudents,
      description: "Số học viên đã hoàn thành ít nhất 1 bài học",
      color: "text-blue-500",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="size-5" />
          Tỷ lệ chuyển đổi (ước tính)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tổng {metrics.totalStudents} học viên đăng ký
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid sm:grid-cols-2 gap-4">
          {rows.map((r) => (
            <div key={r.label} className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <r.icon className={cn("size-4", r.color)} />
                <p className="text-sm font-medium">{r.label}</p>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums">
                  {r.value.toFixed(0)}%
                </span>
                <span className="text-xs text-muted-foreground">
                  ({r.count} / {r.total})
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    r.color.replace("text-", "bg-")
                  )}
                  style={{ width: `${Math.max(2, r.value)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{r.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

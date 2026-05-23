import { GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, type BarPoint } from "@/components/charts/BarChart";
import type { FunnelPoint } from "@/lib/queries/course-analytics.queries";

type Props = {
  points: FunnelPoint[];
};

export function CompletionFunnel({ points }: Props) {
  const data: BarPoint[] = points.map((p) => ({
    label: p.label,
    value: p.pct,
    secondary: `${p.completed}/${p.total}`,
    colorClass:
      p.pct >= 70
        ? "bg-emerald-500/70"
        : p.pct >= 30
          ? "bg-amber-400/70"
          : "bg-rose-400/70",
  }));

  const dropoff = (() => {
    if (points.length < 2) return null;
    const first = points[0]!;
    const last = points[points.length - 1]!;
    if (first.completed === 0) return null;
    const lostPct = Math.round(((first.completed - last.completed) / first.completed) * 100);
    if (lostPct <= 0) return null;
    return lostPct;
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="size-5 text-primary" />
          Tỷ lệ hoàn thành bài học
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {dropoff != null
            ? `${dropoff}% học viên đã dừng giữa chừng — bài học cuối cần điều chỉnh.`
            : "Tỷ lệ học viên đã hoàn thành từng bài."}
        </p>
      </CardHeader>
      <CardContent>
        <BarChart
          orientation="horizontal"
          data={data}
          formatValue={(v) => `${Math.round(v)}%`}
          emptyLabel="Chưa có học viên hoàn thành bài học nào"
        />
      </CardContent>
    </Card>
  );
}

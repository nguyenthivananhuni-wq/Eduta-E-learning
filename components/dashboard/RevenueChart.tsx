import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, type BarPoint } from "@/components/charts/BarChart";
import { formatVND } from "@/lib/utils/format";
import type { DailyRevenuePoint } from "@/lib/queries/instructor-analytics.queries";

type Props = {
  title?: string;
  data: DailyRevenuePoint[];
  height?: number;
};

export function RevenueChart({
  title = "Doanh thu 30 ngày qua",
  data,
  height = 140,
}: Props) {
  const points: BarPoint[] = data.map((d) => ({
    label: d.shortLabel,
    value: d.amount,
  }));
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5 text-primary" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tổng: <strong className="text-foreground">{formatVND(total)}</strong>
        </p>
      </CardHeader>
      <CardContent>
        <BarChart
          orientation="vertical"
          data={points}
          height={height}
          formatValue={(v) => formatVND(v)}
          emptyLabel="Chưa có doanh thu trong 30 ngày qua"
          sparseXLabels
        />
      </CardContent>
    </Card>
  );
}

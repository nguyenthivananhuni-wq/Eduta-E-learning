import { Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, type BarPoint } from "@/components/charts/BarChart";
import { formatVND } from "@/lib/utils/format";
import type { CategoryRevenueRow } from "@/lib/queries/analytics.queries";

const CATEGORY_COLORS: Record<string, string> = {
  "Lập trình": "bg-blue-500/70",
  "Thiết kế": "bg-purple-500/70",
  "Kinh doanh": "bg-amber-500/70",
  "Ngoại ngữ": "bg-emerald-500/70",
};

export function CategoryRevenueChart({ rows }: { rows: CategoryRevenueRow[] }) {
  const data: BarPoint[] = rows.map((r) => ({
    label: r.category,
    value: r.revenue,
    colorClass: CATEGORY_COLORS[r.category] ?? "bg-primary/70",
  }));
  const total = rows.reduce((sum, r) => sum + r.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="size-5" />
          Doanh thu theo danh mục
        </CardTitle>
        {total > 0 && (
          <p className="text-sm text-muted-foreground">
            Tổng: <strong className="text-foreground">{formatVND(total)}</strong>
          </p>
        )}
      </CardHeader>
      <CardContent>
        <BarChart
          orientation="horizontal"
          data={data}
          formatValue={(v) => formatVND(v)}
          emptyLabel="Chưa có doanh thu theo danh mục"
        />
      </CardContent>
    </Card>
  );
}

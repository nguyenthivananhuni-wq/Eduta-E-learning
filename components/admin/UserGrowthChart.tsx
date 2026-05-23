import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GrowthPoint } from "@/lib/queries/analytics.queries";

export function UserGrowthChart({ data }: { data: GrowthPoint[] }) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  const totalNew = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5" />
          Người dùng mới (30 ngày)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tổng {totalNew} người đăng ký mới
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-32">
          {data.map((point) => {
            const heightPct = (point.count / maxCount) * 100;
            return (
              <div
                key={point.date}
                className="flex-1 flex flex-col justify-end group relative"
                title={`${point.date}: ${point.count}`}
              >
                <div
                  className="w-full rounded-t bg-primary/20 group-hover:bg-primary transition"
                  style={{ height: `${Math.max(2, heightPct)}%` }}
                />
                {point.count > 0 && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition bg-foreground text-background px-1 rounded">
                    {point.count}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{data[0]?.date.slice(5)}</span>
          <span>{data[Math.floor(data.length / 2)]?.date.slice(5)}</span>
          <span>{data[data.length - 1]?.date.slice(5)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

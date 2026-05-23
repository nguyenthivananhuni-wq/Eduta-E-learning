import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, type BarPoint } from "@/components/charts/BarChart";
import { formatVND } from "@/lib/utils/format";
import type { CourseRevenueRow } from "@/lib/queries/instructor-analytics.queries";

type Props = {
  rows: CourseRevenueRow[];
  emptyHint?: string;
};

export function RevenueByCourseList({
  rows,
  emptyHint = "Chưa có doanh thu",
}: Props) {
  const points: BarPoint[] = rows.map((r) => ({
    label: r.title,
    value: r.revenue,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-5" />
          Doanh thu theo khóa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <BarChart
          orientation="horizontal"
          data={points}
          formatValue={(v) => formatVND(v)}
          emptyLabel={emptyHint}
        />
        {rows.length > 0 && (
          <ul className="text-xs text-muted-foreground space-y-1 pt-1 border-t">
            {rows.map((r) => (
              <li key={r.courseId}>
                <Link href={`/courses/${r.slug}`} className="hover:underline truncate inline-block max-w-full">
                  {r.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

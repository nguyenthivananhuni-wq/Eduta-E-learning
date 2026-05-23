import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  courseCount: number;
  completedLessons: number;
  hoursStudied: number;
};

export function StatsCards({ courseCount, completedLessons, hoursStudied }: Props) {
  const stats = [
    {
      label: "Khóa học đã đăng ký",
      value: courseCount,
      icon: BookOpen,
      bgClass: "bg-blue-500/10",
      iconClass: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Bài học đã hoàn thành",
      value: completedLessons,
      icon: CheckCircle2,
      bgClass: "bg-emerald-500/10",
      iconClass: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Số giờ học (ước lượng)",
      value: `${hoursStudied}h`,
      icon: Clock,
      bgClass: "bg-amber-500/10",
      iconClass: "text-amber-600 dark:text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="p-5 flex items-center gap-4">
            <div className={`size-12 rounded-lg ${s.bgClass} flex items-center justify-center shrink-0`}>
              <s.icon className={`size-6 ${s.iconClass}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold mt-0.5 tabular-nums">{s.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

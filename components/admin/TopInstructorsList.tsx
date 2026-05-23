import { GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatVND } from "@/lib/utils/format";
import type { TopInstructorRow } from "@/lib/queries/analytics.queries";

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function TopInstructorsList({ instructors }: { instructors: TopInstructorRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="size-5" />
          Top giảng viên (theo doanh thu)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {instructors.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Chưa có dữ liệu doanh thu
          </p>
        ) : (
          <ul className="space-y-3">
            {instructors.map((u, i) => (
              <li key={u.id} className="flex items-center gap-3">
                <span className="size-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    {getInitials(u.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <p className="text-sm font-semibold tabular-nums shrink-0">
                  {formatVND(u.earnings)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

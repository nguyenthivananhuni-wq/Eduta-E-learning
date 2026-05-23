"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  UserPlus,
  Users,
  Receipt,
  Flag,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

const iconMap: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  book: BookOpen,
  pending: ClipboardCheck,
  applications: UserPlus,
  users: Users,
  transactions: Receipt,
  analytics: TrendingUp,
  reports: Flag,
};

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof iconMap;
  badge?: number;
};

export function AdminNavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <>
      {items.map((item) => {
        const Icon = iconMap[item.icon] ?? LayoutDashboard;
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-4" />
            <span className="flex-1">{item.label}</span>
            {item.badge != null && item.badge > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">
                {item.badge > 99 ? "99+" : item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </>
  );
}

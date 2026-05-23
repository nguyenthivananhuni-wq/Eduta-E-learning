"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Wallet } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/instructor", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/instructor/courses", label: "Khóa học của tôi", icon: BookOpen },
  { href: "/wallet", label: "Ví & doanh thu", icon: Wallet },
];

export function InstructorNavLinks() {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/instructor" && pathname.startsWith(item.href));
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
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

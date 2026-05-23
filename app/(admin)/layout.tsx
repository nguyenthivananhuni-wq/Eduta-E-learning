import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { AdminNavLinks } from "@/components/admin/AdminNavLinks";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdmin();

  const [pendingCourses, pendingApps, pendingReports] = await Promise.all([
    db.course.count({ where: { status: "PENDING" } }),
    db.instructorApplication.count({ where: { status: "PENDING" } }),
    db.report.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 flex flex-col">
        <Link
          href="/admin"
          className="flex items-center gap-2 px-6 h-16 border-b font-bold text-lg"
        >
          <GraduationCap className="size-5 text-primary" />
          <span>Eduta Admin</span>
        </Link>

        <nav className="flex-1 p-4 space-y-1">
          <AdminNavLinks
            items={[
              { href: "/admin/analytics", label: "Analytics", icon: "analytics" },
              { href: "/admin/users", label: "Người dùng", icon: "users" },
              { href: "/admin/courses", label: "Khóa học", icon: "book" },
              {
                href: "/admin/courses/pending",
                label: "Duyệt khóa học",
                icon: "pending",
                badge: pendingCourses,
              },
              {
                href: "/admin/instructor-applications",
                label: "Đơn giảng viên",
                icon: "applications",
                badge: pendingApps,
              },
              { href: "/admin/transactions", label: "Giao dịch", icon: "transactions" },
              {
                href: "/admin/reports",
                label: "Báo cáo",
                icon: "reports",
                badge: pendingReports,
              },
            ]}
          />
        </nav>

        <div className="p-4 border-t space-y-2">
          <div className="text-xs text-muted-foreground truncate">
            {session.user.email}
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Về trang chủ
          </Link>
          <SignOutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}

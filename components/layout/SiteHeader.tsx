import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { getNotifications, getUnreadCount } from "@/lib/queries/notification.queries";

export async function SiteHeader() {
  const session = await auth();
  const [notifications, unreadCount] = session?.user
    ? await Promise.all([
        getNotifications(session.user.id, 10),
        getUnreadCount(session.user.id),
      ])
    : [[], 0];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <GraduationCap className="size-6 text-primary" />
          <span>Eduta</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/courses">Khóa học</Link>
          </Button>
          {session?.user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/dashboard">Học của tôi</Link>
              </Button>
              <NotificationBell notifications={notifications} unreadCount={unreadCount} />
              <UserMenu
                user={{
                  name: session.user.name ?? "User",
                  email: session.user.email ?? "",
                  role: session.user.role,
                }}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Đăng nhập</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Đăng ký</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

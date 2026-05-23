"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell, BellRing, CheckCheck } from "lucide-react";
import type { Notification } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/actions/notification.actions";

type Props = {
  notifications: Notification[];
  unreadCount: number;
};

function formatRelative(d: Date): string {
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit" }).format(d);
}

export function NotificationBell({ notifications, unreadCount }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = (id: string, read: boolean, link: string | null) => {
    if (!read) {
      startTransition(async () => {
        await markNotificationRead(id);
        router.refresh();
      });
    }
    if (link) router.push(link);
  };

  const handleMarkAll = () => {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="size-5" />
          ) : (
            <Bell className="size-5" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2">
          <DropdownMenuLabel>Thông báo</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={handleMarkAll}
              disabled={isPending}
            >
              <CheckCheck className="size-3" />
              Đọc tất cả
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Chưa có thông báo nào
          </div>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleClick(n.id, n.read, n.link)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 hover:bg-accent transition flex gap-2",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <span
                    className={cn(
                      "size-2 rounded-full mt-1.5 shrink-0",
                      n.read ? "bg-transparent" : "bg-primary"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatRelative(n.createdAt)}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

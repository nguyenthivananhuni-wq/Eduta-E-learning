"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Shield, LogOut, Wallet, GraduationCap } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type Props = {
  user: { name: string; email: string; role: "STUDENT" | "INSTRUCTOR" | "ADMIN" };
};

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

export function UserMenu({ user }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="size-4" />
            Học của tôi
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/wallet">
            <Wallet className="size-4" />
            Ví của tôi
          </Link>
        </DropdownMenuItem>
        {(user.role === "INSTRUCTOR" || user.role === "ADMIN") && (
          <DropdownMenuItem asChild>
            <Link href="/instructor">
              <GraduationCap className="size-4" />
              Khu vực giảng viên
            </Link>
          </DropdownMenuItem>
        )}
        {user.role === "ADMIN" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <Shield className="size-4" />
              Trang quản trị
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            signOut({ callbackUrl: "/" });
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="size-4" />
          Đăng xuất
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

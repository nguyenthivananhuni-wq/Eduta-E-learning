"use client";

import { useTransition } from "react";
import { signOut } from "next-auth/react";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut({ callbackUrl: "/" });
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      Đăng xuất
    </Button>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container max-w-md mx-auto px-4 py-20 text-center">
      <div className="rounded-full bg-destructive/10 p-4 inline-flex mb-4">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Đã có lỗi xảy ra</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Không tải được nội dung. Vui lòng thử lại.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        <Button onClick={reset}>
          <RotateCcw className="size-4" />
          Thử lại
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard">
            <LayoutDashboard className="size-4" />
            Về trang cá nhân
          </Link>
        </Button>
      </div>
    </div>
  );
}

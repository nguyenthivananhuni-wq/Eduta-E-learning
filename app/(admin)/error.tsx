"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
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
    <div className="container max-w-md mx-auto px-6 py-20 text-center">
      <div className="rounded-full bg-destructive/10 p-4 inline-flex mb-4">
        <AlertCircle className="size-8 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Lỗi quản trị</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Có lỗi xảy ra khi xử lý thao tác. Kiểm tra console để xem chi tiết.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        <Button onClick={reset}>
          <RotateCcw className="size-4" />
          Thử lại
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin">
            <Shield className="size-4" />
            Về trang quản trị
          </Link>
        </Button>
      </div>
    </div>
  );
}

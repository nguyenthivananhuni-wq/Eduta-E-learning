"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PublicError({
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
        Hệ thống đang gặp sự cố. Vui lòng thử lại sau ít phút.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        <Button onClick={reset}>
          <RotateCcw className="size-4" />
          Thử lại
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="size-4" />
            Về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  );
}

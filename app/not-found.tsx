import Link from "next/link";
import { Home, Search, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl mb-8">
        <GraduationCap className="size-6 text-primary" />
        <span>Eduta</span>
      </Link>

      <p className="text-7xl sm:text-8xl font-bold text-primary tabular-nums">404</p>
      <h1 className="text-2xl sm:text-3xl font-bold mt-4">
        Không tìm thấy trang
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        Trang bạn đang tìm có thể đã bị xóa, đổi tên, hoặc tạm thời không khả dụng.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row items-center gap-2">
        <Button asChild>
          <Link href="/">
            <Home className="size-4" />
            Về trang chủ
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/courses">
            <Search className="size-4" />
            Duyệt khóa học
          </Link>
        </Button>
      </div>
    </main>
  );
}

import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t mt-16 bg-muted/30">
      <div className="container mx-auto px-4 py-10 grid gap-8 md:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <GraduationCap className="size-5 text-primary" />
            <span>Eduta</span>
          </Link>
          <p className="text-sm text-muted-foreground mt-2 max-w-xs">
            Nền tảng học trực tuyến hiện đại. Học mọi lúc, mọi nơi.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm">Khám phá</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/courses" className="hover:text-foreground">
                Tất cả khóa học
              </Link>
            </li>
            <li>
              <Link href="/courses?category=Ngo%E1%BA%A1i%20ng%E1%BB%AF" className="hover:text-foreground">
                Ngoại ngữ
              </Link>
            </li>
            <li>
              <Link href="/courses?category=L%E1%BA%ADp%20tr%C3%ACnh" className="hover:text-foreground">
                Lập trình
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-3 text-sm">Tài khoản</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/login" className="hover:text-foreground">
                Đăng nhập
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-foreground">
                Đăng ký
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-foreground">
                Học của tôi
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Eduta · Đồ án sinh viên
        </div>
      </div>
    </footer>
  );
}

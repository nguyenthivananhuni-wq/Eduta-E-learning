import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Đăng nhập" };

type SearchParams = Promise<{ suspended?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { suspended } = await searchParams;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Đăng nhập</CardTitle>
        <CardDescription>
          Nhập email và mật khẩu để tiếp tục học
        </CardDescription>
      </CardHeader>
      <CardContent>
        {suspended && (
          <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>
              Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ hỗ trợ nếu cần làm rõ.
            </span>
          </div>
        )}
        <LoginForm />
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <span className="text-muted-foreground">Chưa có tài khoản?</span>
        <Link
          href="/register"
          className="ml-1 font-medium text-primary hover:underline"
        >
          Đăng ký ngay
        </Link>
      </CardFooter>
    </Card>
  );
}

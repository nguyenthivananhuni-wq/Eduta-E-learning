import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Đăng nhập" };

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Đăng nhập</CardTitle>
        <CardDescription>
          Nhập email và mật khẩu để tiếp tục học
        </CardDescription>
      </CardHeader>
      <CardContent>
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

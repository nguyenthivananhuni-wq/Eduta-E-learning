import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Đăng ký" };

export default function RegisterPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
        <CardDescription>
          Bắt đầu hành trình học tập của bạn — hoàn toàn miễn phí
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <span className="text-muted-foreground">Đã có tài khoản?</span>
        <Link
          href="/login"
          className="ml-1 font-medium text-primary hover:underline"
        >
          Đăng nhập
        </Link>
      </CardFooter>
    </Card>
  );
}

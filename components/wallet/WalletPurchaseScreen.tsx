"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Wallet, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatVND } from "@/lib/utils/format";
import { enrollCourse } from "@/lib/actions/enrollment.actions";

type Props = {
  course: {
    id: string;
    title: string;
    thumbnail: string;
    price: number;
  };
  balance: number;
};

export function WalletPurchaseScreen({ course, balance }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const insufficient = balance < course.price;
  const remaining = balance - course.price;

  const handleConfirm = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await enrollCourse(course.id);
      if (res.ok) {
        toast.success("Mua khóa học thành công! 🎉");
        router.push(`/learn/${res.slug}/${res.firstLessonId}`);
        router.refresh();
      } else {
        setErrorMsg(res.error);
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="container max-w-2xl mx-auto px-4 py-10 space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.back()}>
        <ArrowLeft className="size-4" />
        Quay lại
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Xác nhận thanh toán</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex gap-4">
            <div className="relative size-24 shrink-0 overflow-hidden rounded-lg bg-muted">
              <Image
                src={course.thumbnail}
                alt={course.title}
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1">Khóa học</p>
              <h3 className="font-medium leading-snug">{course.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Học trọn đời sau khi thanh toán
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Wallet className="size-4" />
                Số dư ví
              </span>
              <span className="font-medium">{formatVND(balance)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Giá khóa học</span>
              <span className="font-medium">-{formatVND(course.price)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Số dư còn lại</span>
              <span className={insufficient ? "text-destructive" : "text-primary"}>
                {insufficient
                  ? `Thiếu ${formatVND(course.price - balance)}`
                  : formatVND(remaining)}
              </span>
            </div>
          </div>

          {insufficient ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-3">
              <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-destructive">Số dư không đủ</p>
                <p className="text-destructive/80 text-xs mt-0.5">
                  Vui lòng nạp thêm tiền vào ví để tiếp tục mua khóa học.
                </p>
              </div>
            </div>
          ) : null}

          {errorMsg && (
            <p className="text-sm text-destructive" role="alert">
              {errorMsg}
            </p>
          )}

          <div className="flex gap-2 justify-end pt-2">
            {insufficient ? (
              <Button asChild>
                <Link href="/wallet">
                  <Wallet className="size-4" />
                  Nạp tiền vào ví
                </Link>
              </Button>
            ) : (
              <Button onClick={handleConfirm} disabled={isPending} size="lg">
                {isPending && <Loader2 className="size-4 animate-spin" />}
                Xác nhận thanh toán {formatVND(course.price)}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        Thanh toán trừ thẳng từ ví Eduta. Không hoàn tiền sau khi mua.
      </p>
    </div>
  );
}

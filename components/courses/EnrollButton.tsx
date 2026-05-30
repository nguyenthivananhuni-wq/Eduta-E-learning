"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlayCircle, ShoppingCart, LogIn, Ban, Loader2, Wallet, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { enrollCourse } from "@/lib/actions/enrollment.actions";
import { formatVND } from "@/lib/utils/format";

type Props = {
  courseId: string;
  slug: string;
  firstLessonId: string | null;
  isEnrolled: boolean;
  isLoggedIn: boolean;
  isComingSoon: boolean;
  isOwner?: boolean;
  price: number;
  balance: number;
};

export function EnrollButton({
  courseId,
  slug,
  firstLessonId,
  isEnrolled,
  isLoggedIn,
  isComingSoon,
  isOwner,
  price,
  balance,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Chủ khóa học không thể tự ghi danh — hiện lối quản lý thay vì nút mua/học.
  if (isOwner) {
    return (
      <Button size="lg" variant="outline" asChild className="w-full">
        <Link href={`/instructor/courses/${courseId}/edit`}>
          <Pencil className="size-4" />
          Quản lý khóa học của bạn
        </Link>
      </Button>
    );
  }

  if (isComingSoon) {
    return (
      <Button size="lg" disabled className="w-full">
        <Ban className="size-4" />
        Khóa học sắp ra mắt
      </Button>
    );
  }

  if (!isLoggedIn) {
    const target = price === 0 ? `/courses/${slug}` : `/checkout/${courseId}`;
    return (
      <Button size="lg" asChild className="w-full">
        <Link href={`/login?callbackUrl=${encodeURIComponent(target)}`}>
          <LogIn className="size-4" />
          Đăng nhập để học
        </Link>
      </Button>
    );
  }

  if (isEnrolled && firstLessonId) {
    return (
      <Button size="lg" asChild className="w-full">
        <Link href={`/learn/${slug}/${firstLessonId}`}>
          <PlayCircle className="size-4" />
          Vào học ngay
        </Link>
      </Button>
    );
  }

  // Free course — enroll immediately
  if (price === 0) {
    const handleFreeEnroll = () => {
      startTransition(async () => {
        const res = await enrollCourse(courseId);
        if (res.ok) {
          toast.success("Đăng ký thành công 🎉");
          router.push(`/learn/${res.slug}/${res.firstLessonId}`);
          router.refresh();
        } else {
          toast.error(res.error);
        }
      });
    };
    return (
      <Button size="lg" onClick={handleFreeEnroll} disabled={isPending} className="w-full">
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <PlayCircle className="size-4" />
        )}
        Học miễn phí
      </Button>
    );
  }

  // Paid — check balance
  if (balance < price) {
    return (
      <div className="space-y-2">
        <Button size="lg" asChild className="w-full" variant="outline">
          <Link href="/wallet">
            <Wallet className="size-4" />
            Nạp ví để mua khóa học
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Số dư ví: {formatVND(balance)} • Cần thêm {formatVND(price - balance)}
        </p>
      </div>
    );
  }

  return (
    <Button size="lg" asChild className="w-full">
      <Link href={`/checkout/${courseId}`}>
        <ShoppingCart className="size-4" />
        Mua khóa học
      </Link>
    </Button>
  );
}

import Link from "next/link";
import { ArrowDownToLine, ShoppingBag, TrendingUp, Receipt } from "lucide-react";
import type { TransactionType, TransactionStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { formatVNDSigned } from "@/lib/utils/format";

type TxRow = {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: number;
  description: string | null;
  createdAt: Date;
  course: { id: string; slug: string; title: string } | null;
};

type Props = {
  transactions: TxRow[];
};

const TYPE_META: Record<TransactionType, { label: string; icon: typeof Receipt }> = {
  TOPUP: { label: "Nạp ví", icon: ArrowDownToLine },
  PURCHASE: { label: "Mua khóa học", icon: ShoppingBag },
  EARNING: { label: "Doanh thu", icon: TrendingUp },
  REFUND: { label: "Hoàn tiền", icon: Receipt },
};

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

export function TransactionList({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed py-12 text-center">
        <Receipt className="size-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">Chưa có giao dịch nào</p>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {transactions.map((tx) => {
        const meta = TYPE_META[tx.type];
        const Icon = meta.icon;
        const isPositive = tx.amount > 0;
        return (
          <li key={tx.id} className="flex items-center gap-4 p-4">
            <div
              className={cn(
                "size-10 rounded-full flex items-center justify-center shrink-0",
                isPositive ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
              )}
            >
              <Icon className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm">{meta.label}</p>
                {tx.status !== "COMPLETED" && (
                  <Badge variant="outline" className="text-xs">
                    {tx.status === "PENDING" ? "Đang xử lý" : "Thất bại"}
                  </Badge>
                )}
              </div>
              {tx.course ? (
                <Link
                  href={`/courses/${tx.course.slug}`}
                  className="text-xs text-muted-foreground truncate block hover:underline"
                >
                  {tx.description ?? tx.course.title}
                </Link>
              ) : (
                <p className="text-xs text-muted-foreground truncate">
                  {tx.description ?? ""}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(tx.createdAt)}
              </p>
            </div>
            <p
              className={cn(
                "font-semibold tabular-nums shrink-0",
                isPositive ? "text-emerald-600" : "text-rose-600"
              )}
            >
              {formatVNDSigned(tx.amount)}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

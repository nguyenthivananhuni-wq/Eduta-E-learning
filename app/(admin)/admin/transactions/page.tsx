import { Receipt } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionFilters } from "@/components/admin/TransactionFilters";
import { formatVNDSigned } from "@/lib/utils/format";

export const metadata = { title: "Giao dịch — Admin" };
export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  TOPUP: "Nạp ví",
  PURCHASE: "Mua khóa",
  EARNING: "Doanh thu",
  REFUND: "Hoàn tiền",
};

const TYPE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  TOPUP: "secondary",
  PURCHASE: "outline",
  EARNING: "default",
  REFUND: "outline",
};

type SearchParams = Promise<{ q?: string; type?: string }>;

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 100) : undefined;
  const type =
    sp.type && ["TOPUP", "PURCHASE", "EARNING", "REFUND"].includes(sp.type)
      ? (sp.type as "TOPUP" | "PURCHASE" | "EARNING" | "REFUND")
      : undefined;

  const transactions = await db.transaction.findMany({
    where: {
      ...(type ? { type } : {}),
      ...(q
        ? {
            OR: [
              { description: { contains: q } },
              { user: { email: { contains: q } } },
              { user: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true } },
      course: { select: { id: true, slug: true, title: true } },
    },
  });

  return (
    <div className="container max-w-6xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Receipt className="size-7" />
          Giao dịch
        </h1>
        <p className="text-muted-foreground mt-1">
          Tổng {transactions.length} giao dịch gần nhất
        </p>
      </div>

      <TransactionFilters />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thời gian</TableHead>
                <TableHead>Người dùng</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Khóa học</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Intl.DateTimeFormat("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(t.createdAt)}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{t.user.name}</p>
                    <p className="text-xs text-muted-foreground">{t.user.email}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={TYPE_VARIANT[t.type]}>{TYPE_LABEL[t.type]}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {t.course ? t.course.title : "—"}
                  </TableCell>
                  <TableCell className="text-xs max-w-xs truncate">
                    {t.description}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold tabular-nums ${
                      t.amount > 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {formatVNDSigned(t.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

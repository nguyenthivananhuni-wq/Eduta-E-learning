"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export function TransactionFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const type = sp.get("type") ?? ALL;

  useEffect(() => {
    const initial = sp.get("q") ?? "";
    if (q === initial) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      startTransition(() => router.replace(`/admin/transactions?${params.toString()}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const handleType = (v: string) => {
    const params = new URLSearchParams(sp.toString());
    if (v === ALL) params.delete("type");
    else params.set("type", v);
    startTransition(() => router.replace(`/admin/transactions?${params.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo email người dùng hoặc nội dung..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={type} onValueChange={handleType}>
        <SelectTrigger className="sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tất cả loại</SelectItem>
          <SelectItem value="TOPUP">Nạp ví</SelectItem>
          <SelectItem value="PURCHASE">Mua khóa học</SelectItem>
          <SelectItem value="EARNING">Doanh thu giảng viên</SelectItem>
          <SelectItem value="REFUND">Hoàn tiền</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

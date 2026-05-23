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

export function UserFilters() {
  const router = useRouter();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const role = sp.get("role") ?? ALL;

  useEffect(() => {
    const initial = sp.get("q") ?? "";
    if (q === initial) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(sp.toString());
      if (q) params.set("q", q);
      else params.delete("q");
      startTransition(() => router.replace(`/admin/users?${params.toString()}`, { scroll: false }));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const handleRole = (v: string) => {
    const params = new URLSearchParams(sp.toString());
    if (v === ALL) params.delete("role");
    else params.set("role", v);
    startTransition(() => router.replace(`/admin/users?${params.toString()}`, { scroll: false }));
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-5">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm theo tên hoặc email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-9"
        />
      </div>
      <Select value={role} onValueChange={handleRole}>
        <SelectTrigger className="sm:w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tất cả vai trò</SelectItem>
          <SelectItem value="STUDENT">Học viên</SelectItem>
          <SelectItem value="INSTRUCTOR">Giảng viên</SelectItem>
          <SelectItem value="ADMIN">Admin</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

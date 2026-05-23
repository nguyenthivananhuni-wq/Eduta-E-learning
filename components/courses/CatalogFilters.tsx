"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES } from "@/lib/constants";

const ALL_CATEGORIES = "__all__";
const DEFAULT_SORT = "newest";

const SORT_OPTIONS = [
  { value: "newest", label: "Mới nhất" },
  { value: "rating", label: "Đánh giá cao" },
  { value: "price-asc", label: "Giá thấp → cao" },
  { value: "price-desc", label: "Giá cao → thấp" },
] as const;

export function CatalogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const category = searchParams.get("category") ?? ALL_CATEGORIES;
  const sort = searchParams.get("sort") ?? DEFAULT_SORT;

  // Debounce search 300ms
  useEffect(() => {
    const initial = searchParams.get("q") ?? "";
    if (search === initial) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) params.set("q", search);
      else params.delete("q");
      startTransition(() => {
        router.replace(`/courses?${params.toString()}`, { scroll: false });
      });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleCategoryChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL_CATEGORIES) params.delete("category");
    else params.set("category", value);
    startTransition(() => {
      router.replace(`/courses?${params.toString()}`, { scroll: false });
    });
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === DEFAULT_SORT) params.delete("sort");
    else params.set("sort", value);
    startTransition(() => {
      router.replace(`/courses?${params.toString()}`, { scroll: false });
    });
  };

  const reset = () => {
    setSearch("");
    startTransition(() => {
      router.replace("/courses", { scroll: false });
    });
  };

  const hasFilters = !!search || category !== ALL_CATEGORIES || sort !== DEFAULT_SORT;

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-8">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm khóa học..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9"
          aria-label="Tìm kiếm khóa học"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Xóa tìm kiếm"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <Select value={category} onValueChange={handleCategoryChange}>
        <SelectTrigger className="sm:w-48">
          <SelectValue placeholder="Tất cả danh mục" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_CATEGORIES}>Tất cả danh mục</SelectItem>
          {CATEGORIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={sort} onValueChange={handleSortChange}>
        <SelectTrigger className="sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="outline" onClick={reset} disabled={isPending}>
          Xóa bộ lọc
        </Button>
      )}
    </div>
  );
}

"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type Props = {
  /** 0-5; supports decimal for half-star display in read mode */
  value: number;
  /** Currently hovered value (for interactive mode) — pass externally to control */
  onChange?: (value: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const SIZE_MAP = {
  sm: "size-3.5",
  md: "size-5",
  lg: "size-7",
};

export function RatingStars({ value, onChange, size = "md", className }: Props) {
  const sizeCls = SIZE_MAP[size];
  const interactive = !!onChange;

  if (interactive) {
    return (
      <div className={cn("inline-flex items-center gap-1", className)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= value;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="transition hover:scale-110"
              aria-label={`Chọn ${n} sao`}
            >
              <Star
                className={cn(
                  sizeCls,
                  active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
                )}
              />
            </button>
          );
        })}
      </div>
    );
  }

  // Read-only mode with half-star support
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)} aria-label={`${value} sao`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const full = value >= n;
        const half = !full && value >= n - 0.5;
        return (
          <span key={n} className="relative inline-block">
            <Star className={cn(sizeCls, "text-muted-foreground/30")} />
            {(full || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: full ? "100%" : "50%" }}
              >
                <Star className={cn(sizeCls, "fill-amber-400 text-amber-400")} />
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

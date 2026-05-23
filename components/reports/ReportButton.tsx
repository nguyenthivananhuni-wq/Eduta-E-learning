"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportDialog } from "./ReportDialog";

type Props = {
  targetType: "COURSE" | "USER" | "REVIEW";
  targetId: string;
  targetLabel?: string;
  variant?: "button" | "icon" | "link";
  className?: string;
};

export function ReportButton({
  targetType,
  targetId,
  targetLabel,
  variant = "button",
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  const trigger = (() => {
    if (variant === "icon") {
      return (
        <Button
          size="icon"
          variant="ghost"
          className={className}
          onClick={() => setOpen(true)}
          title="Báo cáo"
        >
          <Flag className="size-3.5" />
        </Button>
      );
    }
    if (variant === "link") {
      return (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            className ??
            "text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1"
          }
        >
          <Flag className="size-3" />
          Báo cáo
        </button>
      );
    }
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className={className}>
        <Flag className="size-3.5" />
        Báo cáo
      </Button>
    );
  })();

  return (
    <>
      {trigger}
      <ReportDialog
        open={open}
        onOpenChange={setOpen}
        targetType={targetType}
        targetId={targetId}
        targetLabel={targetLabel}
      />
    </>
  );
}

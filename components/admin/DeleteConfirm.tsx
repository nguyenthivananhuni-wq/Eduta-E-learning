"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

type Props = {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => Promise<{ ok: boolean; error?: string } | void>;
  onSuccess?: () => void;
};

export function DeleteConfirm({
  trigger,
  title,
  description,
  confirmLabel = "Xóa",
  onConfirm,
  onSuccess,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await onConfirm();
      if (result && "ok" in result && !result.ok) {
        toast.error(result.error ?? "Lỗi khi xóa");
        return;
      }
      toast.success("Đã xóa");
      setOpen(false);
      onSuccess?.();
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            onClick={handleConfirm}
            className={cn(buttonVariants({ variant: "destructive" }))}
          >
            {isPending ? "Đang xóa..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { topupWallet } from "@/lib/actions/wallet.actions";
import { TOPUP_PRESETS, TOPUP_MAX } from "@/lib/constants";
import { formatVND } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function TopupDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<number | null>(TOPUP_PRESETS[0]);
  const [custom, setCustom] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  const amount = selected ?? (custom ? Number(custom) : 0);
  const valid = Number.isInteger(amount) && amount > 0 && amount <= TOPUP_MAX;

  const handleSubmit = () => {
    if (!valid) {
      toast.error("Vui lòng nhập số tiền hợp lệ");
      return;
    }
    startTransition(async () => {
      const result = await topupWallet({ amount });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Đã nạp ${formatVND(amount)} vào ví`);
      setOpen(false);
      setSelected(TOPUP_PRESETS[0]);
      setCustom("");
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nạp ví
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nạp tiền vào ví</DialogTitle>
          <DialogDescription>
            Đây là cổng thanh toán mô phỏng. Số tiền sẽ được cộng ngay vào ví của bạn.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="text-sm mb-2 block">Chọn nhanh</Label>
            <div className="grid grid-cols-2 gap-2">
              {TOPUP_PRESETS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setSelected(amt);
                    setCustom("");
                  }}
                  className={cn(
                    "rounded-md border p-3 text-sm font-medium transition",
                    selected === amt
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:border-foreground/30"
                  )}
                >
                  {formatVND(amt)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-amount" className="text-sm">
              Hoặc nhập số tiền khác
            </Label>
            <Input
              id="custom-amount"
              type="number"
              min={1000}
              step={1000}
              max={TOPUP_MAX}
              placeholder="VD: 250000"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setSelected(null);
              }}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Tối đa {formatVND(TOPUP_MAX)} / lần
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || isPending}>
            {isPending && <Loader2 className="size-4 animate-spin" />}
            Xác nhận nạp {valid ? formatVND(amount) : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

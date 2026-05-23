import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatVND } from "@/lib/utils/format";

type Props = {
  balance: number;
};

export function WalletBalance({ balance }: Props) {
  return (
    <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-full bg-primary/15 flex items-center justify-center">
            <Wallet className="size-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Số dư hiện tại</p>
            <p className="text-3xl font-bold mt-0.5">{formatVND(balance)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

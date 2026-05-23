import { requireAuth } from "@/lib/auth-helpers";
import { getWallet, getTransactions } from "@/lib/queries/wallet.queries";
import { WalletBalance } from "@/components/wallet/WalletBalance";
import { TopupDialog } from "@/components/wallet/TopupDialog";
import { TransactionList } from "@/components/wallet/TransactionList";

export const metadata = { title: "Ví của tôi" };

export default async function WalletPage() {
  const session = await requireAuth();
  const userId = session.user.id;

  const [wallet, transactions] = await Promise.all([
    getWallet(userId),
    getTransactions(userId, 50),
  ]);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ví của tôi</h1>
        <p className="text-muted-foreground mt-1">
          Quản lý số dư, nạp tiền và xem lịch sử giao dịch.
        </p>
      </div>

      <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
        <WalletBalance balance={wallet.balance} />
        <div className="sm:pt-2">
          <TopupDialog />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Lịch sử giao dịch</h2>
        <TransactionList transactions={transactions} />
      </div>
    </div>
  );
}

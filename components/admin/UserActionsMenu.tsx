"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreVertical, ShieldOff, ShieldCheck, Crown, Trash2, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";
import {
  suspendUser,
  unsuspendUser,
  promoteToAdmin,
  deleteUser,
} from "@/lib/actions/user-admin.actions";

type Props = {
  userId: string;
  userEmail: string;
  userName: string;
  isSuspended: boolean;
  isAdmin: boolean;
  isSelf: boolean;
};

export function UserActionsMenu({
  userId,
  userEmail,
  userName,
  isSuspended,
  isAdmin,
  isSelf,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmPromote, setConfirmPromote] = useState(false);
  const [emailTyped, setEmailTyped] = useState("");

  const handleSuspend = () => {
    startTransition(async () => {
      const result = isSuspended
        ? await unsuspendUser(userId)
        : await suspendUser(userId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(isSuspended ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản");
      router.refresh();
    });
  };

  const handlePromote = () => {
    startTransition(async () => {
      const result = await promoteToAdmin(userId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã nâng quyền admin");
      setConfirmPromote(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    if (emailTyped.trim() !== userEmail) {
      toast.error("Email không khớp");
      return;
    }
    startTransition(async () => {
      const result = await deleteUser(userId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Đã xóa ${userName}`);
      setConfirmDelete(false);
      setEmailTyped("");
      router.refresh();
    });
  };

  if (isSelf) {
    return (
      <span className="text-xs text-muted-foreground italic">Tài khoản bạn</span>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" disabled={isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <MoreVertical className="size-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleSuspend}>
            {isSuspended ? (
              <>
                <ShieldCheck className="size-4" />
                Mở khóa
              </>
            ) : (
              <>
                <ShieldOff className="size-4" />
                Khóa tài khoản
              </>
            )}
          </DropdownMenuItem>
          {!isAdmin && (
            <DropdownMenuItem onClick={() => setConfirmPromote(true)}>
              <Crown className="size-4" />
              Nâng quyền admin
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setConfirmDelete(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="size-4" />
            Xóa tài khoản
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Promote confirm */}
      <AlertDialog open={confirmPromote} onOpenChange={setConfirmPromote}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nâng {userName} thành admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Người dùng sẽ có toàn quyền quản trị nền tảng: duyệt khóa học, xóa người dùng,
              xử lý báo cáo. Hành động này KHÔNG thể hoàn tác qua UI (cần admin khác hạ quyền thủ công).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromote} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Xác nhận nâng quyền
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm — typed email */}
      <AlertDialog
        open={confirmDelete}
        onOpenChange={(o) => {
          setConfirmDelete(o);
          if (!o) setEmailTyped("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa vĩnh viễn {userName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Toàn bộ enrollment, đánh giá, ví, giao dịch, thông báo của user sẽ bị xóa.
              Khóa học do user này sở hữu sẽ giữ lại nhưng mất giảng viên. Nhập email{" "}
              <code className="font-mono">{userEmail}</code> để xác nhận.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-email">Email xác nhận</Label>
            <Input
              id="confirm-email"
              type="email"
              value={emailTyped}
              onChange={(e) => setEmailTyped(e.target.value)}
              placeholder={userEmail}
              disabled={isPending}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending || emailTyped.trim() !== userEmail}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Xóa vĩnh viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

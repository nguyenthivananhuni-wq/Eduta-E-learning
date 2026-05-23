"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Paperclip,
  ExternalLink,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DeleteConfirm } from "@/components/admin/DeleteConfirm";
import {
  addLessonAttachment,
  updateLessonAttachment,
  removeLessonAttachment,
} from "@/lib/actions/attachment.actions";

type Attachment = {
  id: string;
  name: string;
  url: string;
  order: number;
};

type Props = {
  lessonId: string;
  lessonTitle: string;
  attachments: Attachment[];
  onClose: () => void;
};

export function AttachmentSection({
  lessonId,
  lessonTitle,
  attachments,
  onClose,
}: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState<Attachment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setUrl(editing.url);
      setShowForm(true);
    }
  }, [editing]);

  const resetForm = () => {
    setName("");
    setUrl("");
    setEditing(null);
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (name.trim().length < 2) {
      toast.error("Tên tài liệu phải có ít nhất 2 ký tự");
      return;
    }
    if (!url.trim()) {
      toast.error("Vui lòng nhập URL tài liệu");
      return;
    }
    startTransition(async () => {
      const result = editing
        ? await updateLessonAttachment(editing.id, { name, url })
        : await addLessonAttachment({ lessonId, name, url });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(editing ? "Đã cập nhật tài liệu" : "Đã thêm tài liệu");
      resetForm();
      router.refresh();
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="size-4" />
            Tài liệu đính kèm
          </DialogTitle>
          <DialogDescription>
            Bài học: <strong>{lessonTitle}</strong>. Dán link Google Drive, Dropbox, GitHub raw, v.v. (chỉ http/https).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {attachments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chưa có tài liệu nào
            </p>
          ) : (
            <ul className="space-y-2">
              {attachments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground truncate hover:underline inline-flex items-center gap-1"
                    >
                      {a.url}
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </div>
                  <div className="flex items-center shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditing(a)}
                      title="Sửa"
                      disabled={isPending}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <DeleteConfirm
                      trigger={
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={isPending}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                      title="Xóa tài liệu?"
                      description={`"${a.name}" sẽ bị xóa khỏi bài học.`}
                      onConfirm={() => removeLessonAttachment(a.id)}
                      onSuccess={() => router.refresh()}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          {showForm ? (
            <div className="rounded-md border bg-muted/30 p-3 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="att-name">Tên tài liệu *</Label>
                <Input
                  id="att-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Slide bài giảng Unit 1"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="att-url">URL *</Label>
                <Input
                  id="att-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  disabled={isPending}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                  disabled={isPending}
                >
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSubmit} disabled={isPending}>
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {editing ? "Lưu" : "Thêm"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
              className="w-full"
            >
              <Plus className="size-4" />
              Thêm tài liệu
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

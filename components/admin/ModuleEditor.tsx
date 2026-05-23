"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DeleteConfirm } from "./DeleteConfirm";
import { LessonEditor } from "./LessonEditor";
import { createModule, updateModule, deleteModule } from "@/lib/actions/module.actions";

type Attachment = { id: string; name: string; url: string; order: number };

type Lesson = {
  id: string;
  title: string;
  videoUrl: string;
  content: string;
  order: number;
  quiz: { id: string; lessonId: string; questions: string } | null;
  attachments: Attachment[];
};

type Module = {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
};

type Props = {
  courseId: string;
  modules: Module[];
};

export function ModuleEditor({ courseId, modules }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (newTitle.trim().length < 2) {
      toast.error("Tên module quá ngắn");
      return;
    }
    startTransition(async () => {
      const result = await createModule({ courseId, title: newTitle.trim() });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã thêm module");
      setNewTitle("");
      setIsCreating(false);
    });
  };

  const handleEdit = () => {
    if (!editing) return;
    if (editing.title.trim().length < 2) {
      toast.error("Tên module quá ngắn");
      return;
    }
    startTransition(async () => {
      const result = await updateModule(editing.id, { title: editing.title.trim() });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Đã lưu");
      setEditing(null);
    });
  };

  return (
    <div className="space-y-4">
      {modules.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground mb-3">Chưa có module nào</p>
          <Button onClick={() => setIsCreating(true)} size="sm">
            <Plus className="size-4" />
            Thêm module đầu tiên
          </Button>
        </div>
      ) : (
        <>
          <Accordion type="multiple" className="w-full">
            {modules.map((mod) => (
              <AccordionItem key={mod.id} value={mod.id}>
                <div className="flex items-center group">
                  <AccordionTrigger className="flex-1 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {mod.order}
                      </span>
                      <span>{mod.title}</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        ({mod.lessons.length} bài)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <div className="flex items-center gap-1 pl-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditing({ id: mod.id, title: mod.title })}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <DeleteConfirm
                      trigger={
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      }
                      title="Xóa module?"
                      description={`Tất cả bài học trong "${mod.title}" cũng sẽ bị xóa.`}
                      onConfirm={() => deleteModule(mod.id)}
                    />
                  </div>
                </div>
                <AccordionContent className="pl-10">
                  <LessonEditor moduleId={mod.id} lessons={mod.lessons} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <Button onClick={() => setIsCreating(true)} variant="outline" className="w-full">
            <Plus className="size-4" />
            Thêm module
          </Button>
        </>
      )}

      {/* Create module dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm module mới</DialogTitle>
            <DialogDescription>
              Module thường tương ứng với 1 chương hoặc 1 chủ đề
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="new-module-title">Tên module</Label>
            <Input
              id="new-module-title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="VD: Unit 1 - Family Life"
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(false)} disabled={isPending}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Thêm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit module dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Đổi tên module</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="edit-module-title">Tên module</Label>
            <Input
              id="edit-module-title"
              value={editing?.title ?? ""}
              onChange={(e) =>
                setEditing((prev) => (prev ? { ...prev, title: e.target.value } : null))
              }
              disabled={isPending}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={isPending}>
              Hủy
            </Button>
            <Button onClick={handleEdit} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

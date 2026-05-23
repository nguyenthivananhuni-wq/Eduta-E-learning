"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Circle, FileQuestion, Menu, ArrowLeft } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { ProgressMap } from "@/lib/utils/progress";

type Lesson = {
  id: string;
  title: string;
  order: number;
  quiz: { id: string } | null;
};

type Module = {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
};

export type SidebarProps = {
  courseSlug: string;
  courseTitle: string;
  modules: Module[];
  currentLessonId: string;
  progressMap: ProgressMap;
  progressPercent: number;
  completedCount: number;
  totalLessons: number;
};

function SidebarContent({
  courseSlug,
  courseTitle,
  modules,
  currentLessonId,
  progressMap,
  progressPercent,
  completedCount,
  totalLessons,
  onItemClick,
}: SidebarProps & { onItemClick?: () => void }) {
  // Determine which module contains current lesson — keep open by default
  const defaultOpen = modules
    .filter((m) => m.lessons.some((l) => l.id === currentLessonId))
    .map((m) => m.id);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b shrink-0">
        <Link
          href={`/courses/${courseSlug}`}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-2"
          onClick={onItemClick}
        >
          <ArrowLeft className="size-3" />
          Trang khóa học
        </Link>
        <h2 className="font-semibold text-sm leading-snug">{courseTitle}</h2>
        <div className="mt-3 space-y-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-muted-foreground">Tiến độ</span>
            <span className="font-medium">
              {completedCount}/{totalLessons} bài
            </span>
          </div>
          <Progress value={progressPercent} />
          <p className="text-xs text-muted-foreground text-right">{progressPercent}%</p>
        </div>
      </div>

      <nav className="overflow-y-auto flex-1 p-2">
        <Accordion type="multiple" defaultValue={defaultOpen.length ? defaultOpen : [modules[0]?.id ?? ""]}>
          {modules.map((mod, mIdx) => {
            const moduleCompleted = mod.lessons.every((l) => progressMap[l.id]?.completed);
            return (
              <AccordionItem key={mod.id} value={mod.id} className="border-0">
                <AccordionTrigger className="px-3 py-2 text-sm font-medium hover:no-underline rounded-md hover:bg-accent text-left">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                      {mIdx + 1}
                    </span>
                    <span className="truncate">{mod.title}</span>
                    {moduleCompleted && mod.lessons.length > 0 && (
                      <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <ul className="space-y-0.5 pl-3">
                    {mod.lessons.map((lesson) => {
                      const isActive = lesson.id === currentLessonId;
                      const prog = progressMap[lesson.id];
                      return (
                        <li key={lesson.id}>
                          <Link
                            href={`/learn/${courseSlug}/${lesson.id}`}
                            onClick={onItemClick}
                            className={cn(
                              "flex items-start gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                              isActive
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-accent text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <span className="mt-0.5 shrink-0">
                              {prog?.completed ? (
                                <CheckCircle2 className="size-4 text-emerald-500" />
                              ) : (
                                <Circle className="size-4" />
                              )}
                            </span>
                            <span className="flex-1 leading-snug">
                              {lesson.order}. {lesson.title}
                              {prog?.quizScore != null && (
                                <span className="ml-1 text-xs">
                                  ({prog.quizScore}/100)
                                </span>
                              )}
                            </span>
                            {lesson.quiz && (
                              <FileQuestion className="size-3.5 mt-1 shrink-0 text-muted-foreground" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </nav>
    </div>
  );
}

export function LessonSidebar(props: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop: fixed sidebar */}
      <aside className="hidden lg:flex w-80 border-r bg-background flex-col h-[calc(100vh-4rem)] sticky top-16">
        <SidebarContent {...props} />
      </aside>

      {/* Mobile: hamburger + Sheet drawer */}
      <div className="lg:hidden sticky top-16 z-30 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="size-4" />
                Mục lục
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <SheetHeader className="sr-only">
                <SheetTitle>Mục lục khóa học</SheetTitle>
              </SheetHeader>
              <SidebarContent {...props} onItemClick={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <p className="text-xs text-muted-foreground">
            {props.completedCount}/{props.totalLessons} bài · {props.progressPercent}%
          </p>
        </div>
      </div>
    </>
  );
}

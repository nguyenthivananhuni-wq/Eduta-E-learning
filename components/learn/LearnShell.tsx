"use client";

import { useParams } from "next/navigation";
import { LessonSidebar, type SidebarProps } from "./LessonSidebar";

type Props = Omit<SidebarProps, "currentLessonId"> & {
  children: React.ReactNode;
};

export function LearnShell({ children, ...sidebarProps }: Props) {
  const params = useParams<{ lessonId?: string }>();
  const currentLessonId = params?.lessonId ?? "";

  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      <LessonSidebar {...sidebarProps} currentLessonId={currentLessonId} />
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

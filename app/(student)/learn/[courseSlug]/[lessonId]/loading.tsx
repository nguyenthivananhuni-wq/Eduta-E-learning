import { Skeleton } from "@/components/ui/skeleton";

export default function LessonLoading() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 lg:py-10 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-9 w-3/4" />
      </div>
      <Skeleton className="aspect-video w-full rounded-lg" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex items-center justify-between pt-6 border-t">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
    </div>
  );
}

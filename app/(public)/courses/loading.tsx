import { Skeleton } from "@/components/ui/skeleton";

export default function CoursesLoading() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-80" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-full sm:w-56" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="container max-w-6xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-5 flex items-center gap-4">
              <Skeleton className="size-12 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-9 w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

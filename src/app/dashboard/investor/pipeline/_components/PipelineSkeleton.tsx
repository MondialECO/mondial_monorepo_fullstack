import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-48" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="overflow-x-auto">
        <div className="grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-4 md:auto-cols-fr">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex min-w-[280px] flex-col rounded-2xl border border-border bg-muted/30 p-3"
            >
              <Skeleton className="mb-3 h-4 w-24" />
              <div className="space-y-2">
                <Skeleton className="h-20 rounded-xl" />
                <Skeleton className="h-20 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}

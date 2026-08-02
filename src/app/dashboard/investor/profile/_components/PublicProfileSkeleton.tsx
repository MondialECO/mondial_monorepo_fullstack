import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function PublicProfileSkeleton() {
  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-2xl border-border p-0">
        <Skeleton className="h-36 w-full sm:h-44" />
        <div className="px-5 pb-5">
          <div className="-mt-10 flex items-end justify-between">
            <Skeleton className="h-20 w-20 rounded-2xl" />
            <Skeleton className="h-8 w-28" />
          </div>
          <Skeleton className="mt-3 h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[120px] rounded-2xl" />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

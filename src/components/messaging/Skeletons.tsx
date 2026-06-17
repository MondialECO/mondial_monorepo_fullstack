import { Skeleton } from "@/components/ui/skeleton";

export function ConversationListSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ThreadSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className={i % 2 === 0 ? "flex justify-start" : "flex justify-end"}>
          <Skeleton className="h-12 w-2/5 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}

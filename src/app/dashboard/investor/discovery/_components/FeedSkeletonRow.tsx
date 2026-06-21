import { Skeleton } from "@/components/ui/skeleton";
import DealCardBase from "@/components/investor/DealCardBase";

export default function FeedSkeletonRow() {
  return (
    <DealCardBase>
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2 min-w-0 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-72" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
          <Skeleton className="h-6 w-32 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
    </DealCardBase>
  );
}

import { Search } from "lucide-react";

interface EmptyFeedStateProps {
  hasFilters: boolean;
}

export default function EmptyFeedState({ hasFilters }: EmptyFeedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-12 px-6 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Search className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">
        {hasFilters ? "No matches with these filters" : "No matched opportunities yet"}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? "Try clearing one filter, or broaden your sector / stage preferences in your Investment Thesis."
          : "As your Investor Thesis updates, matched opportunities will appear here."}
      </p>
    </div>
  );
}

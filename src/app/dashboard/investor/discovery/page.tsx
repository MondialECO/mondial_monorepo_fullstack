"use client";

import { useSearchParams } from "next/navigation";
import ErrorState from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { useOpportunities } from "@/hooks/queries/investor-opportunities";
import FeedHeader from "./_components/FeedHeader";
import FilterChipBar from "./_components/FilterChipBar";
import OpportunityCardListItem from "./_components/OpportunityCardListItem";
import EmptyFeedState from "./_components/EmptyFeedState";
import FeedSkeletonRow from "./_components/FeedSkeletonRow";

export default function DiscoveryFeedPage() {
  const params = useSearchParams();
  const filters = {
    sector: params.get("sector") || undefined,
    stage: params.get("stage") || undefined,
    geography: params.get("geography") || undefined,
  };
  const hasFilters = !!(filters.sector || filters.stage || filters.geography);

  const { data, isLoading, isError, refetch, isFetching } = useOpportunities(filters);

  return (
    <div className="w-full max-w-[1136px] mx-auto space-y-6 pb-8">
      <FeedHeader
        totalMatches={data?.totalMatches ?? 0}
        newMatchesToday={data?.newMatchesToday ?? 0}
      />

      <FilterChipBar />

      {isError ? (
        <div className="space-y-4">
          <ErrorState
            title="Couldn't load opportunities"
            message="The opportunity feed didn't load. Try again in a moment."
          />
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <FeedSkeletonRow />
          <FeedSkeletonRow />
          <FeedSkeletonRow />
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyFeedState hasFilters={hasFilters} />
      ) : (
        <div
          className="space-y-3"
          aria-busy={isFetching}
          aria-live="polite"
        >
          {data.items.map((card) => (
            <OpportunityCardListItem key={card.companyId} card={card} />
          ))}
        </div>
      )}
    </div>
  );
}

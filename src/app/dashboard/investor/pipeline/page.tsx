"use client";

import { Button } from "@/components/ui/button";
import ErrorState from "@/components/shared/ErrorState";
import { useInvestorPipeline } from "@/hooks/queries/investor-opportunities";
import PipelineHeader from "./_components/PipelineHeader";
import KPIStrip from "./_components/KPIStrip";
import KanbanBoard from "./_components/KanbanBoard";
import ExpandedDealCard from "./_components/ExpandedDealCard";
import PipelineSkeleton from "./_components/PipelineSkeleton";

export default function PipelinePage() {
  const { data, isLoading, isError, refetch } = useInvestorPipeline();

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6 pb-8">
      <PipelineHeader />

      {isError ? (
        <div className="space-y-4">
          <ErrorState
            title="Couldn't load your pipeline"
            message="The pipeline endpoint didn't respond. Try again in a moment."
          />
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      ) : isLoading || !data ? (
        <PipelineSkeleton />
      ) : (
        <>
          <KPIStrip summary={data.summary} />
          <KanbanBoard columns={data.columns} />
          <ExpandedDealCard card={data.columns.negotiation[0]} />
        </>
      )}
    </div>
  );
}

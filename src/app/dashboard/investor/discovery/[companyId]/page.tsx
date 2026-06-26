"use client";

import { use, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ErrorState from "@/components/shared/ErrorState";
import NDARequiredCard from "@/components/investor/NDARequiredCard";
import NDAAcceptModal from "@/components/investor/NDAAcceptModal";
import { useOpportunity } from "@/hooks/queries/investor-opportunities";
import OpportunityHeader from "./_components/OpportunityHeader";
import OpportunityKPIStrip from "./_components/OpportunityKPIStrip";
import MatchScoreCard from "./_components/MatchScoreCard";
import OverviewTabPanel from "./_components/OverviewTabPanel";
import TractionTabPanel from "./_components/TractionTabPanel";
import CapTableTabPanel from "./_components/CapTableTabPanel";
import TeamTabPanel from "./_components/TeamTabPanel";
import DocumentsTabPanel from "./_components/DocumentsTabPanel";
import DetailSkeleton from "./_components/DetailSkeleton";

interface PageProps {
  // Next 15+ App Router params are async; React.use() unwraps them client-side.
  params: Promise<{ companyId: string }>;
}

export default function OpportunityDetailPage({ params }: PageProps) {
  const { companyId } = use(params);
  const { data, isLoading, isError, refetch } = useOpportunity(companyId);
  const [ndaOpen, setNdaOpen] = useState(false);

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="w-full max-w-[1280px] mx-auto space-y-4 pb-8">
        <ErrorState
          title="Couldn't load this opportunity"
          message="Either the opportunity doesn't exist, you're not matched to it, or the API is unreachable."
        />
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const openNda = () => setNdaOpen(true);

  return (
    <div className="w-full max-w-[1280px] mx-auto space-y-6 pb-8">
      <OpportunityHeader detail={data} />

      <OpportunityKPIStrip detail={data} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* MAIN */}
        <div className="min-w-0">
          <Tabs defaultValue="overview">
            <TabsList className="w-full overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="traction">Traction</TabsTrigger>
              <TabsTrigger value="cap-table">
                Cap Table
                {!data.ndaAccepted ? (
                  <Badge variant="outline" className="ml-1.5 text-[10px]">
                    Locked
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="team">
                Team
                {!data.ndaAccepted ? (
                  <Badge variant="outline" className="ml-1.5 text-[10px]">
                    Locked
                  </Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="documents">
                Documents
                {!data.ndaAccepted ? (
                  <Badge variant="outline" className="ml-1.5 text-[10px]">
                    Locked
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-1.5 text-[10px]">
                    {data.documentsCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTabPanel detail={data} />
            </TabsContent>
            <TabsContent value="traction">
              <TractionTabPanel detail={data} />
            </TabsContent>
            <TabsContent value="cap-table">
              <CapTableTabPanel detail={data} onSignNda={openNda} />
            </TabsContent>
            <TabsContent value="team">
              <TeamTabPanel detail={data} onSignNda={openNda} />
            </TabsContent>
            <TabsContent value="documents">
              <DocumentsTabPanel detail={data} onSignNda={openNda} />
            </TabsContent>
          </Tabs>
        </div>

        {/* RIGHT RAIL */}
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <MatchScoreCard detail={data} />
          {data.ndaRequired && !data.ndaAccepted ? (
            <NDARequiredCard onSign={openNda} />
          ) : null}
        </aside>
      </div>

      <NDAAcceptModal
        companyId={data.companyId}
        companyName={data.companyName}
        open={ndaOpen}
        onOpenChange={setNdaOpen}
      />
    </div>
  );
}

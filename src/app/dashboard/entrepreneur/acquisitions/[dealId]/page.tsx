"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FullBuyoutDealWorkspace } from "@/components/marketplace/FullBuyoutDealWorkspace";
import { AcquiredProjectWorkspace } from "@/components/entrepreneur/AcquiredProjectWorkspace";
import marketplaceProjectsApi, { EquityDeal } from "@/lib/api-marketplace-projects";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, AlertTriangle, Layers, FileCheck } from "lucide-react";

export default function EntrepreneurAcquisitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params?.dealId as string;

  const [deal, setDeal] = useState<EquityDeal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"purchased_project" | "acquisition_record">("purchased_project");

  const loadDeal = async () => {
    if (!dealId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await marketplaceProjectsApi.getDeal(dealId);
      setDeal(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to load acquisition details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeal();
  }, [dealId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading acquisition workspace...</p>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-4">
        <Card className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <h3 className="text-base font-bold text-foreground">Acquisition Record Not Available</h3>
          <p className="text-sm text-muted-foreground">{error || "Could not retrieve the specified acquisition record."}</p>
          <Button variant="outline" size="sm" onClick={loadDeal} className="text-xs">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const isSold = deal.dealStage === "SOLD" || deal.dealStage === "BUYOUT_COMPLETED";

  // If deal is in-progress (not SOLD), render the standard Full Buyout lifecycle workspace
  if (!isSold) {
    return (
      <FullBuyoutDealWorkspace
        dealId={dealId}
        isCreator={false}
        backUrl="/dashboard/entrepreneur/acquisitions"
        backLabel="Back to My Acquisitions"
      />
    );
  }

  // If deal is SOLD, offer top-level view toggle between Purchased Project and Acquisition Record
  return (
    <div className="space-y-6">
      {/* TOP-LEVEL VIEW SWITCHER FOR SOLD ACQUISITION */}
      <div className="max-w-6xl mx-auto flex items-center justify-center sm:justify-start">
        <div className="inline-flex p-1 bg-muted/60 border border-border rounded-xl">
          <button
            onClick={() => setViewMode("purchased_project")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "purchased_project"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-primary" />
            <span>Purchased Project</span>
          </button>

          <button
            onClick={() => setViewMode("acquisition_record")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === "acquisition_record"
                ? "bg-card text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCheck className="h-3.5 w-3.5 text-success-strong" />
            <span>Acquisition Record &amp; Handover</span>
          </button>
        </div>
      </div>

      {viewMode === "purchased_project" ? (
        <AcquiredProjectWorkspace
          deal={deal}
          onViewAcquisitionRecord={() => setViewMode("acquisition_record")}
          backUrl="/dashboard/entrepreneur/acquisitions"
          backLabel="Back to My Acquisitions"
        />
      ) : (
        <FullBuyoutDealWorkspace
          dealId={dealId}
          isCreator={false}
          backUrl="/dashboard/entrepreneur/acquisitions"
          backLabel="Back to My Acquisitions"
        />
      )}
    </div>
  );
}

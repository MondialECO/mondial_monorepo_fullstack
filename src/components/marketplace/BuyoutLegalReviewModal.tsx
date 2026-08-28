"use client";

import React, { useEffect, useState } from "react";
import {
  marketplaceProjectsApi,
  BuyoutLegalPackage,
  InviteBuyoutLegalProviderRequest,
  ReviewBuyoutLegalPackageRequest,
  RequestBuyoutLegalChangesRequest,
  ReviseBuyoutDocumentRequest,
} from "@/lib/api-marketplace-projects";
import { BuyoutLegalReviewScreen } from "./BuyoutLegalReviewScreen";
import { Loader2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BuyoutLegalReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  isCreator: boolean;
  currentUserId?: string;
  onPackageChanged?: (pkg: BuyoutLegalPackage) => void;
}

export const BuyoutLegalReviewModal: React.FC<BuyoutLegalReviewModalProps> = ({
  isOpen,
  onClose,
  dealId,
  isCreator,
  currentUserId = "",
  onPackageChanged,
}) => {
  const [pkg, setPkg] = useState<BuyoutLegalPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPackage = async () => {
    if (!dealId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await marketplaceProjectsApi.getBuyoutLegalPackage(dealId);
      setPkg(res);
      onPackageChanged?.(res);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || "Failed to load buyout legal review package.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && dealId) {
      loadPackage();
    }
  }, [isOpen, dealId]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.approveBuyoutLegalPackage(dealId, {
      legalPackageVersion: pkg?.version,
    });
    setPkg(updated);
    onPackageChanged?.(updated);
  };

  const handleRequestChanges = async (req: RequestBuyoutLegalChangesRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.requestBuyoutLegalChanges(dealId, req);
    setPkg(updated);
    onPackageChanged?.(updated);
  };

  const handleInviteProvider = async (req: InviteBuyoutLegalProviderRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.inviteBuyoutLegalProvider(dealId, req);
    setPkg(updated);
    onPackageChanged?.(updated);
  };

  const handleProviderReview = async (req: ReviewBuyoutLegalPackageRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.reviewBuyoutLegalPackage(dealId, req);
    setPkg(updated);
    onPackageChanged?.(updated);
  };

  const handleReviseDocument = async (docId: string, req: ReviseBuyoutDocumentRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.reviseBuyoutDocument(dealId, docId, req);
    setPkg(updated);
    onPackageChanged?.(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="relative w-full max-w-6xl bg-card border-border rounded-2xl p-6 shadow-2xl my-8 max-h-[92vh] overflow-y-auto text-foreground">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-5 right-5 h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </Button>

        {loading && !pkg ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading Full Buyout Legal Package...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-4">
            <div className="text-destructive font-semibold">{error}</div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadPackage}
            >
              Retry
            </Button>
          </div>
        ) : pkg ? (
          <BuyoutLegalReviewScreen
            pkg={pkg}
            dealId={dealId}
            isCreator={isCreator}
            currentUserId={currentUserId}
            onApprove={handleApprove}
            onRequestChanges={handleRequestChanges}
            onInviteProvider={handleInviteProvider}
            onProviderReview={handleProviderReview}
            onReviseDocument={handleReviseDocument}
            onRefresh={loadPackage}
          />
        ) : null}
      </Card>
    </div>
  );
};


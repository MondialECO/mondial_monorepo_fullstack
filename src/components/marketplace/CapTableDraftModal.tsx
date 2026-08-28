import React, { useEffect, useState } from "react";
import {
  marketplaceProjectsApi,
  DealCapTableDraft,
  UpdateCapTableDraftRequest,
  RequestCapTableChangesRequest,
} from "@/lib/api-marketplace-projects";
import { CapTableDraftScreen } from "./CapTableDraftScreen";
import { Loader2, X } from "lucide-react";

interface CapTableDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  isCreator: boolean;
  currentUserId?: string;
  onDraftChanged?: (draft: DealCapTableDraft) => void;
}

export const CapTableDraftModal: React.FC<CapTableDraftModalProps> = ({
  isOpen,
  onClose,
  dealId,
  isCreator,
  currentUserId = "",
  onDraftChanged,
}) => {
  const [draft, setDraft] = useState<DealCapTableDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightDealIdRef = React.useRef<string | null>(null);

  const loadDraft = React.useCallback(async () => {
    if (!dealId) return;
    if (inFlightDealIdRef.current === dealId) return;

    inFlightDealIdRef.current = dealId;
    try {
      setLoading(true);
      setError(null);
      const res = await marketplaceProjectsApi.getCapTableDraft(dealId);
      setDraft(res);
    } catch (err: any) {
      if (err?.response?.status === 429) {
        setError("Cap table draft is temporarily refreshing too quickly. Please try again shortly.");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to load equity cap table draft.");
      }
    } finally {
      setLoading(false);
      inFlightDealIdRef.current = null;
    }
  }, [dealId]);

  useEffect(() => {
    if (isOpen && dealId) {
      loadDraft();
    } else if (!isOpen) {
      setDraft(null);
      setError(null);
      inFlightDealIdRef.current = null;
    }
  }, [isOpen, dealId, loadDraft]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.approveCapTableDraft(dealId);
    setDraft(updated);
    onDraftChanged?.(updated);
  };

  const handleUpdate = async (req: UpdateCapTableDraftRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.updateCapTableDraft(dealId, req);
    setDraft(updated);
    onDraftChanged?.(updated);
  };

  const handleRequestChanges = async (req: RequestCapTableChangesRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.requestCapTableChanges(dealId, req);
    setDraft(updated);
    onDraftChanged?.(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-card border border-border rounded-2xl p-6 shadow-2xl my-8 max-h-[92vh] overflow-y-auto text-foreground">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground transition z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {loading && !draft ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading Equity &amp; Cap Table Structure...</p>
          </div>
        ) : error && !draft ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={loadDraft}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : draft ? (
          <CapTableDraftScreen
            dealId={dealId}
            draft={draft}
            currentUserId={currentUserId}
            isCreator={isCreator}
            onApprove={handleApprove}
            onUpdate={handleUpdate}
            onRequestChanges={handleRequestChanges}
            onProceedToLegalReview={onClose}
          />
        ) : null}
      </div>
    </div>
  );
};


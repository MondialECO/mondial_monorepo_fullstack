import React, { useEffect, useState } from "react";
import {
  marketplaceProjectsApi,
  LegalReviewPackage,
  InviteLegalProviderRequest,
  RequestLegalChangesRequest,
  SetJurisdictionRequest,
} from "@/lib/api-marketplace-projects";
import { LegalReviewScreen } from "./LegalReviewScreen";
import { Loader2, X } from "lucide-react";

interface LegalReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  isCreator: boolean;
  currentUserId?: string;
  onPackageChanged?: (pkg: LegalReviewPackage) => void;
}

export const LegalReviewModal: React.FC<LegalReviewModalProps> = ({
  isOpen,
  onClose,
  dealId,
  isCreator,
  currentUserId = "",
  onPackageChanged,
}) => {
  const [pkg, setPkg] = useState<LegalReviewPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightDealIdRef = React.useRef<string | null>(null);

  const loadPackage = React.useCallback(async () => {
    if (!dealId) return;
    if (inFlightDealIdRef.current === dealId) return;

    inFlightDealIdRef.current = dealId;
    try {
      setLoading(true);
      setError(null);
      const res = await marketplaceProjectsApi.getLegalPackage(dealId);
      setPkg(res);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      if (e?.response?.status === 429) {
        setError("Legal review package is temporarily refreshing too quickly. Please try again shortly.");
      } else {
        setError(e.response?.data?.message || e.message || "Failed to load legal review package.");
      }
    } finally {
      setLoading(false);
      inFlightDealIdRef.current = null;
    }
  }, [dealId]);

  useEffect(() => {
    if (isOpen && dealId) {
      loadPackage();
    } else if (!isOpen) {
      setPkg(null);
      setError(null);
      inFlightDealIdRef.current = null;
    }
  }, [isOpen, dealId, loadPackage]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.approveLegalPackage(dealId);
    setPkg(updated);
    onPackageChanged?.(updated);
  };

  const handleRequestChanges = async (req: RequestLegalChangesRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.requestLegalChanges(dealId, req);
    setPkg(updated);
    onPackageChanged?.(updated);
  };

  const handleInviteProvider = async (req: InviteLegalProviderRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.inviteLegalProvider(dealId, req);
    setPkg(updated);
    onPackageChanged?.(updated);
  };

  const handleSetJurisdiction = async (req: SetJurisdictionRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.setDealJurisdiction(dealId, req);
    setPkg(updated);
    onPackageChanged?.(updated);
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

        {loading && !pkg ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading Legal Review Package...</p>
          </div>
        ) : error && !pkg ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={loadPackage}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        ) : pkg ? (
          <LegalReviewScreen
            dealId={dealId}
            pkg={pkg}
            currentUserId={currentUserId}
            isCreator={isCreator}
            onApprove={handleApprove}
            onRequestChanges={handleRequestChanges}
            onInviteProvider={handleInviteProvider}
            onSetJurisdiction={handleSetJurisdiction}
            onProceedToSigning={onClose}
          />
        ) : null}
      </div>
    </div>
  );
};

export default LegalReviewModal;

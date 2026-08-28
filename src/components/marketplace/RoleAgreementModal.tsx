import React, { useEffect, useState } from "react";
import {
  marketplaceProjectsApi,
  RoleResponsibilityAgreement,
  UpdateRoleAgreementRequest,
  RequestRoleChangesRequest,
} from "@/lib/api-marketplace-projects";
import { RoleAgreementScreen } from "./RoleAgreementScreen";
import { Loader2, X } from "lucide-react";

interface RoleAgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  isCreator: boolean;
  currentUserId?: string;
  onAgreementChanged?: (agreement: RoleResponsibilityAgreement) => void;
}

export const RoleAgreementModal: React.FC<RoleAgreementModalProps> = ({
  isOpen,
  onClose,
  dealId,
  isCreator,
  currentUserId = "",
  onAgreementChanged,
}) => {
  const [agreement, setAgreement] = useState<RoleResponsibilityAgreement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAgreement = async () => {
    if (!dealId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await marketplaceProjectsApi.getRoleAgreement(dealId);
      setAgreement(res);
      onAgreementChanged?.(res);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to load role agreement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && dealId) {
      loadAgreement();
    }
  }, [isOpen, dealId]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.confirmRoleAgreement(dealId);
    setAgreement(updated);
    onAgreementChanged?.(updated);
  };

  const handleUpdate = async (req: UpdateRoleAgreementRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.updateRoleAgreement(dealId, req);
    setAgreement(updated);
    onAgreementChanged?.(updated);
  };

  const handleRequestChanges = async (req: RequestRoleChangesRequest) => {
    if (!dealId) return;
    const updated = await marketplaceProjectsApi.requestRoleChanges(dealId, req);
    setAgreement(updated);
    onAgreementChanged?.(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-card border border-border rounded-2xl p-6 shadow-2xl my-8 max-h-[92vh] overflow-y-auto text-foreground">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground transition"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {loading && !agreement ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading Role &amp; Responsibility Agreement...</p>
          </div>
        ) : error && !agreement ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-destructive">{error}</p>
            <button
              onClick={loadAgreement}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground"
            >
              Retry
            </button>
          </div>
        ) : agreement ? (
          <RoleAgreementScreen
            dealId={dealId}
            agreement={agreement}
            currentUserId={currentUserId}
            isCreator={isCreator}
            onConfirm={handleConfirm}
            onUpdate={handleUpdate}
            onRequestChanges={handleRequestChanges}
            onProceedToCapTable={onClose}
          />
        ) : null}
      </div>
    </div>
  );
};


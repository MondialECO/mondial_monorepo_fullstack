import React from "react";
import { AgreementSigningScreen } from "./AgreementSigningScreen";
import { AgreementSigningPackage } from "@/lib/api-marketplace-projects";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgreementSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  isCreator: boolean;
  currentUserId?: string;
  onPackageChanged?: (pkg: AgreementSigningPackage) => void;
  onNavigateToActivation?: () => void;
}

export const AgreementSigningModal: React.FC<AgreementSigningModalProps> = ({
  isOpen,
  onClose,
  dealId,
  isCreator,
  currentUserId = "",
  onPackageChanged,
  onNavigateToActivation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto font-sans">
      <div className="relative w-full max-w-5xl bg-card border border-border rounded-2xl shadow-xl my-8 overflow-hidden text-foreground">
        {/* Top bar with close button */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-card/95 border-b border-border backdrop-blur">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Phase 7 • Final Agreement Signing
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Modal content */}
        <div className="p-4 sm:p-6 max-h-[calc(90vh-60px)] overflow-y-auto">
          <AgreementSigningScreen
            dealId={dealId}
            currentUserId={currentUserId}
            userRole={isCreator ? "Creator" : "Entrepreneur"}
            onCompleted={(signingPkg) => {
              onPackageChanged?.(signingPkg);
            }}
            onNavigateToActivation={() => {
              onClose();
              onNavigateToActivation?.();
            }}
          />
        </div>
      </div>
    </div>
  );
};

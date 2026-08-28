import React from "react";
import { BuyoutClosingScreen } from "./BuyoutClosingScreen";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BuyoutClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
  dealId: string;
  isCreator: boolean;
  onRefreshDeal?: () => void;
  onProceedToHandover?: () => void;
}

export const BuyoutClosingModal: React.FC<BuyoutClosingModalProps> = ({
  isOpen,
  onClose,
  dealId,
  isCreator,
  onRefreshDeal,
  onProceedToHandover,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <Card className="relative w-full max-w-5xl bg-card border-border rounded-2xl shadow-2xl my-8 overflow-hidden">
        {/* Top bar with close button */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-card border-b border-border">
          <span className="text-xs font-semibold text-primary uppercase tracking-wider">
            Full Buyout • Closing &amp; Payment Confirmation
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Modal content */}
        <div className="p-4 sm:p-6 max-h-[calc(90vh-60px)] overflow-y-auto bg-background">
          <BuyoutClosingScreen
            dealId={dealId}
            isCreator={isCreator}
            onRefreshDeal={onRefreshDeal}
            onProceedToHandover={() => {
              onClose();
              onProceedToHandover?.();
            }}
          />
        </div>
      </Card>
    </div>
  );
};

export default BuyoutClosingModal;

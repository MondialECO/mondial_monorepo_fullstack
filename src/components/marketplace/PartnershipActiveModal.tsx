'use client';

import React from 'react';
import { X } from 'lucide-react';
import PartnershipActiveScreen from './PartnershipActiveScreen';

interface PartnershipActiveModalProps {
  dealId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
  isCreator?: boolean;
}

export const PartnershipActiveModal: React.FC<PartnershipActiveModalProps> = ({
  dealId,
  isOpen,
  onClose,
  currentUserId,
  isCreator = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 text-foreground">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2.5 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground transition z-20"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <PartnershipActiveScreen
          dealId={dealId}
          currentUserId={currentUserId}
          isCreator={isCreator}
          onClose={onClose}
        />
      </div>
    </div>
  );
};


export default PartnershipActiveModal;

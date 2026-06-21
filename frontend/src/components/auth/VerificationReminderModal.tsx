"use client";

import { ShieldCheck, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface VerificationReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VerificationReminderModal({ isOpen, onClose }: VerificationReminderModalProps) {
  const router = useRouter();

  const handleStartVerification = () => {
    onClose();
    router.push("/creator/verification");
  };

  const handleSkip = () => {
    localStorage.setItem("creator_verification_skipped_at", Date.now().toString());
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleSkip(); }}>
      <DialogContent className="max-w-md border border-white/20 bg-background/60 backdrop-blur-xl shadow-2xl rounded-3xl p-6">
        <DialogHeader className="flex flex-col items-center text-center gap-4">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-inner">
            <ShieldCheck className="w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
              Verify Your Account
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground max-w-sm">
              Complete Phase 1 Profile Verification to secure your identity, unlock funding opportunities, and publish your project ideas.
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Benefits list */}
        <div className="my-4 py-3 px-4 bg-muted/30 border border-border/50 rounded-2xl space-y-2">
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
            <span>Identity and facial bio-matching verification</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
            <span>Secure your primary email and phone number</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
            <span>Required to finalize your project setup &amp; matches</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 mt-2">
          <Button
            onClick={handleStartVerification}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-sm flex items-center justify-center gap-2 group transition-all"
          >
            Start Verification
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full text-muted-foreground hover:text-foreground hover:bg-muted font-medium rounded-xl"
          >
            Skip for now (24 hours)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

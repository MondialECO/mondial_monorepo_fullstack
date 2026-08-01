"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, FileText, ShieldCheck, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNdaAccept } from "@/hooks/queries/investor-opportunities";

interface NDAAcceptModalProps {
  companyId: string;
  companyName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "review" | "confirm" | "success";

const DEMO_NDA_TEXT = `MUTUAL NON-DISCLOSURE AGREEMENT (Demo)

This Agreement is entered into on the date of acceptance between the Company and the Investor for the purpose of evaluating a potential investment opportunity.

1. DEFINITIONS
"Confidential Information" means any non-public information disclosed in any form, including financial projections, customer pipelines, and proprietary technology designs.

2. OBLIGATIONS
The Investor agrees to use Confidential Information solely for evaluating the investment opportunity, and to maintain reasonable safeguards against unauthorised access or disclosure.

3. EXCLUSIONS
No obligations apply to information that is already public, was rightfully known prior to disclosure, or is independently developed.

4. TERM
This Agreement remains in effect for 3 years from the date of acceptance.

5. NO LICENSE
Nothing herein grants any rights to intellectual property or any obligation to enter into a future transaction.

This is a demo NDA for the Mondial.eco MVP. It is non-binding and intended for demonstration purposes only.`;

export default function NDAAcceptModal({
  companyId,
  companyName,
  open,
  onOpenChange,
}: NDAAcceptModalProps) {
  const [step, setStep] = useState<Step>("review");
  const [agreed, setAgreed] = useState(false);
  const { mutate, isPending, isError, error, reset } = useNdaAccept();

  // Reset internal state when dialog closes so reopening starts clean.
  useEffect(() => {
    if (!open) {
      const t = setTimeout(() => {
        setStep("review");
        setAgreed(false);
        reset();
      }, 200);
      return () => clearTimeout(t);
    }
  }, [open, reset]);

  function handleSign() {
    if (!agreed) return;
    mutate(
      { companyId, ndaText: DEMO_NDA_TEXT },
      {
        onSuccess: () => setStep("success"),
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {step === "review" ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" aria-hidden />
                <DialogTitle>Non-Disclosure Agreement</DialogTitle>
              </div>
              <DialogDescription>
                {companyName} &middot; Investor NDA
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Key Terms</h4>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li>&bull; Confidentiality &mdash; 3 years from signing</li>
                <li>&bull; No reverse engineering of disclosed information</li>
                <li>&bull; No solicitation of customers learned during diligence</li>
              </ul>

              <div className="rounded-md border border-border bg-muted/50">
                <ScrollArea className="h-44 px-3 py-3">
                  <pre className="whitespace-pre-wrap text-xs font-mono text-foreground/90 leading-relaxed">
                    {DEMO_NDA_TEXT}
                  </pre>
                </ScrollArea>
              </div>

              {/* Full AI analysis: no investor-facing AI-analysis route/data
                  exists yet, so this is an explicit, honest disabled state
                  rather than a dead link. */}
              <div className="flex items-center justify-between rounded-md border border-dashed border-border bg-muted/30 px-3 py-2">
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                  View full AI analysis
                </span>
                <Button
                  variant="link"
                  size="sm"
                  disabled
                  className="h-auto p-0 text-xs"
                  title="AI analysis isn't available for this opportunity yet"
                >
                  Not available yet
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Standard EU mutual NDA template &middot; eIDAS-compatible
                e-signature &middot; Non-binding demo
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={() => setStep("confirm")}>Next: Sign</Button>
            </DialogFooter>
          </>
        ) : step === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle>Confirm &amp; Sign</DialogTitle>
              <DialogDescription>
                You&apos;re about to bind yourself to the demo NDA above for {companyName}.
              </DialogDescription>
            </DialogHeader>

            <label className="flex items-start gap-3 rounded-md border border-border bg-muted/40 p-3 cursor-pointer">
              <Checkbox
                checked={agreed}
                onChange={(e) => setAgreed(e.currentTarget.checked)}
                aria-describedby="nda-ack-text"
                className="mt-0.5"
              />
              <span id="nda-ack-text" className="text-sm text-foreground">
                I acknowledge that I have read and agree to the terms of this Non-Disclosure
                Agreement. Signing under EU NDA Regulation.
              </span>
            </label>

            {isError ? (
              <p className="text-xs text-destructive">
                {error instanceof Error ? error.message : "Couldn't record signature. Try again."}
              </p>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep("review")} disabled={isPending}>
                Back
              </Button>
              <Button onClick={handleSign} disabled={!agreed || isPending}>
                {isPending ? "Signing…" : "Complete & Sign"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
                <DialogTitle>You now have access</DialogTitle>
              </div>
              <DialogDescription>
                The NDA for {companyName} is on file. Cap table, team, and data-room
                documents are unlocked.
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center justify-center py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" aria-hidden />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Continue
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

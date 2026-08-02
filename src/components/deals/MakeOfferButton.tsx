"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import OfferComposerDialog from "./OfferComposerDialog";
import { useAuth } from "@/app/_providers/AuthProvider";
import { ROLE_DASHBOARD_ROUTES } from "@/lib/roles";
import { useCreateInvestorOffer } from "@/hooks/queries/deals";
import type { OfferTermsInput } from "@/types/deals";

interface MakeOfferButtonProps {
  companyId: string;
  label?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  className?: string;
}

// Investor-side contextual entry: compose an initial offer for a company, then
// open the resulting deal in the negotiation workspace.
export default function MakeOfferButton({
  companyId,
  label = "Make Offer",
  variant = "default",
  size = "sm",
  className,
}: MakeOfferButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createOffer = useCreateInvestorOffer();

  const submit = async (terms: OfferTermsInput) => {
    setSubmitError(null);
    try {
      const deal = await createOffer.mutateAsync({ companyId, terms });
      setOpen(false);
      const base = user ? ROLE_DASHBOARD_ROUTES[user.role] : "/dashboard/investor";
      router.push(`${base}/deals?d=${deal.dealId}`);
    } catch (err) {
      // Surface the failure instead of swallowing it silently — otherwise the
      // button appears to "do nothing". Keep the dialog open so the investor
      // can adjust terms and retry.
      setSubmitError(extractApiError(err));
    }
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => {
          setSubmitError(null);
          setOpen(true);
        }}
      >
        <FileText className="h-4 w-4" aria-hidden />
        {label}
      </Button>
      <OfferComposerDialog
        open={open}
        onOpenChange={(next) => {
          if (!next) setSubmitError(null);
          setOpen(next);
        }}
        title="Make an offer"
        description="Propose term-sheet economics to the founder. This starts a negotiation."
        submitLabel="Send offer"
        pending={createOffer.isPending}
        submitError={submitError}
        onSubmit={submit}
      />
    </>
  );
}

// Pull a human-readable message out of an axios/HTTP error, falling back to a
// generic line so the user always gets feedback.
function extractApiError(err: unknown): string {
  const e = err as {
    response?: { data?: { error?: string; message?: string } };
    message?: string;
  };
  return (
    e?.response?.data?.error ??
    e?.response?.data?.message ??
    e?.message ??
    "Could not send the offer. Please try again."
  );
}

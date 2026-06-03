"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import OfferComposerDialog from "./OfferComposerDialog";
import { useAuth } from "@/context/AuthContext";
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
  const createOffer = useCreateInvestorOffer();

  const submit = async (terms: OfferTermsInput) => {
    try {
      const deal = await createOffer.mutateAsync({ companyId, terms });
      setOpen(false);
      const base = user ? ROLE_DASHBOARD_ROUTES[user.role] : "/dashboard/investor";
      router.push(`${base}/deals?d=${deal.dealId}`);
    } catch {
      // Surface kept minimal; the host screen stays usable.
    }
  };

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        <FileText className="h-4 w-4" aria-hidden />
        {label}
      </Button>
      <OfferComposerDialog
        open={open}
        onOpenChange={setOpen}
        title="Make an offer"
        description="Propose term-sheet economics to the founder. This starts a negotiation."
        submitLabel="Send offer"
        pending={createOffer.isPending}
        onSubmit={submit}
      />
    </>
  );
}

import { Badge } from "@/components/ui/badge";
import { OFFER_STATUS_LABEL, offerStatusBadge } from "@/lib/deal-utils";

interface DealStatusBadgeProps {
  status: string;
}

// Small wrapper mapping an offer/term-sheet status to a canonical Badge variant.
export default function DealStatusBadge({ status }: DealStatusBadgeProps) {
  return (
    <Badge variant={offerStatusBadge(status)} className="capitalize">
      {OFFER_STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

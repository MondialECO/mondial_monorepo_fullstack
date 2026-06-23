import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { OpportunityDetail } from "@/types/investor/opportunities";
import { roundNameFromType } from "@/lib/term-sheet-derivation";

interface DealTermsSectionProps {
  detail: OpportunityDetail;
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[180px_1fr] sm:gap-4">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="text-sm text-foreground">{value}</dd>
    </div>
  );
}

// NOTE: this read-only preview is NOT bound to a real DealExecution/TermSheet
// (that binding is the Phase-8 Term Sheet Builder, out of scope here). It must
// therefore NOT assert instrument, investor rights, governance, governing law,
// or jurisdiction - those were previously fabricated from the round type and
// shown as if real. We surface only the genuinely-known round stage and tell
// the investor where the binding terms actually come from.
export default function DealTermsSection({ detail }: DealTermsSectionProps) {
  return (
    <Card className="border-border rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Deal Terms</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <Row
            label="Round Stage"
            value={roundNameFromType(detail.fundingRoundType)}
          />
          <Separator />
          <Row
            label="Detailed Terms"
            value={
              <p className="text-sm text-muted-foreground">
                Instrument, investor rights, governance, and closing terms (including
                governing law and jurisdiction) are agreed on the term sheet during
                negotiation. They are not shown here until an offer is on the table.
              </p>
            }
          />
        </dl>
      </CardContent>
    </Card>
  );
}

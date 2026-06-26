import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { OpportunityDetail } from "@/types/investor/opportunities";
import {
  instrumentForRound,
  investorRightsForRound,
  governanceForRound,
  roundNameFromType,
  KEY_CONDITIONS,
} from "@/lib/term-sheet-derivation";

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

export default function DealTermsSection({ detail }: DealTermsSectionProps) {
  const rights = investorRightsForRound(detail.fundingRoundType);
  const gov = governanceForRound(detail.fundingRoundType);

  return (
    <Card className="border-border rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Deal Terms</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <Row
            label="Instrument Type"
            value={instrumentForRound(detail.fundingRoundType)}
          />
          <Separator />
          <Row
            label="Round Stage"
            value={roundNameFromType(detail.fundingRoundType)}
          />
          <Separator />
          <Row
            label="Investor Rights"
            value={
              <ul className="list-disc list-outside pl-4 space-y-0.5">
                {rights.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            }
          />
          <Separator />
          <Row
            label="Governance"
            value={
              <ul className="list-disc list-outside pl-4 space-y-0.5">
                {gov.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            }
          />
          <Separator />
          <Row
            label="Key Conditions"
            value={
              <ul className="list-disc list-outside pl-4 space-y-0.5">
                {KEY_CONDITIONS.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            }
          />
        </dl>
      </CardContent>
    </Card>
  );
}

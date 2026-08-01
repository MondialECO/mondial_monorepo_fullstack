"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import MatchScoreDonut from "@/components/investor/MatchScoreDonut";
import { formatCurrency } from "@/lib/deal-utils";
import { roundNameFromType } from "@/lib/term-sheet-derivation";
import type { OpportunityDetail } from "@/types/investor/opportunities";
import {
  SHARE_CLASS_OPTIONS,
  LIQ_PREF_OPTIONS,
  ANTI_DILUTION_OPTIONS,
  VESTING_OPTIONS,
  GOVERNING_LAW_OPTIONS,
  labelFor,
  num,
  derivedPostMoney,
  derivedEquityPercent,
  type TermSheetDraft,
} from "./builder-model";

/** Document-style clause row: label left, value right, with a subtle leader. */
function Clause({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-2 py-1">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 translate-y-[-2px] border-b border-dashed border-border" aria-hidden />
      <span className="shrink-0 text-xs font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function Article({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-0.5">
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-foreground">
        {n}. {title}
      </h4>
      <div>{children}</div>
    </section>
  );
}

export default function LiveTermSheetPreview({
  detail,
  draft,
}: {
  detail: OpportunityDetail;
  draft: TermSheetDraft;
}) {
  const post = derivedPostMoney(draft);
  const equity = derivedEquityPercent(draft);
  const amount = num(draft.investmentAmount);
  const pre = num(draft.preMoney);
  const dd =
    draft.dueDiligenceDays && draft.dueDiligenceDays !== "none"
      ? `${draft.dueDiligenceDays} days`
      : "—";

  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
      {/* Document masthead */}
      <div className="border-b border-border bg-muted/40 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">
            Term Sheet
          </h3>
          <Badge variant="secondary">Draft</Badge>
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Non-binding summary of proposed terms · {detail.companyName} ·{" "}
          {roundNameFromType(detail.fundingRoundType)}
        </p>
      </div>

      <CardContent className="space-y-4 px-5 py-4">
        {/* Headline */}
        <div className="flex items-center gap-4">
          <MatchScoreDonut score={equity} size={76} />
          <div className="min-w-0">
            <div className="text-xl font-bold tabular-nums text-foreground">
              {amount > 0 ? formatCurrency(amount) : "—"}
            </div>
            <div className="text-[11px] text-muted-foreground">
              for {equity > 0 ? `${equity.toFixed(2)}%` : "—"} ·{" "}
              {labelFor(SHARE_CLASS_OPTIONS, draft.shareClass)}
            </div>
          </div>
        </div>

        <Article n={1} title="Investment & valuation">
          <Clause label="Investment" value={amount > 0 ? formatCurrency(amount) : "—"} />
          <Clause label="Pre-money" value={pre > 0 ? formatCurrency(pre) : "—"} />
          <Clause label="Post-money" value={post > 0 ? formatCurrency(post) : "—"} />
          <Clause label="Investor equity" value={equity > 0 ? `${equity.toFixed(2)}%` : "—"} />
        </Article>

        <Article n={2} title="Instrument & rights">
          <Clause label="Share class" value={labelFor(SHARE_CLASS_OPTIONS, draft.shareClass)} />
          <Clause label="Liquidation pref." value={labelFor(LIQ_PREF_OPTIONS, draft.liquidationPreference)} />
          <Clause label="Anti-dilution" value={labelFor(ANTI_DILUTION_OPTIONS, draft.antiDilution)} />
          <Clause label="Board seats" value={num(draft.boardSeats)} />
          <Clause label="Pro-rata" value={draft.proRata ? "Yes" : "No"} />
          <Clause label="ROFR" value={draft.rofr ? "Yes" : "No"} />
          <Clause label="Co-sale" value={draft.coSale ? "Yes" : "No"} />
          <Clause label="Founder vesting" value={labelFor(VESTING_OPTIONS, draft.vesting)} />
        </Article>

        <Article n={3} title="Closing">
          <Clause label="Governing law" value={labelFor(GOVERNING_LAW_OPTIONS, draft.governingLaw)} />
          <Clause label="Jurisdiction" value={draft.jurisdiction.trim() || "—"} />
          <Clause label="Due diligence" value={dd} />
          <Clause label="Target closing" value={draft.closingDate || "—"} />
        </Article>

        <p className="border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
          Draft · non-binding · eIDAS-compatible e-signature on execution. Final binding terms
          are agreed on the signed term sheet during negotiation.
        </p>
      </CardContent>
    </Card>
  );
}

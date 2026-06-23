"use client";

import { CheckCircle2, Circle, Building2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Field } from "@/app/dashboard/investor/thesis/_components/fields";
import { roundNameFromType } from "@/lib/term-sheet-derivation";
import { formatCurrency } from "@/lib/deal-utils";
import { cn } from "@/lib/utils";
import type { OpportunityDetail } from "@/types/investor/opportunities";
import {
  composeNote,
  coreEconomicsValid,
  num,
  derivedPostMoney,
  derivedEquityPercent,
  labelFor,
  SHARE_CLASS_OPTIONS,
  LIQ_PREF_OPTIONS,
  ANTI_DILUTION_OPTIONS,
  type TermSheetDraft,
} from "./builder-model";

interface StepProps {
  detail: OpportunityDetail;
  draft: TermSheetDraft;
  update: (patch: Partial<TermSheetDraft>) => void;
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}

export default function StepReviewSend({ detail, draft, update }: StepProps) {
  const note = composeNote(draft);
  const ready = coreEconomicsValid(draft);
  const amount = num(draft.investmentAmount);
  const pre = num(draft.preMoney);
  const post = derivedPostMoney(draft);
  const equity = derivedEquityPercent(draft);

  const checks = [
    { label: "Investment amount set", ok: amount > 0 },
    { label: "Pre-money valuation set", ok: pre > 0 },
    { label: "Share class selected", ok: !!draft.shareClass },
    { label: "Post-money & equity computed", ok: post > 0 && equity > 0 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
          aria-hidden
        >
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{detail.companyName}</div>
          <div className="text-xs text-muted-foreground">
            {roundNameFromType(detail.fundingRoundType)}
            {detail.country ? ` · ${detail.country}` : ""}
          </div>
        </div>
      </div>

      {/* Validity checklist */}
      <div className="rounded-xl border border-border p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Validation
        </div>
        <ul className="space-y-1.5">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              {c.ok ? (
                <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/50" aria-hidden />
              )}
              <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Economic + rights summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Economics
          </div>
          <SummaryRow label="Investment" value={amount > 0 ? formatCurrency(amount) : "—"} />
          <SummaryRow label="Pre-money" value={pre > 0 ? formatCurrency(pre) : "—"} />
          <SummaryRow label="Post-money" value={post > 0 ? formatCurrency(post) : "—"} />
          <SummaryRow label="Equity" value={equity > 0 ? `${equity.toFixed(2)}%` : "—"} />
          <SummaryRow label="Share class" value={labelFor(SHARE_CLASS_OPTIONS, draft.shareClass)} />
        </div>
        <div className="rounded-xl border border-border p-4">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Rights
          </div>
          <SummaryRow label="Board seats" value={num(draft.boardSeats)} />
          <SummaryRow label="Pro-rata" value={draft.proRata ? "Yes" : "No"} />
          <SummaryRow label="Liquidation" value={labelFor(LIQ_PREF_OPTIONS, draft.liquidationPreference)} />
          <SummaryRow label="Anti-dilution" value={labelFor(ANTI_DILUTION_OPTIONS, draft.antiDilution)} />
        </div>
      </div>

      <Separator />

      <Field label="Message to founder" hint="Optional context. Sent with the offer.">
        <Textarea
          value={draft.note}
          onChange={(e) => update({ note: e.currentTarget.value })}
          rows={3}
          placeholder="Why you're excited about this round…"
        />
      </Field>

      <div className="space-y-1.5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          What the founder receives
        </div>
        <pre className="max-h-44 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-xs text-foreground/90">
          {note ?? "No additional note — structured terms only."}
        </pre>
      </div>

      <div
        className={cn(
          "inline-flex items-center gap-2 text-sm",
          ready ? "text-primary" : "text-muted-foreground"
        )}
      >
        <CheckCircle2 className="h-4 w-4" aria-hidden />
        {ready
          ? "All terms valid — ready to send."
          : "Set an investment amount and pre-money valuation in Step 1 to send."}
      </div>
    </div>
  );
}

"use client";

import { Input } from "@/components/ui/input";
import { Field } from "@/app/dashboard/investor/thesis/_components/fields";
import { formatCurrency } from "@/lib/deal-utils";
import { cn } from "@/lib/utils";
import {
  SHARE_CLASS_CARDS,
  derivedPostMoney,
  derivedEquityPercent,
  type TermSheetDraft,
} from "./builder-model";

interface StepProps {
  draft: TermSheetDraft;
  update: (patch: Partial<TermSheetDraft>) => void;
}

export default function StepCoreEconomics({ draft, update }: StepProps) {
  const post = derivedPostMoney(draft);
  const equity = derivedEquityPercent(draft);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Investment amount (€)" hint="What you propose to invest this round.">
          <Input
            type="number"
            min={0}
            value={draft.investmentAmount}
            onChange={(e) => update({ investmentAmount: e.currentTarget.value })}
            placeholder="500000"
          />
        </Field>
        <Field label="Pre-money valuation (€)">
          <Input
            type="number"
            min={0}
            value={draft.preMoney}
            onChange={(e) => update({ preMoney: e.currentTarget.value })}
            placeholder="4500000"
          />
        </Field>
      </div>

      <Field label="Share class" hint="The instrument this investment converts into.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SHARE_CLASS_CARDS.map((c) => {
            const active = draft.shareClass === c.value;
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={active}
                onClick={() => update({ shareClass: c.value })}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  active
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:bg-muted"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{c.label}</span>
                  <span
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 rounded-full border",
                      active ? "border-primary bg-primary" : "border-border"
                    )}
                    aria-hidden
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
              </button>
            );
          })}
        </div>
      </Field>

      {/* Post-money and equity are definitional (post = pre + amount; equity =
          amount / post), so they're calculated live rather than hand-entered —
          this keeps the three numbers internally consistent. */}
      <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-2">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Post-money valuation
          </div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {post > 0 ? formatCurrency(post) : "—"}
          </div>
          <div className="text-[11px] text-muted-foreground">calculated · pre + investment</div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Investor equity
          </div>
          <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">
            {equity > 0 ? `${equity.toFixed(2)}%` : "—"}
          </div>
          <div className="text-[11px] text-muted-foreground">calculated · investment / post-money</div>
        </div>
      </div>
    </div>
  );
}

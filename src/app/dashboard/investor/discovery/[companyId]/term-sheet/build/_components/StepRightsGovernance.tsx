"use client";

import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, OptionSelect } from "@/app/dashboard/investor/thesis/_components/fields";
import {
  ANTI_DILUTION_OPTIONS,
  LIQ_PREF_OPTIONS,
  VESTING_OPTIONS,
  GOVERNING_LAW_OPTIONS,
  DUE_DILIGENCE_OPTIONS,
  type TermSheetDraft,
} from "./builder-model";

interface StepProps {
  draft: TermSheetDraft;
  update: (patch: Partial<TermSheetDraft>) => void;
}

function CheckRow({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
      <Checkbox
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        className="mt-0.5"
      />
      <span>
        <span className="text-sm font-medium text-foreground">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

export default function StepRightsGovernance({ draft, update }: StepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Investor rights</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Board seats">
            <Input
              type="number"
              min={0}
              value={draft.boardSeats}
              onChange={(e) => update({ boardSeats: e.currentTarget.value })}
            />
          </Field>
          <Field label="Liquidation preference">
            <OptionSelect
              options={LIQ_PREF_OPTIONS}
              value={draft.liquidationPreference}
              onValueChange={(v) => update({ liquidationPreference: v })}
            />
          </Field>
          <Field label="Anti-dilution">
            <OptionSelect
              options={ANTI_DILUTION_OPTIONS}
              value={draft.antiDilution}
              onValueChange={(v) => update({ antiDilution: v })}
            />
          </Field>
          <Field label="Founder vesting">
            <OptionSelect
              options={VESTING_OPTIONS}
              value={draft.vesting}
              onValueChange={(v) => update({ vesting: v })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <CheckRow
            checked={draft.proRata}
            onChange={(v) => update({ proRata: v })}
            title="Pro-rata rights"
            description="Maintain your ownership % in future rounds."
          />
          <CheckRow
            checked={draft.rofr}
            onChange={(v) => update({ rofr: v })}
            title="Right of first refusal"
            description="First option on shares before third parties."
          />
          <CheckRow
            checked={draft.coSale}
            onChange={(v) => update({ coSale: v })}
            title="Co-sale / tag-along"
            description="Sell alongside founders on a transfer."
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Closing terms</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Governing law">
            <OptionSelect
              options={GOVERNING_LAW_OPTIONS}
              value={draft.governingLaw || null}
              onValueChange={(v) => update({ governingLaw: v })}
              placeholder="Select jurisdiction law…"
            />
          </Field>
          <Field label="Jurisdiction">
            <Input
              value={draft.jurisdiction}
              onChange={(e) => update({ jurisdiction: e.currentTarget.value })}
              placeholder="e.g. London, Paris"
            />
          </Field>
          <Field label="Due-diligence period" hint="Exclusivity window before closing.">
            <OptionSelect
              options={DUE_DILIGENCE_OPTIONS}
              value={draft.dueDiligenceDays}
              onValueChange={(v) => update({ dueDiligenceDays: v })}
            />
          </Field>
          <Field label="Target closing date">
            <Input
              type="date"
              value={draft.closingDate}
              onChange={(e) => update({ closingDate: e.currentTarget.value })}
            />
          </Field>
        </div>

        <p className="inline-flex items-start gap-1.5 text-[11px] text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
          Economics, board, pro-rata, liquidation preference and anti-dilution are sent as
          structured offer terms. Vesting, ROFR, co-sale, governing law, jurisdiction,
          due-diligence period and closing date are included in the offer note and finalised
          on the signed term sheet during negotiation.
        </p>
      </div>
    </div>
  );
}

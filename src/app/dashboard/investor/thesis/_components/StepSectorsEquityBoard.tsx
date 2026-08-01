"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, ChipGroup, OptionSelect } from "./fields";
import {
  BOARD_PARTICIPATION_OPTIONS,
  EQUITY_TYPE_OPTIONS,
  SECTOR_OPTIONS,
} from "./options";
import { toggleIn, type ThesisDraft } from "./draft";

interface StepProps {
  draft: ThesisDraft;
  update: (patch: Partial<ThesisDraft>) => void;
}

export default function StepSectorsEquityBoard({ draft, update }: StepProps) {
  return (
    <div className="space-y-6">
      <Field label="Preferred sectors" hint="Industries you focus on. Select all that apply.">
        <ChipGroup
          options={SECTOR_OPTIONS}
          selected={draft.preferredSectors}
          onToggle={(v) => update({ preferredSectors: toggleIn(draft.preferredSectors, v) })}
        />
      </Field>

      <Field label="Equity preferences" hint="Instruments you're comfortable investing through.">
        <ChipGroup
          options={EQUITY_TYPE_OPTIONS}
          selected={draft.preferredEquityTypes}
          onToggle={(v) =>
            update({ preferredEquityTypes: toggleIn(draft.preferredEquityTypes, v) })
          }
        />
      </Field>

      <Field label="Board participation" hint="Your typical level of board involvement.">
        <OptionSelect
          options={BOARD_PARTICIPATION_OPTIONS}
          value={draft.boardParticipationLevel}
          onValueChange={(v) => update({ boardParticipationLevel: v })}
          placeholder="Select board involvement…"
        />
      </Field>

      <Field label="Pro-rata & rights" hint="Deal terms you typically require.">
        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
            <Checkbox
              checked={draft.requiresProRataRights}
              onChange={(e) => update({ requiresProRataRights: e.currentTarget.checked })}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground">
              I require pro-rata rights
              <span className="block text-xs text-muted-foreground">
                The right to maintain my ownership percentage in future rounds.
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-muted/30 p-3">
            <Checkbox
              checked={draft.requiresBoardSeat}
              onChange={(e) => update({ requiresBoardSeat: e.currentTarget.checked })}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground">
              I require a board seat
              <span className="block text-xs text-muted-foreground">
                A formal board seat as a condition of investing.
              </span>
            </span>
          </label>
        </div>
      </Field>
    </div>
  );
}

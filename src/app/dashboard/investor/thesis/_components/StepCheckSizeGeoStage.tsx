"use client";

import { Input } from "@/components/ui/input";
import { Field, ChipGroup } from "./fields";
import { GEOGRAPHY_OPTIONS, STAGE_OPTIONS } from "./options";
import { toggleIn, type ThesisDraft } from "./draft";

interface StepProps {
  draft: ThesisDraft;
  update: (patch: Partial<ThesisDraft>) => void;
}

export default function StepCheckSizeGeoStage({ draft, update }: StepProps) {
  const invalidRange = draft.maxCheckSize > 0 && draft.minCheckSize > draft.maxCheckSize;

  return (
    <div className="space-y-6">
      <Field
        label="Check size"
        hint="The range you typically write per investment, in EUR."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Minimum (€)</span>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={Number.isFinite(draft.minCheckSize) ? draft.minCheckSize : 0}
              onChange={(e) => update({ minCheckSize: Number(e.currentTarget.value) || 0 })}
            />
          </div>
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground">Maximum (€)</span>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={Number.isFinite(draft.maxCheckSize) ? draft.maxCheckSize : 0}
              onChange={(e) => update({ maxCheckSize: Number(e.currentTarget.value) || 0 })}
            />
          </div>
        </div>
        {invalidRange ? (
          <p className="text-xs text-destructive">
            Minimum check size cannot exceed the maximum.
          </p>
        ) : null}
      </Field>

      <Field label="Geographic focus" hint="Where you invest. Select all that apply.">
        <ChipGroup
          options={GEOGRAPHY_OPTIONS}
          selected={draft.preferredGeographies}
          onToggle={(v) =>
            update({ preferredGeographies: toggleIn(draft.preferredGeographies, v) })
          }
        />
      </Field>

      <Field label="Preferred stages" hint="The rounds you typically lead or join.">
        <ChipGroup
          options={STAGE_OPTIONS}
          selected={draft.preferredStages}
          onToggle={(v) => update({ preferredStages: toggleIn(draft.preferredStages, v) })}
        />
      </Field>
    </div>
  );
}

"use client";

import { Textarea } from "@/components/ui/textarea";
import { Field, OptionSelect } from "./fields";
import {
  FOLLOW_ON_OPTIONS,
  PREFERRED_ROLE_OPTIONS,
  RETURN_MULTIPLE_OPTIONS,
} from "./options";
import type { ThesisDraft } from "./draft";

interface StepProps {
  draft: ThesisDraft;
  update: (patch: Partial<ThesisDraft>) => void;
}

const MAX_THESIS = 1000;

export default function StepPhilosophy({ draft, update }: StepProps) {
  return (
    <div className="space-y-6">
      <Field
        label="Thesis statement"
        hint="In your own words: what you back, and why. Shown on your public profile."
      >
        <Textarea
          rows={5}
          maxLength={MAX_THESIS}
          value={draft.thesisStatement}
          onChange={(e) => update({ thesisStatement: e.currentTarget.value })}
          placeholder="We back technical founders building…"
        />
        <p className="text-right text-xs text-muted-foreground tabular-nums">
          {draft.thesisStatement.length}/{MAX_THESIS}
        </p>
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Target return multiple" hint="Your fund-level return expectation.">
          <OptionSelect
            options={RETURN_MULTIPLE_OPTIONS}
            value={draft.targetReturnMultiple}
            onValueChange={(v) => update({ targetReturnMultiple: v })}
            placeholder="Select target multiple…"
          />
        </Field>

        <Field label="Preferred role" hint="How you usually participate in a round.">
          <OptionSelect
            options={PREFERRED_ROLE_OPTIONS}
            value={draft.preferredRole}
            onValueChange={(v) => update({ preferredRole: v })}
            placeholder="Select preferred role…"
          />
        </Field>
      </div>

      <Field label="Follow-on policy" hint="How you approach follow-on investments.">
        <OptionSelect
          options={FOLLOW_ON_OPTIONS}
          value={draft.followOnPolicy}
          onValueChange={(v) => update({ followOnPolicy: v })}
          placeholder="Select follow-on policy…"
        />
      </Field>
    </div>
  );
}

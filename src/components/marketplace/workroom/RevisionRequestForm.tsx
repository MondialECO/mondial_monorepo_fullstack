'use client';

import { Input } from '@/components/ui/input';

const SCOPES = [
  'WithinScope',
  'NeedsClarification',
  'PotentialScopeChange',
  'ConfirmedScopeChange',
] as const;

export interface RevisionFormState {
  description: string;
  changesText: string;
  scopeClassification: (typeof SCOPES)[number];
  confirmed: boolean;
}

export const emptyRevisionForm: RevisionFormState = {
  description: '',
  changesText: '',
  scopeClassification: 'WithinScope',
  confirmed: false,
};

/** Backend requires description, >=1 requested change, and the consolidation flag. */
export function isRevisionFormValid(state: RevisionFormState): boolean {
  return (
    state.description.trim().length > 0 &&
    parseChanges(state.changesText).length > 0 &&
    state.confirmed
  );
}

export function parseChanges(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function RevisionRequestForm({
  state,
  onChange,
  remainingRevisions,
  unlimitedRevisions,
}: {
  state: RevisionFormState;
  onChange: (next: RevisionFormState) => void;
  remainingRevisions: number;
  unlimitedRevisions: boolean;
}) {
  const withinScope = state.scopeClassification === 'WithinScope';
  const noneLeft = withinScope && !unlimitedRevisions && remainingRevisions <= 0;

  return (
    <div className="space-y-3 text-left">
      <div>
        <label htmlFor="rev-desc" className="mb-1 block text-xs font-medium text-foreground">
          What needs changing?
        </label>
        <textarea
          id="rev-desc"
          value={state.description}
          onChange={(e) => onChange({ ...state, description: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          placeholder="Summarise the revision you're asking for"
        />
      </div>

      <div>
        <label htmlFor="rev-changes" className="mb-1 block text-xs font-medium text-foreground">
          Specific changes — one per line
        </label>
        <textarea
          id="rev-changes"
          value={state.changesText}
          onChange={(e) => onChange({ ...state, changesText: e.target.value })}
          rows={3}
          className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          placeholder={'Change the header colour\nSwap the hero image'}
        />
      </div>

      <div>
        <label htmlFor="rev-scope" className="mb-1 block text-xs font-medium text-foreground">
          Scope
        </label>
        <select
          id="rev-scope"
          value={state.scopeClassification}
          onChange={(e) =>
            onChange({ ...state, scopeClassification: e.target.value as RevisionFormState['scopeClassification'] })
          }
          className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {SCOPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {withinScope && (
          <p className="mt-1 text-xs text-muted-foreground">
            {unlimitedRevisions
              ? 'Unlimited revisions included.'
              : `${remainingRevisions} included revision${remainingRevisions === 1 ? '' : 's'} remaining.`}
          </p>
        )}
        {noneLeft && (
          <p className="mt-1 text-xs text-destructive">
            No included revisions remain — the provider may decline or treat this as a paid
            change request.
          </p>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-xs">
        <Input
          type="checkbox"
          checked={state.confirmed}
          onChange={(e) => onChange({ ...state, confirmed: e.target.checked })}
          className="mt-0.5 size-4"
        />
        <span className="text-foreground">
          This is my consolidated feedback — I&apos;ve gathered everything I want changed.
        </span>
      </label>
    </div>
  );
}

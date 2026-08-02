'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, Gavel, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  DISPUTE_OUTCOMES,
  resolveDispute,
  type DisputeOutcomeValue,
} from '@/lib/api-workroom-admin';
import { workroomErrorMessage } from '@/lib/workroom-format';
import { PROVIDER_FAVORED } from '@/lib/workroom-status';

export function DisputeResolutionPanel() {
  const [milestoneId, setMilestoneId] = useState('');
  const [outcome, setOutcome] = useState<DisputeOutcomeValue>(PROVIDER_FAVORED);
  const [reason, setReason] = useState('');

  const resolve = useMutation({
    mutationFn: () => resolveDispute(milestoneId.trim(), outcome, reason.trim()),
    onSuccess: () => {
      setMilestoneId('');
      setReason('');
    },
  });

  const selected = DISPUTE_OUTCOMES.find((o) => o.value === outcome);
  const canSubmit = milestoneId.trim().length > 0 && reason.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-warning/30 bg-warning/10 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          <AlertTriangle className="size-4" />
          Milestone ID must be entered manually
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          There is no endpoint that lists disputes. Both workroom read endpoints are
          participant-scoped, so an admin cannot enumerate or fetch engagements they are
          not part of. Until a admin-scoped read endpoint exists, take the milestone ID
          from the provider workroom URL — the <code>milestone</code> query parameter on{' '}
          <code>/dashboard/serviceprovider/workroom</code>.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
          <Gavel className="size-4" />
          Resolve a milestone dispute
        </h2>

        <div className="mt-5 space-y-5">
          <div>
            <label
              htmlFor="dispute-milestone-id"
              className="text-sm font-medium text-foreground"
            >
              Milestone ID
            </label>
            <Input
              id="dispute-milestone-id"
              value={milestoneId}
              onChange={(e) => setMilestoneId(e.target.value)}
              placeholder="e.g. 68a1f4c9e2b7d3a05c9f1e42"
              className="mt-2 font-mono"
            />
          </div>

          <fieldset>
            <legend className="text-sm font-medium text-foreground">Outcome</legend>
            <div className="mt-2 space-y-2">
              {DISPUTE_OUTCOMES.map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="dispute-outcome"
                    value={option.value}
                    checked={outcome === option.value}
                    onChange={() => setOutcome(option.value)}
                    className="mt-0.5 accent-primary"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {option.effect}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {/* Split is intentionally absent — the backend rejects it pending an explicit
                contract-amendment flow (canon §10.7). */}
          </fieldset>

          <div>
            <label htmlFor="dispute-reason" className="text-sm font-medium text-foreground">
              Reason
            </label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Recorded verbatim on the audit event. Both parties&apos; trust signals are
              recalculated after resolution.
            </p>
            <Textarea
              id="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          {resolve.isError && (
            <p className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {workroomErrorMessage(resolve.error, 'The dispute could not be resolved. Please try again.')}
            </p>
          )}

          {resolve.isSuccess && (
            <p className="flex items-start gap-2 rounded-md border border-success-text/20 bg-success-light p-3 text-sm text-success-text">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              Dispute resolved. Both workroom sessions need a reload — or up to 30 seconds
              — before the new state appears.
            </p>
          )}

          <Button onClick={() => resolve.mutate()} disabled={!canSubmit || resolve.isPending}>
            {resolve.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Resolving…
              </>
            ) : (
              `Resolve as ${selected?.label.toLowerCase()}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

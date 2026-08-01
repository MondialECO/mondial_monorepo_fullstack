'use client';

import { useState } from 'react';
import {
  useClientCompleteEngagement,
  useClientPauseEngagement,
  useClientResumeEngagement,
  workroomErrorMessage,
} from '@/hooks/queries/workroom-client';
import { ConfirmAction } from './ConfirmAction';
import type { WorkroomDetail } from '@/types/workroom';

const CLOSED = new Set(['Completed', 'Cancelled', 'Archived']);

export function EngagementActions({ detail }: { detail: WorkroomDetail }) {
  const { engagement, milestones, revisionRequests } = detail;
  const pause = useClientPauseEngagement();
  const resume = useClientResumeEngagement();
  const complete = useClientCompleteEngagement();

  const [pauseReason, setPauseReason] = useState('');

  const status = engagement.engagementStatus;
  const isPaused = status === 'Paused';
  const isClosed = CLOSED.has(status);

  // Mirrors the backend's completion preconditions so the button explains itself
  // rather than only failing on click. The server still re-checks authoritatively.
  const allPaid = milestones.length > 0 && milestones.every((m) => m.status === 'Paid');
  const openDispute = milestones.some((m) => m.status === 'Disputed');
  const openRevision = revisionRequests.some(
    (r) => !['Resolved', 'Cancelled'].includes(r.revisionRequestStatus)
  );
  const canComplete = allPaid && !openDispute && !openRevision;

  const completeBlockedReason = !allPaid
    ? 'All milestones must be paid first.'
    : openDispute
      ? 'An open dispute must be resolved first.'
      : openRevision
        ? 'An open revision request must be resolved first.'
        : undefined;

  if (isClosed) return null;

  return (
    <div className="flex flex-wrap items-start gap-2">
      {isPaused ? (
        <ConfirmAction
          label="Resume"
          variant="outline"
          title="Resume this engagement?"
          body="Deadlines shift forward by however long the engagement was paused."
          confirmLabel="Resume"
          isPending={resume.isPending}
          errorMessage={resume.isError ? workroomErrorMessage(resume.error) : null}
          onConfirm={() => resume.mutate(engagement.id)}
        />
      ) : (
        <ConfirmAction
          label="Pause"
          variant="outline"
          title="Pause this engagement?"
          body="Deadline clocks freeze until you resume."
          confirmLabel="Pause"
          isPending={pause.isPending}
          errorMessage={pause.isError ? workroomErrorMessage(pause.error) : null}
          canConfirm={pauseReason.trim().length > 0}
          onConfirm={() => pause.mutate({ id: engagement.id, reason: pauseReason.trim() })}
        >
          <textarea
            value={pauseReason}
            onChange={(e) => setPauseReason(e.target.value)}
            rows={2}
            placeholder="Reason (required)"
            className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </ConfirmAction>
      )}

      <ConfirmAction
        label="Complete engagement"
        title="Mark this engagement complete?"
        body="This closes the workroom. You'll be able to leave a review afterwards."
        confirmLabel="Complete"
        isPending={complete.isPending}
        errorMessage={complete.isError ? workroomErrorMessage(complete.error) : null}
        disabled={!canComplete}
        disabledReason={completeBlockedReason}
        onConfirm={() => complete.mutate(engagement.id)}
      />
    </div>
  );
}

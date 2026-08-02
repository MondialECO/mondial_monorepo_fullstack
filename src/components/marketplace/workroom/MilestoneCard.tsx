'use client';

import { useState } from 'react';
import { CalendarClock, CheckCircle2, FileCheck2, Info, RotateCcw } from 'lucide-react';
import { formatPrice } from '@/lib/marketplace-format';
import { isRefundedMilestone, milestoneChipClass, milestoneStatusLabel } from '@/lib/workroom-status';
import {
  useClientApproveMilestone,
  useClientDecideExtension,
  useClientFundMilestone,
  useClientOpenDispute,
  useClientRequestRevision,
  workroomErrorMessage,
} from '@/hooks/queries/workroom-client';
import { ConfirmAction } from './ConfirmAction';
import {
  emptyRevisionForm,
  isRevisionFormValid,
  parseChanges,
  RevisionRequestForm,
  type RevisionFormState,
} from './RevisionRequestForm';
import type { Deliverable, Milestone, RevisionRequest } from '@/types/workroom';

/** States where a submitted deliverable is sitting with the client. */
const AWAITING_CLIENT = new Set(['ClientReviewing', 'Resubmitted']);

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function MilestoneCard({
  milestone,
  deliverables,
  revisionRequests,
  contractSigned,
}: {
  milestone: Milestone;
  deliverables: Deliverable[];
  revisionRequests: RevisionRequest[];
  contractSigned: boolean;
}) {
  const fund = useClientFundMilestone();
  const approve = useClientApproveMilestone();
  const revision = useClientRequestRevision();
  const dispute = useClientOpenDispute();
  const extension = useClientDecideExtension();

  const [revisionForm, setRevisionForm] = useState<RevisionFormState>(emptyRevisionForm);
  const [disputeReason, setDisputeReason] = useState('');
  const [extensionReason, setExtensionReason] = useState('');

  const status = milestone.status;
  const money = formatPrice(milestone.amount, milestone.currency);
  // Paid covers both settlement directions; refunded must not read as "provider paid".
  const refunded = isRefundedMilestone(milestone);

  // Latest submission for this milestone; earlier ones are Superseded server-side.
  const latestDeliverable = [...deliverables]
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
    .at(0);
  const latestRevision = revisionRequests.at(-1);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="min-w-0 text-lg font-semibold text-foreground">{milestone.title}</h3>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${milestoneChipClass(milestone)}`}
        >
          {milestoneStatusLabel(milestone)}
        </span>
      </div>

      {milestone.description && (
        <p className="mb-2 text-sm text-muted-foreground">{milestone.description}</p>
      )}

      {/* Metadata row: only fields that are actually present. */}
      <p className="text-xs text-muted-foreground">
        {/* Amount is split out of the joined list so a refunded milestone can strike it
            through — the money went back to the buyer, so the figure is no longer owed. */}
        <span className={refunded ? 'line-through' : undefined}>Amount {money}</span>
        {[
          milestone.dueDate ? `Due ${formatDate(milestone.dueDate)}` : null,
          milestone.approvedExtensionDays > 0
            ? `+${milestone.approvedExtensionDays}d extension`
            : null,
          milestone.unlimitedRevisions
            ? 'Unlimited revisions'
            : `${milestone.remainingRevisions} revisions left`,
          milestone.escrowStatus ? `Escrow ${milestone.escrowStatus}` : null,
        ]
          .filter(Boolean)
          .map((part) => ` · ${part}`)
          .join('')}
      </p>

      {/* Provider-requested extension — sits above state content because it's
          actionable regardless of which state the milestone is otherwise in. */}
      {milestone.extensionRequested && (
        <div className="mt-3 rounded-md border border-warning/30 bg-warning/10 p-3">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CalendarClock className="size-4" />
            The provider requested a deadline extension
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <ConfirmAction
              label="Approve extension"
              title="Approve the extension?"
              body="The milestone due date shifts by the number of days you approve."
              confirmLabel="Approve"
              isPending={extension.isPending}
              errorMessage={extension.isError ? workroomErrorMessage(extension.error) : null}
              canConfirm={extensionReason.trim().length > 0}
              onConfirm={() =>
                extension.mutate({
                  id: milestone.id,
                  payload: { approve: true, days: 7, reason: extensionReason.trim() },
                })
              }
            >
              <textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                rows={2}
                placeholder="Reason (required)"
                className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </ConfirmAction>

            <ConfirmAction
              label="Decline"
              variant="outline"
              title="Decline the extension?"
              body="The original due date stands."
              confirmLabel="Decline"
              isPending={extension.isPending}
              errorMessage={extension.isError ? workroomErrorMessage(extension.error) : null}
              canConfirm={extensionReason.trim().length > 0}
              onConfirm={() =>
                extension.mutate({
                  id: milestone.id,
                  // days must be >= 1 even when declining: ExtensionDecisionRequest
                  // carries [Range(1,365)] and validates before the approve flag is
                  // read. Sending 0 fails validation. Do not "fix" this to 0.
                  payload: { approve: false, days: 1, reason: extensionReason.trim() },
                })
              }
            >
              <textarea
                value={extensionReason}
                onChange={(e) => setExtensionReason(e.target.value)}
                rows={2}
                placeholder="Reason (required)"
                className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </ConfirmAction>
          </div>
        </div>
      )}

      <div className="mt-3">
        {status === 'FundingRequired' && (
          <ConfirmAction
            label="Fund escrow"
            title={`Authorise ${money} to escrow?`}
            body="Funds are held in escrow and released only when you approve the delivery. Simulated in development — no real payment is taken."
            confirmLabel={`Fund ${money}`}
            isPending={fund.isPending}
            errorMessage={fund.isError ? workroomErrorMessage(fund.error) : null}
            disabled={!contractSigned}
            disabledReason={!contractSigned ? 'Both parties must sign the contract first.' : undefined}
            onConfirm={() => fund.mutate(milestone.id)}
          />
        )}

        {status === 'Funded' && (
          <Note>Escrow funded. Waiting for the provider to start this milestone.</Note>
        )}

        {status === 'Active' && (
          <Note>The provider is working. The delivery will appear here for your review.</Note>
        )}

        {AWAITING_CLIENT.has(status) && (
          <div className="space-y-3">
            {latestDeliverable ? (
              <div className="rounded-md border border-border bg-card p-3">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <FileCheck2 className="size-4" />
                  {latestDeliverable.title}
                  <span className="text-xs font-normal text-muted-foreground">
                    v{latestDeliverable.version}
                  </span>
                </p>
                {latestDeliverable.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {latestDeliverable.description}
                  </p>
                )}
                {latestDeliverable.clientInstructions && (
                  <p className="mt-2 rounded bg-muted p-2 text-xs text-muted-foreground">
                    {latestDeliverable.clientInstructions}
                  </p>
                )}
                {latestDeliverable.externalLinks?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {latestDeliverable.externalLinks.map((link, i) => (
                      <li key={i}>
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary underline"
                        >
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <Note>Awaiting your review.</Note>
            )}

            <div className="flex flex-wrap gap-2">
              <ConfirmAction
                label="Approve & release payment"
                title={`Release ${money} to the provider?`}
                body="This approves the delivery and releases escrow. It can't be undone."
                confirmLabel={`Release ${money}`}
                isPending={approve.isPending}
                errorMessage={approve.isError ? workroomErrorMessage(approve.error) : null}
                onConfirm={() => approve.mutate(milestone.id)}
              />

              <ConfirmAction
                label="Request revision"
                variant="outline"
                title="Request a revision"
                body="The provider will be asked to rework this delivery."
                confirmLabel="Send revision request"
                isPending={revision.isPending}
                errorMessage={revision.isError ? workroomErrorMessage(revision.error) : null}
                canConfirm={isRevisionFormValid(revisionForm)}
                onConfirm={() =>
                  revision.mutate({
                    id: milestone.id,
                    payload: {
                      description: revisionForm.description.trim(),
                      requestedChanges: parseChanges(revisionForm.changesText),
                      scopeClassification: revisionForm.scopeClassification,
                      consolidatedFeedbackConfirmed: revisionForm.confirmed,
                    },
                  })
                }
              >
                <RevisionRequestForm
                  state={revisionForm}
                  onChange={setRevisionForm}
                  remainingRevisions={milestone.remainingRevisions}
                  unlimitedRevisions={milestone.unlimitedRevisions}
                />
              </ConfirmAction>

              <ConfirmAction
                label="Open dispute"
                variant="outline"
                className="text-destructive border-destructive/50 hover:bg-destructive/10"
                title="Open a dispute?"
                body="Escrow is put on hold and an admin reviews the milestone. Other actions are locked until it's resolved."
                confirmLabel="Open dispute"
                isPending={dispute.isPending}
                errorMessage={dispute.isError ? workroomErrorMessage(dispute.error) : null}
                canConfirm={disputeReason.trim().length > 0}
                onConfirm={() =>
                  dispute.mutate({ id: milestone.id, reason: disputeReason.trim() })
                }
              >
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={3}
                  placeholder="Why are you disputing this delivery? (required)"
                  className="w-full rounded-md border border-input bg-background p-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </ConfirmAction>
            </div>
          </div>
        )}

        {status === 'RevisionRequested' && (
          <div>
            <Note>Revision requested — waiting for the provider to start.</Note>
            {latestRevision && (
              <div className="mt-2 rounded-md border border-border p-3">
                <p className="text-sm text-foreground">{latestRevision.description}</p>
                {latestRevision.requestedChanges?.length > 0 && (
                  <ul className="mt-1 list-inside list-disc">
                    {latestRevision.requestedChanges.map((c, i) => (
                      <li key={i} className="text-xs text-muted-foreground">
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {status === 'RevisionInProgress' && (
          <Note>The provider is working on your revision.</Note>
        )}

        {status === 'Paid' && !refunded && (
          <p className="flex items-center gap-2 text-sm text-success-text">
            <CheckCircle2 className="size-4" />
            Milestone complete. {money} released to the provider.
          </p>
        )}

        {refunded && (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <RotateCcw className="size-4" />
            Dispute resolved in your favour. {money} was refunded to you.
          </p>
        )}

        {status === 'Disputed' && (
          <Note>Dispute open — under review. Other actions are locked until it resolves.</Note>
        )}

        {status === 'Cancelled' && <Note>This milestone was cancelled.</Note>}

        {/* Backend states with no client-facing action (Draft, SubmissionDraft,
            Submitted, Approved, PaymentProcessing) intentionally render nothing
            beyond the status chip rather than inventing a label. */}
      </div>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 text-sm text-muted-foreground">
      <Info className="mt-0.5 size-4 shrink-0" />
      {children}
    </p>
  );
}

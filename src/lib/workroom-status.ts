/**
 * Light colour-coding for workroom statuses. The backend's raw value is always
 * what gets rendered — this only picks a tone. Unknown values fall through to
 * neutral rather than being relabelled, so new backend states degrade safely.
 */
type Tone = 'neutral' | 'progress' | 'waiting' | 'good' | 'bad';

const TONES: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  progress: 'bg-primary/10 text-primary',
  // Semantic pairs — both --warning and --success-text carry .dark values, so no
  // dark: variants are needed here.
  waiting: 'bg-warning/10 text-warning',
  good: 'bg-success-light text-success-text',
  bad: 'bg-destructive/10 text-destructive',
};

const STATUS_TONES: Record<string, Tone> = {
  // Engagement
  ContractPending: 'waiting',
  EscrowPending: 'waiting',
  ReadyToStart: 'progress',
  Active: 'progress',
  Paused: 'waiting',
  ClientInputRequired: 'waiting',
  MilestoneReview: 'progress',
  RevisionInProgress: 'progress',
  FinalDelivery: 'progress',
  Completed: 'good',
  Cancelled: 'neutral',
  Disputed: 'bad',
  Archived: 'neutral',
  // Milestone
  Draft: 'neutral',
  FundingRequired: 'waiting',
  Funded: 'progress',
  SubmissionDraft: 'progress',
  Submitted: 'progress',
  ClientReviewing: 'waiting',
  RevisionRequested: 'waiting',
  Resubmitted: 'waiting',
  Approved: 'good',
  PaymentProcessing: 'progress',
  Paid: 'good',
  // Escrow
  NotFunded: 'neutral',
  Released: 'good',
  Refunded: 'neutral',
  OnHold: 'bad',
  Failed: 'bad',
};

export function statusChipClass(status: string): string {
  return TONES[STATUS_TONES[status] ?? 'neutral'];
}

/** The subset of a milestone these helpers need, so they work on partial shapes too. */
type SettledMilestone = { status: string; refundedAt?: string | null };
type DisputedMilestone = { status: string; disputeOutcome?: string | null };

/**
 * Presentation state of a milestone's dispute, or null if it was never disputed.
 *
 * `disputeOutcome` is the authoritative flag — `Open` means in flight, any other value
 * means settled. Never derive this from `disputeOpenedAt`, which the backend keeps as
 * immutable history and never clears (canon §10.7, commit 6289f13).
 */
export function disputeState(milestone: DisputedMilestone): 'open' | 'resolved' | null {
  if (!milestone.disputeOutcome) return null;
  return milestone.disputeOutcome === 'Open' ? 'open' : 'resolved';
}

/**
 * A milestone carries at most one dispute for its whole lifetime. The backend keys the
 * dispute ledger entry on `dispute:{milestoneId}` against a unique index, so a second
 * open throws a duplicate-key error that surfaces as an unhandled 500 rather than a
 * useful message. Once `disputeOutcome` is set — open or resolved — this milestone's
 * dispute chapter is closed.
 *
 * This matters most right after a provider-favoured resolution, which returns the
 * milestone to ClientReviewing: status alone would happily re-offer the button.
 */
export function canOpenDispute(milestone: DisputedMilestone): boolean {
  if (milestone.disputeOutcome) return false;
  return ['Submitted', 'ClientReviewing', 'Resubmitted', 'RevisionRequested'].includes(
    milestone.status
  );
}

/**
 * A milestone whose escrow went back to the client after a client-favoured dispute.
 * The backend broadens `Paid` to mean "payment settled" in either direction — released
 * to the provider OR refunded to the client — so `status === 'Paid'` alone no longer
 * implies anyone was paid. `refundedAt` is the only thing that separates the two.
 */
export function isRefundedMilestone(milestone: SettledMilestone): boolean {
  return milestone.status === 'Paid' && !!milestone.refundedAt;
}

/** Never render a refunded milestone as "Paid" — it reads as the provider having been paid. */
export function milestoneStatusLabel(milestone: SettledMilestone): string {
  return isRefundedMilestone(milestone) ? 'Refunded' : milestone.status;
}

/**
 * Chip classes for a milestone. Refunded resolves to the `bad` tone rather than the
 * `good` tone `Paid` would otherwise get. Escrow chips keep calling statusChipClass
 * directly — an escrow status of `Refunded` stays neutral, since at that level it is
 * a settled outcome rather than a loss.
 */
export function milestoneChipClass(milestone: SettledMilestone): string {
  return isRefundedMilestone(milestone) ? TONES.bad : statusChipClass(milestone.status);
}

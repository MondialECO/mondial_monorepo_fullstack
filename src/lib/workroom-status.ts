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

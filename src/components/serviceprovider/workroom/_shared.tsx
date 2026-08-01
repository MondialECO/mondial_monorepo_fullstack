import type { Engagement, Milestone } from '@/types/workroom';

export type NavigationChange = (change: Record<string, string | null>, replace?: boolean) => void;

export function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatDate(value?: string | null, includeTime = false) {
  if (!value) return 'Not set';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not set';
  return new Intl.DateTimeFormat(undefined, includeTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(date);
}

export function words(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function apiError(error: unknown, fallback: string) {
  return (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

export function engagementTone(status: string) {
  if (status === 'Completed' || status === 'Archived') return 'positive' as const;
  if (status === 'Disputed' || status === 'Cancelled') return 'negative' as const;
  if (status === 'Paused' || status === 'ClientInputRequired') return 'warning' as const;
  if (status === 'Active' || status === 'MilestoneReview' || status === 'RevisionInProgress' || status === 'FinalDelivery') return 'info' as const;
  return 'neutral' as const;
}

export function milestoneTone(status: string) {
  if (status === 'Paid' || status === 'Approved') return 'positive' as const;
  if (status === 'Disputed' || status === 'Cancelled') return 'negative' as const;
  if (status === 'RevisionRequested' || status === 'RevisionInProgress') return 'warning' as const;
  if (status === 'Active' || status === 'Submitted' || status === 'ClientReviewing' || status === 'Resubmitted') return 'info' as const;
  return 'neutral' as const;
}

/** Lifecycle-terminal. Drives the Active/Completed split in the project list. */
export function terminalEngagement(engagement: Engagement) {
  return ['Completed', 'Archived', 'Cancelled'].includes(engagement.engagementStatus);
}

/**
 * No further provider actions are permitted. Broader than terminalEngagement: a
 * Disputed engagement is still in flight (so it belongs in the Active list) but
 * the backend rejects submissions on it, and offering a button that fails is
 * worst precisely when the provider is already in a dispute.
 */
export function providerActionsLocked(engagement: Engagement) {
  return terminalEngagement(engagement) || engagement.engagementStatus === 'Disputed';
}

export function canOpenDispute(milestone: Milestone) {
  return ['Submitted', 'ClientReviewing', 'Resubmitted', 'RevisionRequested'].includes(milestone.status);
}

export function relativeDue(value?: string | null) {
  if (!value) return { label: 'No due date', urgent: false, overdue: false };
  const remaining = new Date(value).getTime() - Date.now();
  const days = Math.ceil(Math.abs(remaining) / 86_400_000);
  if (remaining < 0) return { label: `${days}d overdue`, urgent: true, overdue: true };
  if (days <= 3) return { label: `Due in ${days}d`, urgent: true, overdue: false };
  return { label: `Due ${formatDate(value)}`, urgent: false, overdue: false };
}

export function localDateTime(hoursOffset = 0) {
  const date = new Date(Date.now() + hoursOffset * 3_600_000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

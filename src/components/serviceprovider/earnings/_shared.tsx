import type { FinancialTransaction } from '@/types/workroom';

/**
 * Tone for a status badge across the earnings surface. Three different enums reach this:
 * PaymentStatus (activity rows), PayoutStatus (payouts) and InvoiceStatus (invoices).
 *
 * It previously knew only the PaymentStatus vocabulary. That was invisible while these
 * fields arrived as integer ordinals and every branch missed, but once the wire started
 * sending real names it would have left 4 of 8 payout statuses and all 7 invoice statuses
 * falling through to neutral — a cancelled invoice rendering identically to a paid one.
 *
 * Draft, Corrected and CreditNote stay neutral deliberately: they are not good or bad
 * news, and inventing a colour for them would assert a meaning the domain has not defined.
 */
export function transactionTone(status: string) {
  // Settled, in the provider's favour.
  if (status === 'Completed' || status === 'Released' || status === 'Paid') return 'positive' as const;
  if (status === 'Failed' || status === 'Refunded' || status === 'Cancelled') return 'negative' as const;
  if (status === 'OnHold' || status === 'Disputed') return 'warning' as const;
  // In flight — awaiting a step that is expected to succeed.
  if (
    status === 'Pending' ||
    status === 'Processing' ||
    status === 'Requested' ||
    status === 'UnderReview' ||
    status === 'Generated' ||
    status === 'Issued'
  )
    return 'info' as const;
  return 'neutral' as const;
}

export function transactionAmount(transaction: FinancialTransaction) {
  if (transaction.transactionType === 'PayoutCompleted') return -transaction.grossAmount;
  return transaction.netAmount !== 0 ? transaction.netAmount : transaction.grossAmount;
}

export function shortReference(value?: string | null) {
  return value ? value.slice(-8).toUpperCase() : 'Not linked';
}

export function todayInput() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function monthStartInput() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(start.getTime() - start.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

export function rangeIso(value: string, exclusiveEnd = false) {
  const date = new Date(`${value}T00:00:00`);
  if (exclusiveEnd) date.setDate(date.getDate() + 1);
  return date.toISOString();
}

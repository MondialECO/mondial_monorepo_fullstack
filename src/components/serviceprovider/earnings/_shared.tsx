import type { FinancialTransaction } from '@/types/workroom';

export function transactionTone(status: string) {
  if (status === 'Completed' || status === 'Released') return 'positive' as const;
  if (status === 'Failed' || status === 'Refunded') return 'negative' as const;
  if (status === 'OnHold' || status === 'Disputed') return 'warning' as const;
  if (status === 'Pending' || status === 'Processing') return 'info' as const;
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

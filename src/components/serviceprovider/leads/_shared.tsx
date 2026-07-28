import type { ClientBrief, Proposal } from '@/types/leads';

export type NavigationChange = (
  change: Record<string, string | null>,
  replace?: boolean,
) => void;

export function money(value: number, currency: string) {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatDate(value?: string | null, includeTime = false) {
  if (!value) return 'Not set';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not set';
  return new Intl.DateTimeFormat(undefined, includeTime
    ? { dateStyle: 'medium', timeStyle: 'short' }
    : { dateStyle: 'medium' }).format(parsed);
}

export function formatEnum(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}

export function briefIsExpired(brief: ClientBrief) {
  return brief.status === 'Expired' || (!!brief.expiresAt && new Date(brief.expiresAt).getTime() <= Date.now());
}

export function proposalIsExpired(proposal: Proposal) {
  return proposal.status === 'Expired' || (!!proposal.expiresAt && new Date(proposal.expiresAt).getTime() <= Date.now());
}

export function expirationLabel(value?: string | null) {
  if (!value) return { label: 'No expiry set', urgent: false, expired: false };
  const remaining = new Date(value).getTime() - Date.now();
  if (remaining <= 0) return { label: 'Expired', urgent: true, expired: true };
  const hours = Math.ceil(remaining / 3_600_000);
  if (hours < 48) return { label: `Expires in ${hours}h`, urgent: true, expired: false };
  const days = Math.ceil(hours / 24);
  return { label: `Expires in ${days}d`, urgent: false, expired: false };
}

export function apiError(error: unknown, fallback: string) {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    fallback
  );
}

export function proposalStatusTone(status: Proposal['status']) {
  if (status === 'Accepted' || status === 'ConvertedToProject') return 'positive' as const;
  if (status === 'ChangesRequested') return 'warning' as const;
  if (status === 'Submitted' || status === 'Viewed' || status === 'Revised' || status === 'ClientReviewing') return 'info' as const;
  if (status === 'Declined' || status === 'Withdrawn' || status === 'Expired') return 'negative' as const;
  return 'neutral' as const;
}

export function localDateTime(days: number) {
  const date = new Date(Date.now() + days * 86_400_000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

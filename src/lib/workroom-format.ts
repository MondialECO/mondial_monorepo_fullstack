/**
 * Shared formatting for the workroom surface.
 *
 * Both helpers below existed as three-to-four near-identical copies that had drifted
 * apart. Keeping one implementation matters less for line count than for the drift
 * itself: the copies disagreed on whether to show a year, what to print for a missing
 * value, and whether to guard an unparseable date at all.
 */

export interface FormatDateOptions {
  /** Append the time. Off by default. */
  includeTime?: boolean;
  /** Printed for null, undefined, empty, or unparseable input. */
  emptyLabel?: string;
}

/**
 * Always includes the year. One of the previous copies did not, so a milestone due date
 * rendered as "Aug 2" directly beneath an engagement date reading "Aug 2, 2026" on the
 * same screen — and after the dispute banners landed, a dispute opened last year was
 * indistinguishable from one opened today.
 *
 * An unparseable date returns `emptyLabel` rather than the literal "Invalid Date", which
 * is what the buyer-side copies used to render.
 */
export function formatDate(value?: string | null, options: FormatDateOptions = {}): string {
  const { includeTime = false, emptyLabel = '—' } = options;
  if (!value) return emptyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(date);
}

/**
 * Backend errors carry a human-readable `message`; surface it verbatim rather than
 * mapping it, so a specific server reason is never collapsed into a generic one
 * (canon §10.6).
 */
export function workroomErrorMessage(
  error: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data
    ?.message;
  return message || fallback;
}

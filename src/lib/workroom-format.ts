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
 * ContractTerms used to be the one workroom payload whose enums reached the client as
 * integers: `ToContract` assigns `Terms = c.Terms` — the raw BSON class — while every
 * sibling field on that response goes through `.ToString()`.
 *
 * FIXED in 1903ff7: the four shared enums now carry a type-level JsonStringEnumConverter,
 * so the wire sends `"Hourly"`, `"BusinessDays"` and so on. `ContractResponse.Terms` still
 * embeds the raw model, so these helpers keep accepting both shapes — the numeric branch
 * is now legacy tolerance rather than the normal path, and costs nothing to keep.
 *
 * Index order mirrors the C# declaration order and must not be reordered:
 * PricingModel (ApplicationUser.cs), DeliveryTimeUnit / DeliveryDayType /
 * DeliveryStartRule (ServiceCatalog.cs). That ordering is load-bearing for the numeric
 * branch and, separately, for the BSON ordinals canon §4.2 protects.
 */
const PRICING_MODEL = [
  'Fixed price',
  'Hourly',
  'Monthly retainer',
  'Project based',
  'Equity compensation',
  'Revenue share',
  'Other',
] as const;
const DELIVERY_TIME_UNIT = ['Hours', 'Days', 'Weeks'] as const;
const DELIVERY_DAY_TYPE = ['Business days', 'Calendar days'] as const;
const DELIVERY_START_RULE = [
  'After order confirmation',
  'After escrow funding',
  'After client requirements complete',
  'After provider starts',
] as const;

/** "Business days" and "BusinessDays" both reduce to "businessdays". */
const squash = (value: string) => value.replace(/\s+/g, '').toLowerCase();

function enumLabel(labels: readonly string[], value: unknown, fallback: string): string {
  if (typeof value === 'number') return labels[value] ?? fallback;
  if (typeof value === 'string' && value.length > 0) {
    // Tolerates a numeric string as well as an enum name, in case the wire format shifts.
    const index = Number(value);
    if (Number.isInteger(index)) return labels[index] ?? fallback;

    // Resolve the enum NAME back to the same curated label the numeric branch returns.
    // Without this the two branches disagree on casing — "BusinessDays" would render
    // "Business Days" where the array says "Business days" — so 1903ff7 changing the wire
    // format would have silently restyled every contract label. Matching on the squashed
    // form needs no parallel name array: the labels already are the names with spaces, so
    // a new enum value picks this up automatically as long as its label follows suit.
    const known = labels.find((label) => squash(label) === squash(value));
    if (known) return known;

    // Unknown name — a value this build predates. Readable beats blank.
    return value.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
  return fallback;
}

export const pricingModelLabel = (value: unknown) =>
  enumLabel(PRICING_MODEL, value, 'Fixed price');
export const deliveryTimeUnitLabel = (value: unknown) =>
  enumLabel(DELIVERY_TIME_UNIT, value, 'Days');
export const deliveryDayTypeLabel = (value: unknown) =>
  enumLabel(DELIVERY_DAY_TYPE, value, 'Business days');
export const deliveryStartRuleLabel = (value: unknown) =>
  enumLabel(DELIVERY_START_RULE, value, 'After escrow funding');

/**
 * `pricingType === 'Hourly'` used to be false at runtime because the value arrived as the
 * integer 1, which left every hourly-only branch dead — including the one gating the Time
 * Entries tab (ProjectDetail.tsx) and the hourly-rate row in the SP ContractPanel. Since
 * 1903ff7 the wire sends `"Hourly"` and the string comparison is the live path; the
 * numeric check is kept as legacy tolerance, matching the label helpers.
 */
export const isHourlyPricing = (value: unknown) => value === 1 || value === 'Hourly';

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

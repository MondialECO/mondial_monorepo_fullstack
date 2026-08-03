import { describe, expect, it } from 'vitest';
import { money, words } from '@/components/serviceprovider/workroom/_shared';

/**
 * AnalyticsWorkspace used to carry its own copies of these two. They were not identical,
 * and neither was a superset of the other, so collapsing to the shared versions changed
 * behaviour in two specific ways. These pin both so the trade stays deliberate.
 */
describe('shared money()', () => {
  it('formats the platform default currency', () => {
    expect(money(1234.5, 'EUR')).toMatch(/1,234\.50/);
  });

  /**
   * The delta that made this more than cosmetic. The shared version pins
   * maximumFractionDigits: 2; the removed local copy let Intl use each currency's own
   * convention — 0 decimals for JPY, 3 for KWD. Analytics exposes a real currency
   * dropdown fed by AvailableCurrencies, so this is reachable, not theoretical.
   */
  it('pins two decimals even for currencies whose convention differs', () => {
    // JPY conventionally renders 0 decimals; the shared helper shows 2.
    expect(money(1234.5, 'JPY')).toMatch(/1,234\.5/);
    // KWD conventionally renders 3; the shared helper caps at 2.
    expect(money(1.2345, 'KWD')).not.toMatch(/1\.234\d/);
  });

  it('falls back to a readable string for an unknown currency code', () => {
    expect(money(10, 'NOT_A_CURRENCY')).toBe('NOT_A_CURRENCY 10.00');
  });
});

describe('shared words()', () => {
  it('splits the PascalCase enum names Analytics actually passes', () => {
    expect(words('UnderReview')).toBe('Under Review');
    expect(words('InProgress')).toBe('In Progress');
    expect(words('Unpublished')).toBe('Unpublished');
  });

  /**
   * Guards null, which the removed local copy did not — it would have thrown on a
   * missing status.
   */
  it('tolerates null and non-string input', () => {
    expect(words(null)).toBe('');
    expect(words(undefined)).toBe('');
    expect(words(2)).toBe('2');
  });

  /**
   * The other half of the trade: underscores are no longer stripped. Nothing in
   * AnalyticsWorkspace emits a snake_case status today, but this documents what would
   * happen if one ever did, so the behaviour is visible rather than surprising.
   */
  it('leaves underscores intact — the local copy used to strip them', () => {
    expect(words('under_review')).toBe('under_review');
  });
});

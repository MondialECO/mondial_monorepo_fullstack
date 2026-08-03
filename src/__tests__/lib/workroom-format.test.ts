import { describe, expect, it } from 'vitest';
import {
  deliveryDayTypeLabel,
  deliveryStartRuleLabel,
  deliveryTimeUnitLabel,
  isHourlyPricing,
  pricingModelLabel,
} from '@/lib/workroom-format';

/**
 * ContractResponse.Terms embeds the raw ContractTerms model, so these values arrived as
 * integers until 1903ff7 added a type-level JsonStringEnumConverter. The helpers accept
 * both shapes, and the point of these tests is that both shapes produce the SAME label —
 * otherwise fixing the wire format silently restyles every contract term.
 */
describe('workroom enum labels', () => {
  const cases: [string, (v: unknown) => string, number, string, string][] = [
    ['pricing model', pricingModelLabel, 0, 'FixedPrice', 'Fixed price'],
    ['pricing model', pricingModelLabel, 1, 'Hourly', 'Hourly'],
    ['pricing model', pricingModelLabel, 2, 'MonthlyRetainer', 'Monthly retainer'],
    ['pricing model', pricingModelLabel, 6, 'Other', 'Other'],
    ['delivery time unit', deliveryTimeUnitLabel, 0, 'Hours', 'Hours'],
    ['delivery time unit', deliveryTimeUnitLabel, 2, 'Weeks', 'Weeks'],
    ['delivery day type', deliveryDayTypeLabel, 0, 'BusinessDays', 'Business days'],
    ['delivery day type', deliveryDayTypeLabel, 1, 'CalendarDays', 'Calendar days'],
    [
      'delivery start rule',
      deliveryStartRuleLabel,
      1,
      'AfterEscrowFunding',
      'After escrow funding',
    ],
    [
      'delivery start rule',
      deliveryStartRuleLabel,
      2,
      'AfterClientRequirementsComplete',
      'After client requirements complete',
    ],
  ];

  it.each(cases)(
    '%s: ordinal %i and name "%s" both render "%s"',
    (_group, label, ordinal, name, expected) => {
      expect(label(ordinal)).toBe(expected);
      expect(label(name)).toBe(expected);
    }
  );

  it('renders the same label whichever wire format arrives', () => {
    for (const [, label, ordinal, name] of cases) {
      expect(label(name)).toBe(label(ordinal));
    }
  });

  it('keeps tolerating a numeric string', () => {
    expect(deliveryDayTypeLabel('1')).toBe('Calendar days');
  });

  it('degrades readably for an enum value this build predates', () => {
    expect(deliveryStartRuleLabel('AfterSomeFutureThing')).toBe('After Some Future Thing');
  });

  it('falls back for empty and unusable input', () => {
    expect(pricingModelLabel(null)).toBe('Fixed price');
    expect(pricingModelLabel('')).toBe('Fixed price');
    expect(deliveryTimeUnitLabel(undefined)).toBe('Days');
  });
});

/**
 * Gates the Time Entries tab (ProjectDetail.tsx) and the hourly-rate row in the SP
 * ContractPanel. The string branch was dead until 1903ff7; both must work.
 */
describe('isHourlyPricing', () => {
  it('matches the enum name now sent on the wire', () => {
    expect(isHourlyPricing('Hourly')).toBe(true);
  });

  it('still matches the legacy ordinal', () => {
    expect(isHourlyPricing(1)).toBe(true);
  });

  it('is false for every other pricing model', () => {
    for (const value of ['FixedPrice', 'MonthlyRetainer', 'Other', 0, 2, 6, null, undefined])
      expect(isHourlyPricing(value)).toBe(false);
  });
});

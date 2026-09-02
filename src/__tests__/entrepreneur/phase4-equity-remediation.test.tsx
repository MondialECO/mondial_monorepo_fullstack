import { describe, it, expect } from 'vitest';
import { deriveCapTable, isEquityShareClass } from '@/components/entrepreneur/equity/phase4-utils';
import { CapTableSnapshotResponse } from '@/lib/api-entrepreneur';

describe('Phase 4 — Equity & Cap Table Domain Remediation', () => {
  it('isEquityShareClass correctly identifies equity vs non-equity instruments', () => {
    expect(isEquityShareClass('common')).toBe(true);
    expect(isEquityShareClass('Common')).toBe(true);
    expect(isEquityShareClass('preferred')).toBe(true);
    expect(isEquityShareClass('Preferred')).toBe(true);
    expect(isEquityShareClass('safe')).toBe(false);
    expect(isEquityShareClass('note')).toBe(false);
    expect(isEquityShareClass('convertible_note')).toBe(false);
    expect(isEquityShareClass('')).toBe(false);
    expect(isEquityShareClass(undefined)).toBe(false);
  });

  it('Phase4_EquityCommon_CountsTowardOwnership and Phase4_EquityPreferred_CountsTowardOwnership', () => {
    const snapshot: CapTableSnapshotResponse = {
      companyId: 'comp-1',
      version: 1,
      totalShares: 1_000_000,
      esopPoolPercent: 10,
      esopVestingMonths: 48,
      exitWaterfallReviewed: true,
      recordedAt: new Date().toISOString(),
      grants: [
        {
          stakeholderName: 'Founder Alice',
          stakeholderType: 'founder',
          shareClass: 'common',
          sharesGranted: 800_000,
        },
        {
          stakeholderName: 'Investor Bob',
          stakeholderType: 'investor',
          shareClass: 'preferred',
          sharesGranted: 200_000,
        },
      ],
    };

    const derived = deriveCapTable(snapshot);
    expect(derived.totalIssued).toBe(1_000_000);
    expect(derived.founderPct).toBe(80);
    expect(derived.investorPct).toBe(20);
    expect(derived.founderCount).toBe(1);
    expect(derived.investorCount).toBe(1);
    expect(derived.holders[0].ownershipPct).toBe(80);
    expect(derived.holders[1].ownershipPct).toBe(20);
  });

  it('Phase4_SAFE_DoesNotCountTowardIssuedOwnership and Phase4_SAFE_DoesNotCreateShareholderOwnership', () => {
    const snapshotWithSafe: CapTableSnapshotResponse = {
      companyId: 'comp-1',
      version: 1,
      totalShares: 1_000_000,
      esopPoolPercent: 0,
      esopVestingMonths: 0,
      exitWaterfallReviewed: false,
      recordedAt: new Date().toISOString(),
      grants: [
        {
          stakeholderName: 'Founder Alice',
          stakeholderType: 'founder',
          shareClass: 'common',
          sharesGranted: 1_000_000,
        },
        {
          stakeholderName: 'SAFE Investor Charlie',
          stakeholderType: 'investor',
          shareClass: 'safe',
          sharesGranted: 100_000, // Non-equity instrument
        },
      ],
    };

    const derived = deriveCapTable(snapshotWithSafe);
    // SAFE must NOT contribute to totalIssued equity shares
    expect(derived.totalIssued).toBe(1_000_000);
    // Founder retains 100% of issued equity
    expect(derived.founderPct).toBe(100);
    expect(derived.investorPct).toBe(0);
    expect(derived.investorCount).toBe(0);
    // SAFE holder gets 0% equity ownership before conversion
    const safeHolder = derived.holders.find((h) => h.name === 'SAFE Investor Charlie');
    expect(safeHolder).toBeDefined();
    expect(safeHolder?.ownershipPct).toBe(0);
  });

  it('Phase4_Note_DoesNotCountTowardIssuedOwnership and Phase4_Note_DoesNotCreateShareholderOwnership', () => {
    const snapshotWithNote: CapTableSnapshotResponse = {
      companyId: 'comp-1',
      version: 1,
      totalShares: 1_000_000,
      esopPoolPercent: 0,
      esopVestingMonths: 0,
      exitWaterfallReviewed: false,
      recordedAt: new Date().toISOString(),
      grants: [
        {
          stakeholderName: 'Founder Alice',
          stakeholderType: 'founder',
          shareClass: 'common',
          sharesGranted: 1_000_000,
        },
        {
          stakeholderName: 'Convertible Note Dave',
          stakeholderType: 'investor',
          shareClass: 'note',
          sharesGranted: 50_000, // Non-equity instrument
        },
      ],
    };

    const derived = deriveCapTable(snapshotWithNote);
    expect(derived.totalIssued).toBe(1_000_000);
    expect(derived.founderPct).toBe(100);
    expect(derived.investorPct).toBe(0);
    const noteHolder = derived.holders.find((h) => h.name === 'Convertible Note Dave');
    expect(noteHolder).toBeDefined();
    expect(noteHolder?.ownershipPct).toBe(0);
  });

  it('Phase4_11MAllocationsAgainst10MTotalShares_Displays110PercentWithoutMasking', () => {
    const snapshotWithOverflow: CapTableSnapshotResponse = {
      companyId: 'comp-overflow',
      version: 1,
      totalShares: 10_000_000,
      esopPoolPercent: 5,
      esopVestingMonths: 48,
      exitWaterfallReviewed: false,
      recordedAt: new Date().toISOString(),
      grants: [
        { stakeholderName: 'Creator', stakeholderType: 'founder', shareClass: 'common', sharesGranted: 3_000_000 },
        { stakeholderName: 'Co founder', stakeholderType: 'founder', shareClass: 'common', sharesGranted: 6_000_000 },
        { stakeholderName: 'Employee Option Pool (ESOP)', stakeholderType: 'esop', shareClass: 'common', sharesGranted: 500_000 },
        { stakeholderName: 'Future Investor Reserve', stakeholderType: 'investor', shareClass: 'preferred', sharesGranted: 500_000 },
        { stakeholderName: 'ESOP Pool', stakeholderType: 'esop', shareClass: 'common', sharesGranted: 500_000 },
        { stakeholderName: 'Investor Reserve', stakeholderType: 'investor', shareClass: 'preferred', sharesGranted: 500_000 },
      ],
    };

    const derived = deriveCapTable(snapshotWithOverflow);
    expect(derived.totalIssued).toBe(11_000_000);
    expect(derived.totalShares).toBe(10_000_000);

    const totalPct = derived.founderPct + derived.esopPct + derived.investorPct;
    expect(totalPct).toBe(110);
    expect(derived.founderPct).toBe(90);
    expect(derived.esopPct).toBe(10);
    expect(derived.investorPct).toBe(10);
  });

  it('Phase4_CoFounderFormation_10MAllocationsAgainst10M_ReconcilesToExact100Percent', () => {
    const snapshotReconciled: CapTableSnapshotResponse = {
      companyId: 'comp-reconciled',
      version: 2,
      totalShares: 10_000_000,
      esopPoolPercent: 5,
      esopVestingMonths: 48,
      exitWaterfallReviewed: true,
      recordedAt: new Date().toISOString(),
      grants: [
        { stakeholderName: 'Creator', stakeholderType: 'founder', shareClass: 'common', sharesGranted: 3_000_000 },
        { stakeholderName: 'Co founder', stakeholderType: 'founder', shareClass: 'common', sharesGranted: 6_000_000 },
        { stakeholderName: 'Employee Option Pool (ESOP)', stakeholderType: 'esop', shareClass: 'common', sharesGranted: 500_000 },
        { stakeholderName: 'Future Investor Reserve', stakeholderType: 'investor', shareClass: 'preferred', sharesGranted: 500_000 },
      ],
    };

    const derived = deriveCapTable(snapshotReconciled);
    expect(derived.totalIssued).toBe(10_000_000);
    expect(derived.totalShares).toBe(10_000_000);

    expect(derived.founderPct).toBe(90); // 30% creator + 60% co-founder
    expect(derived.esopPct).toBe(5);
    expect(derived.investorPct).toBe(5);

    const totalPct = derived.founderPct + derived.esopPct + derived.investorPct;
    expect(totalPct).toBe(100);
  });
});

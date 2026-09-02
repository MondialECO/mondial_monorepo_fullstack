import { CapTableSnapshotResponse, EquityGrantDto } from '@/lib/api-entrepreneur';

export type StakeType = 'founder' | 'investor' | 'advisor' | 'esop';

export interface DerivedHolder {
  name: string;
  type: StakeType;
  shareClass: string;
  shares: number;
  investment?: number;
  ownershipPct: number;
}

export interface CapTableDerived {
  totalShares: number;
  totalIssued: number;
  holders: DerivedHolder[];
  founderPct: number;
  investorPct: number;
  advisorPct: number;
  esopPct: number;
  founderCount: number;
  investorCount: number;
}

export const isEquityShareClass = (sc?: string): boolean => {
  const c = (sc ?? '').trim().toLowerCase();
  return c === 'common' || c === 'preferred';
};

export function deriveCapTable(snapshot: CapTableSnapshotResponse | null): CapTableDerived {
  const grants: EquityGrantDto[] = snapshot?.grants ?? [];
  const totalShares = snapshot?.totalShares ?? 0;
  
  // Non-equity instruments (e.g. SAFE, Note) do not count toward issued equity
  const equityGrants = grants.filter((g) => isEquityShareClass(g.shareClass));
  const totalIssued = equityGrants.reduce((s, g) => s + (g.sharesGranted ?? 0), 0);
  const denom = totalShares > 0 ? totalShares : (totalIssued > 0 ? totalIssued : 1);

  const holders: DerivedHolder[] = grants.map((g) => {
    const isEq = isEquityShareClass(g.shareClass);
    return {
      name: g.stakeholderName,
      type: g.stakeholderType,
      shareClass: g.shareClass,
      shares: g.sharesGranted,
      investment: g.investmentAmount,
      ownershipPct: isEq ? (g.sharesGranted / denom) * 100 : 0,
    };
  });

  const sumBy = (t: StakeType) =>
    holders.filter((h) => h.type === t && isEquityShareClass(h.shareClass)).reduce((s, h) => s + h.ownershipPct, 0);

  return {
    totalShares,
    totalIssued,
    holders,
    founderPct: sumBy('founder'),
    investorPct: sumBy('investor'),
    advisorPct: sumBy('advisor'),
    esopPct: sumBy('esop'),
    founderCount: holders.filter((h) => h.type === 'founder' && isEquityShareClass(h.shareClass)).length,
    investorCount: holders.filter((h) => h.type === 'investor' && isEquityShareClass(h.shareClass)).length,
  };
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const TYPE_LABEL: Record<StakeType, string> = {
  founder: 'Founder',
  investor: 'Investor',
  advisor: 'Advisor',
  esop: 'ESOP',
};

// Chart token per stakeholder type (theme tokens from globals.css).
export const TYPE_CHART_VAR: Record<StakeType, string> = {
  founder: 'var(--chart-1)',
  investor: 'var(--chart-2)',
  advisor: 'var(--chart-3)',
  esop: 'var(--chart-4)',
};

export function fmtNum(n: number): string {
  return Math.round(n).toLocaleString();
}

export function fmtPct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return '—';
  return `${n.toFixed(digits)}%`;
}

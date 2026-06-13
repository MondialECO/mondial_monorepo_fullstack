import { StepNumber } from '@/types/entrepreneur';

/**
 * Phase 3 step config (Figma "Financial Verification & Tracking").
 * Flow: Revenue Input → Automated Valuation → Live KPI Tracking.
 * Equity/cap-table is intentionally NOT here — it belongs to Phase 4.
 * Step numbers stay 1/2/3 so RouteGuard / progress tracking is unchanged.
 */
export const PHASE_3_STEPS: { step: StepNumber; title: string; subtitle: string }[] = [
  { step: 1, title: 'Revenue Input', subtitle: 'Quarterly revenue & cash' },
  { step: 2, title: 'Automated Valuation', subtitle: 'AI estimated valuation' },
  { step: 3, title: 'Live KPI Tracking', subtitle: 'Growth metrics dashboard' },
];

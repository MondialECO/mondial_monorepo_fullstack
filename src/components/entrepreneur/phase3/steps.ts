import { StepNumber } from '@/types/entrepreneur';

/**
 * Phase 3 step config (Figma "Financial Verification & Tracking").
 * Flow: Revenue Input → Automated Valuation → Live KPI Tracking → Concept Overview.
 * Phase 3 completes at Step 4 (Concept Overview). Equity/cap-table belongs to Phase 4.
 */
export const PHASE_3_STEPS: { step: StepNumber; title: string; subtitle: string }[] = [
  { step: 1, title: 'Revenue input', subtitle: 'Enter revenue and expenses for the last four quarters (Q1–Q4).' },
  { step: 2, title: 'Automated valuation', subtitle: "System generates an AI-driven 'Estimated Valuation' based on your sector benchmarks." },
  { step: 3, title: 'Live KPI tracking', subtitle: 'Connect Stripe or ChartMogul to track growth metrics in real time on the dashboard.' },
  { step: 4, title: 'Concept Overview', subtitle: 'Explain your core concept.' },
];

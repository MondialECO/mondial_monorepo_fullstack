// Canonical option sets for the Investment Thesis wizard. Values are the exact
// backend tokens written to the Investor model; labels are display-only.

export interface Opt {
  value: string;
  label: string;
}

export const STAGE_OPTIONS: Opt[] = [
  { value: "pre_seed", label: "Pre-Seed" },
  { value: "seed", label: "Seed" },
  { value: "series_a", label: "Series A" },
  { value: "series_b", label: "Series B" },
  { value: "series_c", label: "Series C" },
];

export const GEOGRAPHY_OPTIONS: Opt[] = [
  { value: "EU", label: "Europe" },
  { value: "UK", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "APAC", label: "APAC" },
  { value: "MENA", label: "MENA" },
  { value: "LATAM", label: "LATAM" },
  { value: "Global", label: "Global" },
];

export const SECTOR_OPTIONS: Opt[] = [
  { value: "SaaS", label: "SaaS" },
  { value: "FinTech", label: "FinTech" },
  { value: "HealthTech", label: "HealthTech" },
  { value: "ClimaTech", label: "ClimaTech" },
  { value: "AI/ML", label: "AI / ML" },
  { value: "Marketplace", label: "Marketplace" },
  { value: "DeepTech", label: "DeepTech" },
  { value: "Consumer", label: "Consumer" },
  { value: "Enterprise", label: "Enterprise" },
];

export const EQUITY_TYPE_OPTIONS: Opt[] = [
  { value: "preferred", label: "Preferred Equity" },
  { value: "safe", label: "SAFE" },
  { value: "note", label: "Convertible Note" },
];

export const RETURN_MULTIPLE_OPTIONS: Opt[] = [
  { value: "2-3x", label: "2–3x" },
  { value: "3-5x", label: "3–5x" },
  { value: "5-10x", label: "5–10x" },
  { value: "10x+", label: "10x or more" },
];

export const FOLLOW_ON_OPTIONS: Opt[] = [
  { value: "always_pro_rata", label: "Always exercise pro-rata" },
  { value: "selective", label: "Selective follow-on" },
  { value: "none", label: "No follow-on" },
];

export const PREFERRED_ROLE_OPTIONS: Opt[] = [
  { value: "lead", label: "Lead investor" },
  { value: "co_investor", label: "Co-investor" },
  { value: "follower", label: "Follower" },
];

export const BOARD_PARTICIPATION_OPTIONS: Opt[] = [
  { value: "board_seat", label: "Board seat" },
  { value: "observer", label: "Board observer" },
  { value: "none", label: "No board involvement" },
];

/** Display label for a stored value, falling back to the raw value. */
export function labelFor(opts: Opt[], value: string | null | undefined): string {
  if (!value) return "—";
  return opts.find((o) => o.value === value)?.label ?? value;
}

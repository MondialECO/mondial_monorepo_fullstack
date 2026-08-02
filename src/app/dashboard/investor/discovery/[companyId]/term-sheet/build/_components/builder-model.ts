// Phase 8 — Term Sheet Builder model.
//
// This is a UI shell over the EXISTING investor offer-create flow. It does NOT
// introduce a new deal API: the draft serializes to `OfferTermsInput` and is
// sent via `useCreateInvestorOffer` (POST /investor/term-sheet/{companyId}/create),
// exactly like OfferComposerDialog. Economics + core rights map to typed fields;
// the design's additional governance terms (vesting, ROFR, co-sale, governing
// law, jurisdiction, closing date) are carried in the persisted `note` so they
// reach the founder during negotiation rather than being dropped or faked.

import type { OfferTermsInput } from "@/types/deals";
import type { OpportunityDetail } from "@/types/investor/opportunities";
import type { Opt } from "@/app/dashboard/investor/thesis/_components/options";

export const SHARE_CLASS_OPTIONS: Opt[] = [
  { value: "preferred", label: "Preferred" },
  { value: "safe", label: "SAFE" },
  { value: "note", label: "Convertible Note" },
  { value: "common", label: "Common" },
];

// Richer metadata for the share-class card selector (Step 1, SVG parity).
export interface ShareClassCard {
  value: string;
  label: string;
  hint: string;
}
export const SHARE_CLASS_CARDS: ShareClassCard[] = [
  { value: "preferred", label: "Preferred", hint: "Priced equity with liquidation preference and protective provisions." },
  { value: "safe", label: "SAFE", hint: "Converts to equity at the next priced round." },
  { value: "note", label: "Convertible Note", hint: "Debt that converts to equity, typically with a cap or discount." },
  { value: "common", label: "Common", hint: "Ordinary shares, no preference." },
];

export const LIQ_PREF_OPTIONS: Opt[] = [
  { value: "1x_non_participating", label: "1× non-participating" },
  { value: "1x_participating", label: "1× participating" },
  { value: "2x", label: "2× participating" },
  { value: "3x", label: "3× participating" },
];

export const ANTI_DILUTION_OPTIONS: Opt[] = [
  { value: "none", label: "None" },
  { value: "broad_based", label: "Broad-based weighted average" },
  { value: "narrow_based", label: "Narrow-based weighted average" },
];

export const VESTING_OPTIONS: Opt[] = [
  { value: "none", label: "No founder vesting" },
  { value: "4y_1y", label: "4-year vest, 1-year cliff" },
  { value: "3y_1y", label: "3-year vest, 1-year cliff" },
];

export const GOVERNING_LAW_OPTIONS: Opt[] = [
  { value: "england_wales", label: "England & Wales" },
  { value: "delaware", label: "Delaware, USA" },
  { value: "france", label: "France" },
  { value: "germany", label: "Germany" },
  { value: "netherlands", label: "Netherlands" },
  { value: "ireland", label: "Ireland" },
];

export const DUE_DILIGENCE_OPTIONS: Opt[] = [
  { value: "none", label: "Not specified" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "45", label: "45 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
];

export function labelFor(opts: Opt[], value: string | null | undefined): string {
  if (!value) return "—";
  return opts.find((o) => o.value === value)?.label ?? value;
}

export interface TermSheetDraft {
  // Step 1 — Core Economics
  investmentAmount: string;
  preMoney: string;
  shareClass: string;
  // Step 2 — Rights & Governance (persisted as typed OfferTermsInput fields)
  boardSeats: string;
  proRata: boolean;
  antiDilution: string;
  liquidationPreference: string;
  // Step 2 — additional governance (carried in the offer note)
  vesting: string;
  rofr: boolean;
  coSale: boolean;
  governingLaw: string;
  jurisdiction: string;
  dueDiligenceDays: string; // "none" or a day count
  closingDate: string;
  // Free-text message to the founder
  note: string;
}

export function num(s: string): number {
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

/** Post-money = pre-money + new investment (definitional). */
export function derivedPostMoney(d: TermSheetDraft): number {
  const pre = num(d.preMoney);
  const amount = num(d.investmentAmount);
  if (pre <= 0 && amount <= 0) return 0;
  return pre + amount;
}

/** Investor equity = new investment / post-money (definitional, %). */
export function derivedEquityPercent(d: TermSheetDraft): number {
  const post = derivedPostMoney(d);
  const amount = num(d.investmentAmount);
  if (post <= 0) return 0;
  return (amount / post) * 100;
}

/** Seed the builder from the founder's real published ask. */
export function draftFromOpportunity(detail: OpportunityDetail): TermSheetDraft {
  return {
    investmentAmount: detail.fundingAskAmount ? String(detail.fundingAskAmount) : "",
    preMoney: detail.preMoneyValuation ? String(detail.preMoneyValuation) : "",
    shareClass: "preferred",
    boardSeats: "0",
    proRata: false,
    antiDilution: "none",
    liquidationPreference: "1x_non_participating",
    vesting: "none",
    rofr: false,
    coSale: false,
    governingLaw: "",
    jurisdiction: "",
    dueDiligenceDays: "none",
    closingDate: "",
    note: "",
  };
}

/** Compose the additional, non-typed terms into the persisted offer note. */
export function composeNote(d: TermSheetDraft): string | undefined {
  const lines: string[] = [];
  if (d.vesting && d.vesting !== "none")
    lines.push(`Founder vesting: ${labelFor(VESTING_OPTIONS, d.vesting)}`);
  if (d.rofr) lines.push("Right of first refusal (ROFR): yes");
  if (d.coSale) lines.push("Co-sale / tag-along: yes");
  if (d.governingLaw)
    lines.push(`Governing law: ${labelFor(GOVERNING_LAW_OPTIONS, d.governingLaw)}`);
  if (d.jurisdiction.trim()) lines.push(`Jurisdiction: ${d.jurisdiction.trim()}`);
  if (d.dueDiligenceDays && d.dueDiligenceDays !== "none")
    lines.push(`Due-diligence period: ${d.dueDiligenceDays} days`);
  if (d.closingDate) lines.push(`Target closing date: ${d.closingDate}`);

  const additional = lines.length
    ? `Proposed additional terms:\n${lines.map((l) => `• ${l}`).join("\n")}`
    : "";
  const free = d.note.trim();
  const composed = [free, additional].filter(Boolean).join("\n\n");
  // The offer-create contract requires a non-empty note. The "Message to
  // founder" is optional in the UI, so fall back to a factual opening line when
  // the investor adds neither a message nor any additional terms — otherwise the
  // send is rejected with "The Note field is required."
  return composed || "Opening term-sheet offer.";
}

/** Serialize to the EXISTING create contract. No new API surface. */
export function draftToOfferTerms(d: TermSheetDraft): OfferTermsInput {
  return {
    totalRaiseAmount: num(d.investmentAmount),
    preMoneyValuation: num(d.preMoney),
    postMoneyValuation: derivedPostMoney(d),
    investorEquityPercent: Math.round(derivedEquityPercent(d) * 100) / 100,
    equityType: d.shareClass,
    proRataRights: d.proRata,
    liquidationPreference: d.liquidationPreference,
    boardSeats: num(d.boardSeats),
    antiDilutionProtection: d.antiDilution,
    note: composeNote(d),
  };
}

/** Step-1 economics are valid when amount and pre-money are positive. */
export function coreEconomicsValid(d: TermSheetDraft): boolean {
  return num(d.investmentAmount) > 0 && num(d.preMoney) > 0;
}

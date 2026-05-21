/**
 * Phase 1 universal onboarding — hub-and-spoke model (per Figma file
 * 5oHxoppTAyS4zb2DfUdYwy node 21667:9006). Every signed-up user lands on
 * /onboarding and walks through whichever items the backend marks as
 * required for their role.
 *
 * Required-vs-optional is computed by the backend at /api/onboarding/status
 * because the rule is role-conditional (Investor adds Income+Tax;
 * ServiceProvider adds License). The frontend just renders what status
 * gives it.
 */

import { LucideIcon, IdCard, Smile, Smartphone, Mail, Home, Wallet, Receipt, Car } from "lucide-react";

export type OnboardingItemKey =
  | "identity"
  | "face"
  | "phone"
  | "email"
  | "residence"
  | "income"
  | "tax"
  | "license";

export type OnboardingItem = {
  key: OnboardingItemKey;
  /** Route under /onboarding for this item's sub-page. */
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Treated as "Mandatory Steps" vs "Additional Document" group on the hub. */
  group: "core" | "supplementary";
};

/**
 * Catalogue of all eight items, in the order they appear on the hub.
 * `required` is *not* in this catalogue — it comes from /status because it
 * depends on the user's role.
 */
export const ONBOARDING_ITEMS: OnboardingItem[] = [
  {
    key: "identity",
    href: "/onboarding/identity",
    title: "Identity Document",
    description: "Upload Passport or Government ID",
    icon: IdCard,
    group: "core",
  },
  {
    key: "face",
    // Per product: identity and face share a single SUMSUB session. Clicking
    // either card lands on /onboarding/identity; completing it flips both.
    href: "/onboarding/identity",
    title: "Facial verification",
    description: "Quick face scan for bio-matching",
    icon: Smile,
    group: "core",
  },
  {
    key: "phone",
    href: "/onboarding/phone",
    title: "Phone Verification",
    description: "Verify your mobile number via SMS",
    icon: Smartphone,
    group: "core",
  },
  {
    key: "email",
    href: "/onboarding/email",
    title: "Email Verification",
    description: "Confirm your secure primary email",
    icon: Mail,
    group: "core",
  },
  {
    key: "residence",
    href: "/onboarding/documents/residence",
    title: "Proof of Residence",
    description: "Utility bill or bank statement",
    icon: Home,
    group: "supplementary",
  },
  {
    key: "income",
    href: "/onboarding/documents/income",
    title: "Proof of Income",
    description: "Pay slips or tax returns",
    icon: Wallet,
    group: "supplementary",
  },
  {
    key: "tax",
    href: "/onboarding/documents/tax",
    title: "Tax Documents",
    description: "Tax residency or filings",
    icon: Receipt,
    group: "supplementary",
  },
  {
    key: "license",
    href: "/onboarding/documents/license",
    title: "Driver's licence",
    description: "Supplementary ID document",
    icon: Car,
    group: "supplementary",
  },
];

/** Shape returned by GET /api/onboarding/status (the data field of the envelope). */
export type OnboardingItemStatus = {
  key: OnboardingItemKey;
  verified: boolean;
  required: boolean;
};

export type OnboardingStatus = {
  phase: number;
  role?: string;
  phone?: string;
  email?: string;
  items: Record<OnboardingItemKey, OnboardingItemStatus>;
};

export function isOnboardingComplete(status: OnboardingStatus | null | undefined): boolean {
  return !!status && status.phase >= 1;
}

/** First required item the user still has to finish. */
export function firstIncompleteRequired(status: OnboardingStatus): OnboardingItem | null {
  for (const item of ONBOARDING_ITEMS) {
    const s = status.items[item.key];
    if (s?.required && !s.verified) return item;
  }
  return null;
}

export function onboardingHubPath(): string {
  return "/onboarding";
}

"use client";

import { BadgeCheck, ShieldCheck } from "lucide-react";
import { AccountMenu, type AccountMenuItem } from "@/components/layout/AccountMenu";

/**
 * SP's configuration of the shared AccountMenu. The behaviour, markup and accessible names
 * are the shared component's; this file is now only the SP-specific label, initials
 * fallback and destinations, kept as a named export so SpDesktopTopbar and SpMobileHeader
 * do not each repeat them.
 */
const SP_ITEMS: AccountMenuItem[] = [
  { href: "/dashboard/profile", icon: BadgeCheck, label: "Profile & Trust" },
  { href: "/dashboard/serviceprovider/phase-1", icon: ShieldCheck, label: "Identity & Account Verification" },
];

export function SpAccountMenu() {
  return <AccountMenu roleLabel="Service Provider" initialsFallback="SP" items={SP_ITEMS} />;
}

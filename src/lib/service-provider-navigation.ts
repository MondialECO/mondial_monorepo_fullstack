export const SERVICE_PROVIDER_ROOT = "/dashboard/serviceprovider";

export const SERVICE_PROVIDER_TERMINOLOGY = {
  dashboard: "Dashboard",
  profile: "Profile & Trust",
  services: "Service Catalog",
  leads: "Client Briefs",
  pipeline: "Pipeline",
  savedLeads: "Saved Client Briefs",
  activeProjects: "Active Projects",
  completedProjects: "Completed Projects",
  analytics: "Analytics & Growth",
  earnings: "Earnings & Payouts",
  earningsOverview: "Earnings Overview",
  payouts: "Payouts",
  financialSettings: "Financial Settings",
  identityVerification: "Identity & Account Verification",
} as const;

type SearchParamReader = { get(name: string): string | null };

export function isServiceProviderRoute(pathname: string) {
  return pathname === SERVICE_PROVIDER_ROOT || pathname.startsWith(`${SERVICE_PROVIDER_ROOT}/`);
}

export function getServiceProviderPageTitle(pathname: string, searchParams?: SearchParamReader) {
  if (pathname === SERVICE_PROVIDER_ROOT) return SERVICE_PROVIDER_TERMINOLOGY.dashboard;
  if (pathname === `${SERVICE_PROVIDER_ROOT}/profile`) return SERVICE_PROVIDER_TERMINOLOGY.profile;
  if (pathname === `${SERVICE_PROVIDER_ROOT}/services`) return SERVICE_PROVIDER_TERMINOLOGY.services;
  if (pathname === `${SERVICE_PROVIDER_ROOT}/analytics`) return SERVICE_PROVIDER_TERMINOLOGY.analytics;
  if (pathname === `${SERVICE_PROVIDER_ROOT}/phase-1`) return SERVICE_PROVIDER_TERMINOLOGY.identityVerification;

  if (pathname === `${SERVICE_PROVIDER_ROOT}/leads`) {
    const view = searchParams?.get("view");
    if (view === "proposals") return SERVICE_PROVIDER_TERMINOLOGY.pipeline;
    if (view === "saved") return SERVICE_PROVIDER_TERMINOLOGY.savedLeads;
    return SERVICE_PROVIDER_TERMINOLOGY.leads;
  }

  if (pathname === `${SERVICE_PROVIDER_ROOT}/workroom`) {
    return searchParams?.get("view") === "completed"
      ? SERVICE_PROVIDER_TERMINOLOGY.completedProjects
      : SERVICE_PROVIDER_TERMINOLOGY.activeProjects;
  }

  if (pathname === `${SERVICE_PROVIDER_ROOT}/earnings`) {
    const tab = searchParams?.get("tab");
    if (tab === "payouts") return SERVICE_PROVIDER_TERMINOLOGY.payouts;
    if (tab === "settings") return SERVICE_PROVIDER_TERMINOLOGY.financialSettings;
    if (tab === "invoices") return "Invoices";
    return SERVICE_PROVIDER_TERMINOLOGY.earningsOverview;
  }

  return "Service Provider";
}

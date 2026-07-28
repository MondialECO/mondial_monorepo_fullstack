"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  getServiceProviderPageTitle,
  isServiceProviderRoute,
  SERVICE_PROVIDER_ROOT,
  SERVICE_PROVIDER_TERMINOLOGY,
} from "@/lib/service-provider-navigation";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export function useBreadcrumb(): BreadcrumbItem[] {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!pathname) return [];

  if (isServiceProviderRoute(pathname)) {
    const dashboard = {
      label: SERVICE_PROVIDER_TERMINOLOGY.dashboard,
      href: SERVICE_PROVIDER_ROOT,
    };
    if (pathname === SERVICE_PROVIDER_ROOT) return [dashboard];
    const query = searchParams.toString();
    return [
      dashboard,
      {
        label: getServiceProviderPageTitle(pathname, searchParams),
        href: query ? `${pathname}?${query}` : pathname,
      },
    ];
  }

  const segments = pathname.split("/").filter(Boolean);

  return segments.reduce((acc: BreadcrumbItem[], segment, index) => {
    const path = segments.slice(0, index + 1).join("/");
    acc.push({
      label: formatLabel(segment),
      href: `/${path}`,
    });
    return acc;
  }, []);
}

function formatLabel(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

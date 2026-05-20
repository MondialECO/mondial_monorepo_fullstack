"use client";

import { usePathname } from "next/navigation";

export type BreadcrumbItem = {
  label: string;
  href: string;
};

export function useBreadcrumb(): BreadcrumbItem[] {
  const pathname = usePathname();

  if (!pathname) return [];

  const segments = pathname.split("/").filter(Boolean);

  return segments.map((segment, index) => {
    const path = segments.slice(0, index + 1).join("/");

    return {
      label: formatLabel(segment),
      href: `/${path}`,
    };
  });
}

function formatLabel(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

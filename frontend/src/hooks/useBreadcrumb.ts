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

  let path = "";

  return segments.map((segment) => {
    path += `/${segment}`;

    return {
      label: formatLabel(segment),
      href: path,
    };
  });
}

function formatLabel(segment: string) {
  return segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

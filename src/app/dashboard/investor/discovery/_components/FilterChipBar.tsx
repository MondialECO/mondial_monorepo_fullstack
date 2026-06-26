"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

// Filter taxonomy is intentionally hard-coded for MVP. The backend feed
// endpoint accepts free-text `sector` / `stage` / `geography` query params
// and case-insensitively matches the Companies.{Industry,FundingRoundType,Country}
// fields. Values below mirror the seeded company set.
type FilterGroup = {
  key: "sector" | "stage" | "geography";
  label: string;
  options: { value: string; label: string }[];
};

const FILTER_GROUPS: FilterGroup[] = [
  {
    key: "stage",
    label: "Stage",
    options: [
      { value: "pre_seed", label: "Pre-Seed" },
      { value: "seed", label: "Seed" },
      { value: "series_a", label: "Series A" },
    ],
  },
  {
    key: "sector",
    label: "Sector",
    options: [
      { value: "FinTech", label: "FinTech" },
      { value: "ClimaTech", label: "ClimaTech" },
      { value: "HealthTech", label: "HealthTech" },
    ],
  },
  {
    key: "geography",
    label: "Country",
    options: [
      { value: "France", label: "France" },
      { value: "Germany", label: "Germany" },
      { value: "United Kingdom", label: "UK" },
      { value: "Spain", label: "Spain" },
      { value: "Netherlands", label: "Netherlands" },
    ],
  },
];

export default function FilterChipBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  function toggle(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    startTransition(() => {
      router.replace(`?${next.toString()}`, { scroll: false });
    });
  }

  function clearAll() {
    startTransition(() => {
      router.replace("?", { scroll: false });
    });
  }

  const active = (key: string, value: string) => params.get(key) === value;
  const hasAny =
    !!params.get("sector") ||
    !!params.get("stage") ||
    !!params.get("geography");

  return (
    <div className="flex flex-wrap items-center gap-2 overflow-x-auto py-1">
      {FILTER_GROUPS.flatMap((g) =>
        g.options.map((opt) => {
          const on = active(g.key, opt.value);
          return (
            <button
              key={`${g.key}:${opt.value}`}
              type="button"
              onClick={() => toggle(g.key, opt.value)}
              aria-pressed={on}
              className={cn(
                "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                on
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-accent"
              )}
            >
              {opt.label}
            </button>
          );
        })
      )}
      {hasAny ? (
        <button
          type="button"
          onClick={clearAll}
          className="ml-1 inline-flex shrink-0 items-center rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

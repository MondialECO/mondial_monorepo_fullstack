"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type RoleOption = {
  id: string;
  name: string;
  description: string;
  /** path under /public, e.g. /profiles/creator.png */
  avatar: string;
};

type BaseProps = {
  role: RoleOption;
  selected: boolean;
  onSelect: (id: string) => void;
  className?: string;
};

/**
 * GRID variant — taller, icon-centric card. Use in a 2×2 grid.
 * Keyboard: Space/Enter toggles. Radio is visual; the whole card is the control.
 */
export function RoleCardGrid({ role, selected, onSelect, className }: BaseProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(role.id)}
      className={cn(
        "group relative flex h-full flex-col items-start gap-4 rounded-2xl border p-6 text-left transition-all",
        "bg-card text-card-foreground",
        "hover:border-primary/60 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary ring-1 ring-primary/30 shadow-sm"
          : "border-border",
        className,
      )}
    >
      <RadioDot selected={selected} className="absolute right-4 top-4" />

      <div className="relative size-14 overflow-hidden rounded-xl bg-muted">
        <Image
          src={role.avatar}
          alt=""
          fill
          sizes="56px"
          className="object-cover"
        />
      </div>

      <div className="space-y-1">
        <h3 className="text-base font-semibold leading-tight">{role.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {role.description}
        </p>
      </div>

      <span
        className={cn(
          "mt-auto inline-flex items-center gap-1.5 text-xs font-medium",
          "text-muted-foreground group-hover:text-primary transition-colors",
        )}
      >
        Explore this role
        <span aria-hidden="true">→</span>
      </span>
    </button>
  );
}

/**
 * LIST variant — wide single-row card stacked vertically.
 */
export function RoleCardList({ role, selected, onSelect, className }: BaseProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={() => onSelect(role.id)}
      className={cn(
        "group flex w-full items-center gap-4 rounded-2xl border p-6 text-left transition-all",
        "bg-card text-card-foreground",
        "hover:border-primary/60 hover:shadow-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary ring-1 ring-primary/30 shadow-sm"
          : "border-border",
        className,
      )}
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
        <Image
          src={role.avatar}
          alt=""
          fill
          sizes="48px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <h3 className="text-sm font-semibold leading-tight">{role.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {role.description}
        </p>
      </div>

      <RadioDot selected={selected} />
    </button>
  );
}

function RadioDot({
  selected,
  className,
}: {
  selected: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background",
        className,
      )}
    >
      {selected ? <Check className="size-3" strokeWidth={3} /> : null}
    </span>
  );
}

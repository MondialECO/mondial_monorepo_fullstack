"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
  const roleKey = role.id === 'service-provider' ? 'serviceProvider' : role.id;
  const roleName = t(`auth.roles.${roleKey}.name`, role.name);
  const roleDescription = t(`auth.roles.${roleKey}.description`, role.description);

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
        <h3 className="text-base font-semibold leading-tight">{roleName}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
          {roleDescription}
        </p>
      </div>

      <span
        className={cn(
          "mt-auto inline-flex items-center gap-1.5 text-xs font-medium",
          "text-muted-foreground group-hover:text-primary transition-colors",
        )}
      >
        {t('auth.roles.exploreRole', 'Explore this role')}
        <span aria-hidden="true">{'\u2192'}</span>
      </span>
    </button>
  );
}

/**
 * LIST variant — wide single-row card stacked vertically.
 */
export function RoleCardList({ role, selected, onSelect, className }: BaseProps) {
  const { t } = useTranslation();
  const roleKey = role.id === 'service-provider' ? 'serviceProvider' : role.id;
  const roleName = t(`auth.roles.${roleKey}.name`, role.name);
  const roleDescription = t(`auth.roles.${roleKey}.description`, role.description);

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
        <h3 className="text-sm font-semibold leading-tight">{roleName}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {roleDescription}
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

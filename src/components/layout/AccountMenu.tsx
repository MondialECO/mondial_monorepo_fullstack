"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, type LucideIcon } from "lucide-react";
import { useAuth } from "@/app/_providers/AuthProvider";

export type AccountMenuItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

/**
 * Avatar-initials trigger with a dropdown carrying the signed-in identity, role-specific
 * destinations, and sign-out.
 *
 * Extracted from SpAccountMenu, which was role-agnostic in every respect except three:
 * a hardcoded "Service Provider" label, an "SP" initials fallback, and two SP-only links.
 * Those are now props; the keyboard, focus-restore and outside-click behaviour is unchanged.
 *
 * Colours are semantic tokens rather than the raw hex the SP version used, and that is
 * load-bearing rather than tidiness. SP renders inside `.sp-workspace`, which pins light
 * values, so hex was safe there. This component now also renders in Creator, Entrepreneur
 * and Investor chrome, which follows the global theme including dark mode — where the SP
 * original's `bg-white` + `text-[#171717]` would have painted near-black text on a dark
 * surface. `text-foreground`, `text-muted-foreground` and `border-border` each resolve to
 * SP's pinned values inside that scope and to the active theme's values everywhere else, so
 * one component is correct under both.
 */
export function AccountMenu({
  roleLabel,
  initialsFallback,
  items = [],
}: {
  roleLabel: string;
  initialsFallback: string;
  items?: AccountMenuItem[];
}) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const menuId = useId();
  const initials = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || initialsFallback;

  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open account menu"
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary outline-none transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {initials}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={`${roleLabel} account`}
          className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-semibold">{user?.name || roleLabel}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{roleLabel}</p>
          </div>
          {items.map((item, index) => (
            <Link
              key={item.href}
              // Focus lands on the first destination when one exists; otherwise the
              // sign-out button below takes it, so the menu is never opened onto nothing.
              ref={index === 0 ? (firstItemRef as React.Ref<HTMLAnchorElement>) : undefined}
              role="menuitem"
              href={item.href}
              onClick={() => setOpen(false)}
              className="mt-1 flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <item.icon className="size-4" aria-hidden="true" /> {item.label}
            </Link>
          ))}
          <button
            ref={items.length === 0 ? (firstItemRef as React.Ref<HTMLButtonElement>) : undefined}
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="mt-1 flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="size-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

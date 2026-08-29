"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Building2, Check, ChevronDown, Loader2, Settings2 } from "lucide-react";
import { useEntrepreneurProgress } from "@/providers/EntrepreneurProgressProvider";
import { cn } from "@/lib/utils";
import { getPhaseConfig } from "@/lib/entrepreneur";
import { PhaseNumber } from "@/types/entrepreneur";

export function CompanySwitcher() {
  const {
    companies,
    activeCompany,
    activeCompanyId,
    switchCompany,
    isSwitching,
    isLoading,
  } = useEntrepreneurProgress();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  if (isLoading && !activeCompany) {
    return (
      <div className="flex h-9 items-center gap-2 rounded-lg border border-border/60 bg-muted/40 px-3 text-xs text-muted-foreground animate-pulse">
        <Building2 className="h-3.5 w-3.5" />
        <span className="max-w-[100px] truncate">Loading...</span>
      </div>
    );
  }

  // If user has no companies at all, show empty/placeholder or return null
  if (!companies || companies.length === 0) {
    return null;
  }

  const handleSelectCompany = async (companyId: string) => {
    if (companyId === activeCompanyId) {
      setOpen(false);
      return;
    }

    const success = await switchCompany(companyId);
    setOpen(false);

    if (success) {
      // Find the target company's current phase to check if current route is valid
      const target = companies.find((c) => c.id === companyId);
      const targetPhase = (target?.currentPhase ?? 2) as PhaseNumber;

      const phaseMatch = pathname.match(/\/dashboard\/entrepreneur\/phase-(\d+)/);
      if (phaseMatch) {
        const routePhase = parseInt(phaseMatch[1], 10);
        // If viewing a phase higher than the new company's currentPhase, redirect
        if (routePhase > targetPhase) {
          const config = getPhaseConfig(targetPhase);
          router.push(
            `/dashboard/entrepreneur/phase-${targetPhase}${
              config.hasSteps ? "/step-1" : ""
            }`
          );
        }
      }
    }
  };

  const displayName = activeCompany?.companyName || "Select Company";
  const initialLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Switch active company context"
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-expanded={open}
        disabled={isSwitching}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "group flex h-9 max-w-[220px] sm:max-w-[280px] items-center gap-2 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1.5 text-xs font-medium text-foreground transition-all hover:border-border hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
          open && "border-primary/50 ring-2 ring-primary/20 bg-accent/40"
        )}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-bold text-primary">
          {isSwitching ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            initialLetter
          )}
        </span>

        <span className="truncate text-left font-semibold text-foreground font-sans">
          {displayName}
        </span>

        {activeCompany?.currentPhase ? (
          <span className="hidden md:inline-flex rounded-full bg-secondary px-1.5 py-0.5 text-[9px] font-medium text-secondary-foreground">
            P{activeCompany.currentPhase}
          </span>
        ) : null}

        <ChevronDown
          className={cn(
            "ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-foreground"
          )}
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Company Switcher"
          className="absolute left-0 sm:right-0 sm:left-auto z-50 mt-1.5 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1.5 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/60">
            Active Operating Context
          </div>

          <div className="max-h-60 overflow-y-auto py-1 space-y-0.5">
            {companies.map((company) => {
              const isActive = company.id === activeCompanyId || company.isActive;
              return (
                <button
                  key={company.id}
                  type="button"
                  role="menuitem"
                  disabled={isSwitching}
                  onClick={() => handleSelectCompany(company.id)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-accent/80 hover:text-accent-foreground"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-semibold text-foreground text-xs">
                        {company.companyName || "Unnamed Company"}
                      </p>
                      {isActive && (
                        <span className="inline-flex items-center rounded-full bg-primary/20 px-1.5 py-0.2 text-[9px] font-bold text-primary">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                      {company.industry || company.legalStructure || `Phase ${company.currentPhase}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      P{company.currentPhase}
                    </span>
                    {isActive && <Check className="h-4 w-4 text-primary" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="border-t border-border/60 pt-1 mt-1">
            <Link
              href="/dashboard/entrepreneur/companies"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5" />
              <span>Manage Companies</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

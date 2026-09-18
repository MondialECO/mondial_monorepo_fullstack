"use client";

import React, { useState } from "react";
import { BrandKit, BrandColorRole } from "@/types/creator/brand-kit";
import { Check, Copy, Lock, ShieldCheck, AlertTriangle } from "lucide-react";

interface ColorsResultCardProps {
  kit: BrandKit;
  onEdit?: () => void;
}

export function ColorsResultCard({ kit, onEdit }: ColorsResultCardProps) {
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  const colors = kit.colors;
  const roles = colors?.roles ?? [];
  const isConfirmed = Boolean(colors?.confirmedAt);

  const handleCopy = (e: React.MouseEvent, hex: string, roleName: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hex);
    setCopiedRole(roleName);
    setTimeout(() => setCopiedRole(null), 1500);
  };

  const getContrastBadge = (role: BrandColorRole) => {
    if (role.roleName === "Background") {
      return (
        <span className="text-badge font-mono text-muted-foreground">
          Ground canvas
        </span>
      );
    }

    const verdict = role.contrastVerdict?.toUpperCase();
    const ratio = role.contrastRatio ? `${role.contrastRatio}:1` : "";

    if (verdict === "AAA") {
      return (
        <span className="inline-flex items-center gap-1 text-badge font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="size-3" />
          {ratio} AAA
        </span>
      );
    }

    if (verdict === "AA" || verdict === "AA_LARGE") {
      return (
        <span className="inline-flex items-center gap-1 text-badge font-mono font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
          <ShieldCheck className="size-3" />
          {ratio} {verdict === "AA_LARGE" ? "AA Large" : "AA"}
        </span>
      );
    }

    if (verdict === "FAIL") {
      return (
        <span className="inline-flex items-center gap-1 text-badge font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="size-3" />
          {ratio} FAIL
        </span>
      );
    }

    return (
      <span className="text-badge font-mono text-muted-foreground">
        {ratio || "Evaluated"}
      </span>
    );
  };

  return (
    <div
      onClick={onEdit}
      className={`group relative flex flex-col rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isConfirmed
          ? "border-emerald-500/30 bg-card hover:border-emerald-500/50 hover:shadow-md"
          : "border-border/80 bg-card/60 hover:border-border hover:bg-card"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="font-mono text-badge font-bold text-muted-foreground tracking-wider uppercase">
            STEP 5
          </span>
          <span className="text-card-title font-semibold text-foreground">
            Harmonized Colour System
          </span>
        </div>
        {isConfirmed ? (
          <span className="inline-flex items-center gap-1 font-mono text-badge font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <Check className="size-3 stroke-[3]" />
            CONFIRMED
          </span>
        ) : (
          <span className="font-mono text-badge text-muted-foreground">
            Draft
          </span>
        )}
      </div>

      {/* 5 Swatches Horizontal Stack */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-5 gap-2">
          {roles.map((role) => (
            <div key={role.roleName} className="flex flex-col gap-1.5">
              <div
                className="h-10 w-full rounded-lg border border-black/10 relative shadow-2xs group/swatch"
                style={{ backgroundColor: role.hex }}
              >
                {role.isLocked && (
                  <div className="absolute top-1 right-1 size-3.5 rounded bg-black/40 backdrop-blur-xs flex items-center justify-center text-white">
                    <Lock className="size-2" />
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-caption font-semibold text-foreground truncate">
                  {role.roleName}
                </span>
                <button
                  type="button"
                  onClick={(e) => handleCopy(e, role.hex, role.roleName)}
                  className="inline-flex items-center gap-1 text-badge font-mono text-muted-foreground hover:text-foreground group/copy text-left cursor-pointer"
                >
                  <span>{role.hex}</span>
                  {copiedRole === role.roleName ? (
                    <Check className="size-2.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-2.5 opacity-0 group-hover/copy:opacity-100 transition-opacity" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Roles Details List */}
        <div className="pt-2 border-t border-dashed border-border/80 space-y-1.5">
          {roles.slice(0, 3).map((role) => (
            <div
              key={role.roleName}
              className="flex items-center justify-between text-caption"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full border border-black/10 shrink-0"
                  style={{ backgroundColor: role.hex }}
                />
                <span className="font-medium text-caption text-foreground">
                  {role.roleName}
                </span>
              </div>
              {getContrastBadge(role)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

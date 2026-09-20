"use client";

import React from "react";
import { BrandKit } from "@/types/creator/brand-kit";
import { Check, Lock, Type, Edit3 } from "lucide-react";

interface TypographyResultCardProps {
  kit: BrandKit;
  onEdit?: () => void;
}

export function TypographyResultCard({ kit, onEdit }: TypographyResultCardProps) {
  const typography = kit.typography;
  const roles = typography?.roles ?? [];
  const families = typography?.families;
  const isConfirmed = Boolean(typography?.confirmedAt);

  const logoTypeRole = roles.find((r) => r.roleName === "Logo type");
  const headingRole = roles.find((r) => r.roleName === "Heading");
  const bodyRole = roles.find((r) => r.roleName === "Body");
  const buttonRole = roles.find((r) => r.roleName === "Button & label");

  const displayFamily = families?.displayFamily?.name || headingRole?.family || "Syne";
  const textFamily = families?.textFamily?.name || bodyRole?.family || "Plus Jakarta Sans";

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
            STEP 6
          </span>
          <span className="text-card-title font-semibold text-foreground">
            Typography System
          </span>
        </div>
        <div className="flex items-center gap-2">
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
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border/60 text-button font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <Edit3 className="size-3" />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* Families Overview */}
      <div className="grid grid-cols-2 gap-2 p-3 bg-muted/10 border-b border-border/40">
        <div className="p-2 rounded-lg bg-background/80 border border-border/60">
          <div className="flex items-center justify-between text-badge font-mono text-muted-foreground mb-0.5">
            <span>DISPLAY FAMILY</span>
            {families?.displayFamily?.license && (
              <span className="truncate max-w-[80px]">{families.displayFamily.license}</span>
            )}
          </div>
          <div className="text-card-title font-bold text-foreground truncate" style={{ fontFamily: `"${displayFamily}", sans-serif` }}>
            {displayFamily}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-background/80 border border-border/60">
          <div className="flex items-center justify-between text-badge font-mono text-muted-foreground mb-0.5">
            <span>TEXT FAMILY</span>
            {families?.textFamily?.license && (
              <span className="truncate max-w-[80px]">{families.textFamily.license}</span>
            )}
          </div>
          <div className="text-card-title font-bold text-foreground truncate" style={{ fontFamily: `"${textFamily}", sans-serif` }}>
            {textFamily}
          </div>
        </div>
      </div>

      {/* 4 Role Specimens */}
      <div className="p-3 space-y-2.5">
        {/* 1. Logo Type */}
        <div className="p-2 rounded-lg bg-muted/20 border border-border/40">
          <div className="flex items-center justify-between text-badge mb-1">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Type className="size-3 text-muted-foreground" />
              <span>Logo type</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-badge text-muted-foreground font-semibold">
                {logoTypeRole?.family || "Plus Jakarta Sans"}
              </span>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground text-badge font-mono">
                <Lock className="size-2.5 text-muted-foreground" />
                Permanent
              </span>
            </div>
          </div>
          <div
            className="text-card-title font-bold text-foreground truncate"
            style={{
              fontFamily: `"${logoTypeRole?.family || "Plus Jakarta Sans"}", sans-serif`,
              fontWeight: logoTypeRole?.weight || "700",
            }}
          >
            {logoTypeRole?.specimenText || kit.strategy?.businessName || "Brand"}
          </div>
        </div>

        {/* 2. Heading */}
        <div className="p-2 rounded-lg bg-muted/20 border border-border/40">
          <div className="flex items-center justify-between text-badge mb-1">
            <span className="font-medium text-foreground">Heading</span>
            <span className="font-mono text-badge text-muted-foreground">
              {headingRole?.family || displayFamily} · {headingRole?.weight || "700"} · {headingRole?.size || "32px"}
            </span>
          </div>
          <div
            className="text-card-title font-bold text-foreground truncate"
            style={{
              fontFamily: `"${headingRole?.family || displayFamily}", sans-serif`,
              fontWeight: headingRole?.weight || "700",
            }}
          >
            {headingRole?.specimenText || kit.strategy?.positioning?.value || "Empowering the future"}
          </div>
        </div>

        {/* 3. Body */}
        <div className="p-2 rounded-lg bg-muted/20 border border-border/40">
          <div className="flex items-center justify-between text-badge mb-1">
            <span className="font-medium text-foreground">Body</span>
            <span className="font-mono text-badge text-muted-foreground">
              {bodyRole?.family || textFamily} · {bodyRole?.weight || "400"} · {bodyRole?.size || "16px"}
            </span>
          </div>
          <div
            className="text-body text-muted-foreground line-clamp-2 leading-relaxed"
            style={{
              fontFamily: `"${bodyRole?.family || textFamily}", sans-serif`,
              fontWeight: bodyRole?.weight || "400",
            }}
          >
            {bodyRole?.specimenText || kit.strategy?.concept?.value || "Designed with modular precision and dynamic interfaces."}
          </div>
        </div>

        {/* 4. Button & label */}
        <div className="p-2 rounded-lg bg-muted/20 border border-border/40">
          <div className="flex items-center justify-between text-badge mb-1">
            <span className="font-medium text-foreground">Button & label</span>
            <span className="font-mono text-badge text-muted-foreground">
              {buttonRole?.family || textFamily} · {buttonRole?.weight || "600"} · {buttonRole?.size || "14px"}
            </span>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <span
              className="inline-block px-3 py-1 rounded bg-primary text-primary-foreground text-button font-semibold"
              style={{
                fontFamily: `"${buttonRole?.family || textFamily}", sans-serif`,
                fontWeight: buttonRole?.weight || "600",
              }}
            >
              {buttonRole?.specimenText || `Explore ${kit.strategy?.businessName || "Brand"}`}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between border-t border-border/60 px-4 py-2 bg-muted/10 text-caption text-muted-foreground">
        <span className="font-mono text-badge">
          {roles.length} roles active
        </span>
        <span className="font-medium text-primary group-hover:underline">
          {isConfirmed ? "Inspect pairing →" : "Configure typography →"}
        </span>
      </div>
    </div>
  );
}

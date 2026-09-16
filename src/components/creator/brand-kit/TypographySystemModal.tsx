"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  BrandKit,
  BrandTypography,
  BrandTypographyRole,
  BrandTypographyFamilies,
} from "@/types/creator/brand-kit";
import { apiCreatorBrandKit } from "@/lib/api-creator-brand-kit";
import { RegenerateCapBadge } from "./RegenerateCapBadge";
import { ModalWorkflowHeader } from "./ModalWorkflowHeader";
import {
  Sparkles,
  Lock,
  Check,
  RotateCw,
  X,
  Type,
  Layers,
  ChevronDown,
  Info,
} from "lucide-react";
import Link from "next/link";

interface TypographySystemModalProps {
  isOpen: boolean;
  ideaId?: string;
  kit: BrandKit;
  onClose: () => void;
  onSuccess: (updatedKit: BrandKit) => void;
}

const DEFAULT_FONT_METADATA: Record<
  string,
  { license: string; weights: string[]; webWeightKb: number }
> = {
  Cinzel: {
    license: "SIL Open Font License 1.1",
    weights: ["400", "700"],
    webWeightKb: 122.5,
  },
  "Space Grotesk": {
    license: "SIL Open Font License 1.1",
    weights: ["400", "500", "700"],
    webWeightKb: 133.5,
  },
  "Plus Jakarta Sans": {
    license: "SIL Open Font License 1.1",
    weights: ["400", "500", "600", "700", "800"],
    webWeightKb: 172.1,
  },
  Syne: {
    license: "SIL Open Font License 1.1",
    weights: ["400", "600", "700", "800"],
    webWeightKb: 143.5,
  },
  "JetBrains Mono": {
    license: "Apache License 2.0 / OFL",
    weights: ["400", "500", "700"],
    webWeightKb: 182.8,
  },
};

export function TypographySystemModal({
  isOpen,
  ideaId,
  kit,
  onClose,
  onSuccess,
}: TypographySystemModalProps) {
  const [localTypography, setLocalTypography] = useState<BrandTypography>(() => {
    return kit.typography ?? {
      roles: [],
      regenerateCount: 0,
    };
  });

  const [isPending, startTransition] = useTransition();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);

  // Initial derivation if roles are empty
  useEffect(() => {
    if (isOpen && (!kit.typography?.roles || kit.typography.roles.length === 0)) {
      startTransition(async () => {
        try {
          const res = await apiCreatorBrandKit.generateTypography(ideaId, kit.version);
          if (res.typography) {
            setLocalTypography(res.typography);
          }
        } catch (err: any) {
          console.error("Failed to generate initial typography:", err);
          setErrorMessage(err.message || "Failed to initialize typography system.");
        }
      });
    } else if (kit.typography) {
      setLocalTypography(kit.typography);
    }
  }, [isOpen, kit, ideaId]);

  if (!isOpen) return null;

  const roles = localTypography.roles ?? [];
  const regenerateCount = localTypography.regenerateCount ?? 0;
  const isCapExhausted = regenerateCount >= 3;

  const logoTypeRole = roles.find((r) => r.roleName === "Logo type");
  const headingRole = roles.find((r) => r.roleName === "Heading");
  const bodyRole = roles.find((r) => r.roleName === "Body");
  const buttonRole = roles.find((r) => r.roleName === "Button & label");

  const displayFamilyName =
    localTypography.families?.displayFamily?.name || headingRole?.family || "Syne";
  const textFamilyName =
    localTypography.families?.textFamily?.name || bodyRole?.family || "Plus Jakarta Sans";

  const displayMeta =
    DEFAULT_FONT_METADATA[displayFamilyName] || {
      license: "SIL Open Font License 1.1",
      weights: ["400", "700"],
      webWeightKb: 135.0,
    };

  const textMeta =
    DEFAULT_FONT_METADATA[textFamilyName] || {
      license: "SIL Open Font License 1.1",
      weights: ["400", "500", "600", "700"],
      webWeightKb: 160.0,
    };

  // Confirmed brand colors for live hierarchy preview
  const primaryColor =
    kit.colors?.roles?.find((r) => r.roleName === "Primary")?.hex || "#0f172a";
  const secondaryColor =
    kit.colors?.roles?.find((r) => r.roleName === "Secondary")?.hex || "#475569";
  const accentColor =
    kit.colors?.roles?.find((r) => r.roleName === "Accent")?.hex || "#3b82f6";
  const backgroundColor =
    kit.colors?.roles?.find((r) => r.roleName === "Background")?.hex || "#f8fafc";
  const textColor =
    kit.colors?.roles?.find((r) => r.roleName === "Text")?.hex || "#0f172a";

  // Per-role direct PATCH tuning (free, uncapped)
  const handleTuningChange = async (
    roleName: string,
    updates: { weight?: string; size?: string; lineHeight?: string }
  ) => {
    const updatedRoles = roles.map((r) => {
      if (r.roleName === roleName) {
        return { ...r, ...updates, editedAt: new Date().toISOString() };
      }
      return r;
    });

    setLocalTypography((prev) => ({
      ...prev,
      roles: updatedRoles,
    }));

    try {
      await apiCreatorBrandKit.patchTypography(
        {
          roles: [
            {
              roleName,
              ...updates,
            },
          ],
        },
        ideaId,
        kit.version
      );
    } catch (err: any) {
      console.error("Failed to patch typography role:", err);
    }
  };

  // Whole-pairing regeneration (costs credits, 3-cap, Logo type permanently preserved)
  const handleRegeneratePairing = async () => {
    if (isCapExhausted || isRegenerating) return;

    setIsRegenerating(true);
    setErrorMessage(null);
    setInsufficientCredits(false);

    try {
      const updatedKit = await apiCreatorBrandKit.regenerateTypography(
        ideaId,
        kit.version
      );
      if (updatedKit.typography) {
        setLocalTypography(updatedKit.typography);
      }
    } catch (err: any) {
      if (err.status === 402 || err.response?.status === 402) {
        setInsufficientCredits(true);
      } else {
        setErrorMessage(
          err.response?.data?.message || err.message || "Failed to regenerate typography pairing."
        );
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  // Confirming step & completing kit
  const handleConfirm = async () => {
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const confirmedAt = new Date().toISOString();
      const patchRoles = roles.map((r) => ({
        roleName: r.roleName,
        family: r.roleName === "Logo type" ? undefined : r.family,
        weight: r.weight,
        size: r.size,
        lineHeight: r.lineHeight,
        specimenText: r.specimenText,
        isLocked: r.roleName === "Logo type" ? undefined : r.isLocked,
        provenance: r.provenance,
      }));

      const updatedKit = await apiCreatorBrandKit.patchTypography(
        {
          roles: patchRoles,
          confirmedAt,
        },
        ideaId,
        kit.version
      );

      // Advance/complete step (sets kit to complete server-side)
      const finalKit = await apiCreatorBrandKit.advanceStep(6, ideaId, updatedKit.version);

      onSuccess(finalKit);
    } catch (err: any) {
      console.error("Failed to confirm typography:", err);
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to complete brand kit."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="typography-modal-title"
    >
      <div className="relative w-full max-w-5xl rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header & 6-Step Workflow Track (Figma Node 57003:9812) */}
        <ModalWorkflowHeader
          title="Harmonized Typography System"
          subtitle="Display and text typefaces paired to match your strategy and visual archetype."
          currentStep={6}
          onClose={onClose}
          headerActions={
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/60">
                <Sparkles className="size-3 text-primary" />
                2 Credits
              </span>
              <RegenerateCapBadge usedCount={regenerateCount} maxCount={3} />
              <button
                type="button"
                onClick={handleRegeneratePairing}
                disabled={isRegenerating || isCapExhausted}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title={
                  isCapExhausted
                    ? "Maximum regenerations reached (3/3)"
                    : "Suggest alternative heading and body pairings"
                }
              >
                <RotateCw className={`size-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                <span>{isRegenerating ? "Pairing..." : "Suggest pairings"}</span>
              </button>
            </div>
          }
        />

        {/* Insufficient Credits Banner */}
        {insufficientCredits && (
          <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
            <span>
              Insufficient AI credits for pairing generation. Please top up your balance.
            </span>
            <Link
              href="/dashboard/creator/billing"
              className="font-bold underline hover:opacity-80 ml-2"
            >
              Top Up Credits →
            </Link>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="px-6 py-2.5 bg-destructive/10 border-b border-destructive/20 text-xs text-destructive flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs font-bold underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* 1. Bundled Family Summary Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
                1. BUNDLED TYPEFACE FAMILIES
              </span>
              <span className="text-xs text-muted-foreground">
                Display & text pairings
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Display Family Card */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-primary tracking-wider uppercase">
                    DISPLAY FAMILY
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {displayMeta.webWeightKb} KB web weight
                  </span>
                </div>
                <div
                  className="text-2xl font-bold text-foreground"
                  style={{ fontFamily: `"${displayFamilyName}", sans-serif` }}
                >
                  {displayFamilyName}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <span className="font-mono text-[11px]">{displayMeta.license}</span>
                  <span className="font-mono text-[11px]">
                    Weights: {displayMeta.weights.join(", ")}
                  </span>
                </div>
              </div>

              {/* Text Family Card */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-primary tracking-wider uppercase">
                    TEXT FAMILY
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {textMeta.webWeightKb} KB web weight
                  </span>
                </div>
                <div
                  className="text-2xl font-bold text-foreground"
                  style={{ fontFamily: `"${textFamilyName}", sans-serif` }}
                >
                  {textFamilyName}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
                  <span className="font-mono text-[11px]">{textMeta.license}</span>
                  <span className="font-mono text-[11px]">
                    Weights: {textMeta.weights.join(", ")}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Four Canonical Role Specimen Rows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
                2. ROLE SPECIMENS & SCALING
              </span>
              <span className="text-xs text-muted-foreground">
                Per-role tuning is free & uncapped
              </span>
            </div>

            <div className="space-y-3">
              {/* Role 1: Logo type (Permanent Lock) */}
              <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <Type className="size-4 text-primary" />
                    <span className="text-sm font-bold text-foreground">Logo type</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      · {logoTypeRole?.family || "Plus Jakarta Sans"}
                    </span>
                  </div>

                  {/* Distinctive Permanent Lock Badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted/80 border border-border/80 text-[11px] font-mono text-muted-foreground">
                    <Lock className="size-3 text-muted-foreground" />
                    <span>Bound to approved logo concept</span>
                  </div>
                </div>

                <div
                  className="text-2xl font-bold text-foreground tracking-tight"
                  style={{
                    fontFamily: `"${logoTypeRole?.family || "Plus Jakarta Sans"}", sans-serif`,
                    fontWeight: logoTypeRole?.weight || "700",
                  }}
                >
                  {logoTypeRole?.specimenText || kit.strategy?.businessName || "Brand"}
                </div>
              </div>

              {/* Role 2: Heading */}
              <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">Heading</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      · {headingRole?.family || displayFamilyName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Weight selector */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono text-[10px] text-muted-foreground">WEIGHT:</span>
                      <select
                        aria-label="Heading font weight"
                        value={headingRole?.weight || "700"}
                        onChange={(e) =>
                          handleTuningChange("Heading", { weight: e.target.value })
                        }
                        className="font-mono text-xs px-2 py-1 rounded border border-border/60 bg-muted/40 text-foreground"
                      >
                        <option value="600">600 SemiBold</option>
                        <option value="700">700 Bold</option>
                        <option value="800">800 ExtraBold</option>
                      </select>
                    </div>

                    {/* Size selector */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono text-[10px] text-muted-foreground">SIZE:</span>
                      <select
                        aria-label="Heading font size"
                        value={headingRole?.size || "32px"}
                        onChange={(e) =>
                          handleTuningChange("Heading", { size: e.target.value })
                        }
                        className="font-mono text-xs px-2 py-1 rounded border border-border/60 bg-muted/40 text-foreground"
                      >
                        <option value="28px">28px</option>
                        <option value="32px">32px</option>
                        <option value="36px">36px</option>
                        <option value="40px">40px</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div
                  className="font-bold text-foreground leading-tight"
                  style={{
                    fontFamily: `"${headingRole?.family || displayFamilyName}", sans-serif`,
                    fontSize: headingRole?.size || "32px",
                    fontWeight: headingRole?.weight || "700",
                  }}
                >
                  {headingRole?.specimenText ||
                    kit.strategy?.positioning?.value ||
                    "Next-generation digital infrastructure"}
                </div>
              </div>

              {/* Role 3: Body */}
              <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">Body</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      · {bodyRole?.family || textFamilyName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Weight selector */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono text-[10px] text-muted-foreground">WEIGHT:</span>
                      <select
                        aria-label="Body font weight"
                        value={bodyRole?.weight || "400"}
                        onChange={(e) =>
                          handleTuningChange("Body", { weight: e.target.value })
                        }
                        className="font-mono text-xs px-2 py-1 rounded border border-border/60 bg-muted/40 text-foreground"
                      >
                        <option value="400">400 Regular</option>
                        <option value="500">500 Medium</option>
                      </select>
                    </div>

                    {/* Size selector */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono text-[10px] text-muted-foreground">SIZE:</span>
                      <select
                        aria-label="Body font size"
                        value={bodyRole?.size || "16px"}
                        onChange={(e) =>
                          handleTuningChange("Body", { size: e.target.value })
                        }
                        className="font-mono text-xs px-2 py-1 rounded border border-border/60 bg-muted/40 text-foreground"
                      >
                        <option value="14px">14px</option>
                        <option value="15px">15px</option>
                        <option value="16px">16px</option>
                        <option value="18px">18px</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div
                  className="text-muted-foreground leading-relaxed"
                  style={{
                    fontFamily: `"${bodyRole?.family || textFamilyName}", sans-serif`,
                    fontSize: bodyRole?.size || "16px",
                    fontWeight: bodyRole?.weight || "400",
                  }}
                >
                  {bodyRole?.specimenText ||
                    kit.strategy?.concept?.value ||
                    "Crafted with modular design tokens, deterministic WCAG contrast evaluation, and fluid visual hierarchy."}
                </div>
              </div>

              {/* Role 4: Button & label */}
              <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">Button & label</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      · {buttonRole?.family || textFamilyName}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Weight selector */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono text-[10px] text-muted-foreground">WEIGHT:</span>
                      <select
                        aria-label="Button font weight"
                        value={buttonRole?.weight || "600"}
                        onChange={(e) =>
                          handleTuningChange("Button & label", { weight: e.target.value })
                        }
                        className="font-mono text-xs px-2 py-1 rounded border border-border/60 bg-muted/40 text-foreground"
                      >
                        <option value="500">500 Medium</option>
                        <option value="600">600 SemiBold</option>
                        <option value="700">700 Bold</option>
                      </select>
                    </div>

                    {/* Size selector */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-mono text-[10px] text-muted-foreground">SIZE:</span>
                      <select
                        aria-label="Button font size"
                        value={buttonRole?.size || "14px"}
                        onChange={(e) =>
                          handleTuningChange("Button & label", { size: e.target.value })
                        }
                        className="font-mono text-xs px-2 py-1 rounded border border-border/60 bg-muted/40 text-foreground"
                      >
                        <option value="12px">12px</option>
                        <option value="13px">13px</option>
                        <option value="14px">14px</option>
                        <option value="15px">15px</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold shadow-sm"
                    style={{
                      fontFamily: `"${buttonRole?.family || textFamilyName}", sans-serif`,
                      fontSize: buttonRole?.size || "14px",
                      fontWeight: buttonRole?.weight || "600",
                    }}
                  >
                    {buttonRole?.specimenText || `Explore ${kit.strategy?.businessName || "Brand"}`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Hierarchy Live Layout Preview */}
          <div className="space-y-2">
            <span className="font-mono text-xs font-bold text-muted-foreground uppercase tracking-wider">
              3. LIVE HIERARCHY PREVIEW (CONFIRMED PALETTE)
            </span>

            <div
              className="p-6 rounded-xl border border-border/80 space-y-4 shadow-sm"
              style={{
                backgroundColor: backgroundColor,
                color: textColor,
              }}
            >
              <div className="flex items-center justify-between border-b border-border/20 pb-3">
                <span
                  className="text-base font-bold tracking-tight"
                  style={{
                    fontFamily: `"${logoTypeRole?.family || "Plus Jakarta Sans"}", sans-serif`,
                    color: primaryColor,
                  }}
                >
                  {kit.strategy?.businessName || "Brand Identity"}
                </span>
                <span
                  className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium"
                  style={{
                    backgroundColor: `${accentColor}20`,
                    color: accentColor,
                    border: `1px solid ${accentColor}40`,
                  }}
                >
                  Typography Live Preview
                </span>
              </div>

              <div className="space-y-2 max-w-xl">
                <h3
                  className="font-bold leading-tight"
                  style={{
                    fontFamily: `"${headingRole?.family || displayFamilyName}", sans-serif`,
                    fontSize: headingRole?.size || "28px",
                    fontWeight: headingRole?.weight || "700",
                    color: primaryColor,
                  }}
                >
                  {headingRole?.specimenText ||
                    kit.strategy?.positioning?.value ||
                    "Architecture engineered for sustainable innovation"}
                </h3>
                <p
                  className="leading-relaxed"
                  style={{
                    fontFamily: `"${bodyRole?.family || textFamilyName}", sans-serif`,
                    fontSize: bodyRole?.size || "15px",
                    fontWeight: bodyRole?.weight || "400",
                    color: secondaryColor,
                  }}
                >
                  {bodyRole?.specimenText ||
                    kit.strategy?.concept?.value ||
                    "Harmonizing display accents and optical scales for high-legibility enterprise experiences."}
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg font-semibold shadow-sm transition-opacity hover:opacity-90"
                  style={{
                    fontFamily: `"${buttonRole?.family || textFamilyName}", sans-serif`,
                    fontSize: buttonRole?.size || "14px",
                    fontWeight: buttonRole?.weight || "600",
                    backgroundColor: primaryColor,
                    color: backgroundColor,
                  }}
                >
                  {buttonRole?.specimenText || `Get Started with ${kit.strategy?.businessName || "Brand"}`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-border/60 px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="size-4 text-primary" />
            <span>Confirming completes the 6-step Studio identity flow.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSaving || isRegenerating}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 transition-colors shadow-sm"
            >
              <Check className="size-4 stroke-[2.5]" />
              <span>{isSaving ? "Completing Brand Kit..." : "Confirm & Complete Brand Kit"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

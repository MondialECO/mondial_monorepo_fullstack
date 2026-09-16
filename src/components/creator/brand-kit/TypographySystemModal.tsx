"use client";

import React, { useState, useEffect, useMemo, useTransition } from "react";
import {
  BrandKit,
  BrandTypography,
  BrandTypographyRole,
  BrandTypographyFamilies,
} from "@/types/creator/brand-kit";
import { apiCreatorBrandKit, brandKitApi } from "@/lib/api-creator-brand-kit";
import { ModalWorkflowHeader } from "./ModalWorkflowHeader";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Check,
  Lock,
  Info,
  Type,
  Sliders,
  Sparkles,
  Layers,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

export interface TypographySystemModalProps {
  isOpen: boolean;
  ideaId?: string;
  kit: BrandKit;
  onClose: () => void;
  onSuccess: (updatedKit: BrandKit) => void;
}

interface PairingPreset {
  id: string;
  display: string;
  text: string;
  description: string;
  displayWeights: string[];
  textWeights: string[];
  license: string;
  weightCount: number;
  bundleKb: number;
}

const CANONICAL_PAIRING_PRESETS: PairingPreset[] = [
  {
    id: "syne_dmsans",
    display: "Syne",
    text: "DM Sans",
    description: "Geometric and assertive, with a neutral workhorse underneath.",
    displayWeights: ["400", "600", "700", "800"],
    textWeights: ["400", "500", "700"],
    license: "Open licence",
    weightCount: 5,
    bundleKb: 48,
  },
  {
    id: "jakarta_inter",
    display: "Plus Jakarta Sans",
    text: "Inter",
    description: "Warmer headlines, same clarity in body copy.",
    displayWeights: ["400", "500", "600", "700", "800"],
    textWeights: ["400", "500", "600", "700"],
    license: "Open licence",
    weightCount: 6,
    bundleKb: 52,
  },
  {
    id: "space_inter",
    display: "Space Grotesk",
    text: "Inter",
    description: "Technical and precise, closer to documentation.",
    displayWeights: ["400", "500", "700"],
    textWeights: ["400", "500", "600", "700"],
    license: "Open licence",
    weightCount: 4,
    bundleKb: 44,
  },
];

const CANONICAL_ROLE_NOTES: Record<string, string> = {
  "Logo type": "Locked to your wordmark. Changing this would redraw your logo.",
  Heading: "Page titles, section headers, deck slides.",
  Body: "Paragraph copy, descriptions, customer communication.",
  "Button & label": "Action triggers, badges, navigation items, metrics.",
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

  const [selectedPairingId, setSelectedPairingId] = useState<string>("syne_dmsans");
  const [isPending, startTransition] = useTransition();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);

  // Derive initial typography if roles are missing
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

  const roles = useMemo(() => localTypography.roles ?? [], [localTypography]);
  const regenerateCount = localTypography.regenerateCount ?? 0;
  const isCapExhausted = regenerateCount >= 3;

  // Brand Name & Tagline from strategy
  const brandName = useMemo(() => {
    return (
      kit.strategy?.nameDisplayForm ||
      kit.strategy?.businessName ||
      "Mondial"
    );
  }, [kit]);

  const brandTagline = useMemo(() => {
    return (
      kit.strategy?.positioning?.value ||
      kit.strategy?.concept?.value ||
      "Get paid without the awkward email"
    );
  }, [kit]);

  // Selected display and text families
  const displayFamilyName =
    localTypography.families?.displayFamily?.name ||
    roles.find((r) => r.roleName === "Heading")?.family ||
    "Syne";

  const textFamilyName =
    localTypography.families?.textFamily?.name ||
    roles.find((r) => r.roleName === "Body")?.family ||
    "DM Sans";

  // Match active pairing preset if exists
  useEffect(() => {
    const match = CANONICAL_PAIRING_PRESETS.find(
      (p) => p.display === displayFamilyName && p.text === textFamilyName
    );
    if (match) {
      setSelectedPairingId(match.id);
    }
  }, [displayFamilyName, textFamilyName]);

  // Handle choosing a preset pairing
  const handleSelectPairing = async (preset: PairingPreset) => {
    setSelectedPairingId(preset.id);

    const updatedRoles = roles.map((role) => {
      if (role.roleName === "Logo type") {
        return { ...role, family: preset.display };
      }
      if (role.roleName === "Heading") {
        return { ...role, family: preset.display };
      }
      if (role.roleName === "Body") {
        return { ...role, family: preset.text };
      }
      if (role.roleName === "Button & label") {
        return { ...role, family: preset.text };
      }
      return role;
    });

    const updatedFamilies: BrandTypographyFamilies = {
      displayFamily: {
        name: preset.display,
        license: preset.license,
        availableWeights: preset.displayWeights,
        webWeightKb: preset.bundleKb / 2,
      },
      textFamily: {
        name: preset.text,
        license: preset.license,
        availableWeights: preset.textWeights,
        webWeightKb: preset.bundleKb / 2,
      },
    };

    setLocalTypography({
      ...localTypography,
      roles: updatedRoles,
      families: updatedFamilies,
    });

    try {
      await apiCreatorBrandKit.patchTypography(
        {
          roles: updatedRoles.map((r) => ({
            roleName: r.roleName,
            family: r.roleName === "Logo type" ? undefined : r.family,
            weight: r.weight,
            size: r.size,
            lineHeight: r.lineHeight,
          })),
          families: updatedFamilies,
        },
        ideaId,
        kit.version
      );
    } catch (err: any) {
      console.error("Failed to patch typography pairing:", err);
    }
  };

  // Per-role direct PATCH tuning (free, uncapped)
  const handleTuningChange = async (
    roleName: string,
    updates: { weight?: string; size?: string; lineHeight?: string }
  ) => {
    if (roleName === "Logo type") return; // Logo type is strictly locked

    const updatedRoles = roles.map((r) =>
      r.roleName === roleName ? { ...r, ...updates, provenance: "user_tuned" } : r
    );

    setLocalTypography({
      ...localTypography,
      roles: updatedRoles,
    });

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
      console.error("Failed to update role typography:", err);
      setErrorMessage(err.message || "Failed to save typography adjustments.");
    }
  };

  // Regeneration Handler (Paid, 3-Cap)
  const handleRegeneratePairing = async () => {
    if (isCapExhausted) return;
    setIsRegenerating(true);
    setErrorMessage(null);
    setInsufficientCredits(false);

    try {
      const res = await apiCreatorBrandKit.regenerateTypography(ideaId, kit.version);
      if (res.typography) {
        setLocalTypography(res.typography);
      }
    } catch (err: any) {
      if (err?.response?.status === 402 || err?.status === 402) {
        setInsufficientCredits(true);
      } else {
        setErrorMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to regenerate typography pairing."
        );
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  // Confirmation & Final Complete Step
  const handleConfirm = async () => {
    setIsConfirming(true);
    setErrorMessage(null);

    try {
      const patchRes = await apiCreatorBrandKit.patchTypography(
        {
          roles: roles.map((r) => ({
            roleName: r.roleName,
            family: r.roleName === "Logo type" ? undefined : r.family,
            weight: r.weight,
            size: r.size,
            lineHeight: r.lineHeight,
            specimenText: r.specimenText,
            isLocked: r.roleName === "Logo type" ? undefined : r.isLocked,
          })),
          confirmedAt: new Date().toISOString(),
        },
        ideaId,
        kit.version
      );

      const completedKit = await apiCreatorBrandKit.advanceStep(
        6,
        ideaId,
        patchRes.version ?? kit.version
      );

      onSuccess(completedKit);
    } catch (err: any) {
      console.error("Failed to confirm typography:", err);
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to confirm typography and finalize brand kit."
      );
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  const logoTypeRole = roles.find((r) => r.roleName === "Logo type");
  const headingRole = roles.find((r) => r.roleName === "Heading");
  const bodyRole = roles.find((r) => r.roleName === "Body");
  const buttonRole = roles.find((r) => r.roleName === "Button & label");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="typography-system-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl rounded-2xl bg-card shadow-2xl border border-border flex flex-col max-h-[92vh] overflow-hidden text-card-foreground">
        
        {/* Header & 6-Step Workflow Track (Figma Node 57004:11793) */}
        <ModalWorkflowHeader
          title="Your typography"
          subtitle="Two families, four roles. The display face carries personality; the text face carries everything people actually read."
          currentStep={6}
          onClose={onClose}
          headerActions={
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegeneratePairing}
              disabled={isRegenerating || isCapExhausted}
              className="gap-2 text-xs font-mono font-medium h-8 border-border bg-background hover:bg-muted/60"
            >
              <RefreshCw
                className={`size-3.5 text-muted-foreground ${
                  isRegenerating ? "animate-spin text-primary" : ""
                }`}
              />
              <span>Suggest other pairings</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                {Math.max(0, 3 - regenerateCount)}/3 LEFT
              </span>
            </Button>
          }
        />

        {/* Error Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {insufficientCredits && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0 text-amber-600" />
              <span>Insufficient AI credits to suggest alternative pairings.</span>
            </div>
            <Link
              href="/dashboard/creator/billing"
              target="_blank"
              className="font-bold underline ml-3 shrink-0 hover:text-amber-700"
            >
              Top up credits
            </Link>
          </div>
        )}

        {/* Modal Scrolling Body */}
        <div className="p-6 overflow-y-auto space-y-7">
          
          {/* SECTION A: PAIRING CHOICE ("PICK A PAIRING") */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                  PICK A PAIRING
                </span>
                <span className="hidden sm:inline text-xs text-muted-foreground">·</span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  DISPLAY FAMILY: <strong className="text-foreground font-semibold">{displayFamilyName}</strong> · TEXT FAMILY: <strong className="text-foreground font-semibold">{textFamilyName}</strong>
                </span>
              </div>

              <span className="text-xs font-mono text-muted-foreground">
                Tuning below updates automatically
              </span>
            </div>

            {/* 3 Pairing Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {CANONICAL_PAIRING_PRESETS.map((preset) => {
                const isSelected = selectedPairingId === preset.id;

                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPairing(preset)}
                    className={`group relative flex flex-col rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
                      isSelected
                        ? "border-primary bg-card shadow-sm ring-1 ring-primary/40"
                        : "border-border/80 bg-card hover:border-border hover:shadow-xs"
                    }`}
                  >
                    {/* Top Specimen Band (130px tall) */}
                    <div className="h-[130px] p-4 bg-muted/40 flex flex-col justify-center gap-1.5 relative border-b border-border/60">
                      {isSelected && (
                        <div className="absolute top-3 right-3 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
                          <Check className="size-3 stroke-[3]" />
                        </div>
                      )}

                      <h4
                        className="text-2xl sm:text-[28px] font-bold tracking-tight text-foreground truncate"
                        style={{ fontFamily: preset.display }}
                      >
                        {brandName}
                      </h4>
                      <p
                        className="text-xs font-sans text-muted-foreground line-clamp-2 leading-relaxed"
                        style={{ fontFamily: preset.text }}
                      >
                        {brandTagline}
                      </p>
                    </div>

                    {/* Card Body */}
                    <div className="p-4 flex flex-col justify-between flex-1 gap-3">
                      <div>
                        <span className="text-sm font-bold font-mono text-foreground block">
                          {preset.display} + {preset.text}
                        </span>
                        <p className="text-xs font-sans text-muted-foreground mt-1 leading-normal">
                          {preset.description}
                        </p>
                      </div>

                      {/* Footer Metadata */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-[10px] font-mono text-muted-foreground">
                        <span>{preset.license}</span>
                        <span>·</span>
                        <span>{preset.weightCount} weights</span>
                        <span>·</span>
                        <span>{preset.bundleKb}kb</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION B: FOUR ROLES SPECIMEN EDITOR ("FOUR ROLES") */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                FOUR ROLES
              </span>
              <span className="text-xs font-mono text-muted-foreground">
                Tuning is free
              </span>
            </div>

            {/* Single Unified 4-Row Card */}
            <div className="rounded-xl border border-border bg-card divide-y divide-border/80 overflow-hidden shadow-2xs">
              
              {/* ROW 1: Logo type (LOCKED STATE) */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
                <div className="space-y-1 max-w-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold font-heading text-foreground">
                      Logo type
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/80">
                      <Lock className="size-2.5" /> LOCKED
                    </span>
                  </div>
                  <p className="text-xs font-sans text-muted-foreground leading-normal">
                    Locked to your wordmark. Changing this would redraw your logo.
                  </p>
                  <span className="text-[10px] font-mono text-muted-foreground block pt-0.5">
                    Bound to approved logo concept
                  </span>
                </div>

                {/* Right Specimen */}
                <div className="flex-1 flex flex-col items-start md:items-end gap-1.5 min-w-[280px]">
                  <span className="text-xs font-mono text-muted-foreground">
                    {displayFamilyName} · Bold · {logoTypeRole?.size || "40px"} / {logoTypeRole?.lineHeight || "1.1"}
                  </span>
                  <div
                    className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground"
                    style={{ fontFamily: displayFamilyName }}
                  >
                    {brandName}
                  </div>
                </div>
              </div>

              {/* ROW 2: Heading */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                <div className="space-y-1 max-w-xs">
                  <span className="text-base font-bold font-heading text-foreground block">
                    Heading
                  </span>
                  <p className="text-xs font-sans text-muted-foreground leading-normal">
                    Page titles, section headers, deck slides.
                  </p>
                  
                  {/* Step Font Controls */}
                  <div className="flex items-center gap-2 pt-2">
                    <label className="text-[10px] font-mono text-muted-foreground">
                      Heading font weight:
                    </label>
                    <select
                      aria-label="Heading font weight"
                      value={headingRole?.weight || "700"}
                      onChange={(e) => handleTuningChange("Heading", { weight: e.target.value })}
                      className="text-xs font-mono rounded-md border border-border bg-background px-2 py-1 text-foreground"
                    >
                      <option value="400">Regular (400)</option>
                      <option value="600">SemiBold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">ExtraBold (800)</option>
                    </select>
                  </div>
                </div>

                {/* Right Specimen */}
                <div className="flex-1 flex flex-col items-start md:items-end gap-1.5 min-w-[280px]">
                  <span className="text-xs font-mono text-muted-foreground">
                    {displayFamilyName} · {headingRole?.weight === "800" ? "ExtraBold" : headingRole?.weight === "600" ? "SemiBold" : "Bold"} · {headingRole?.size || "40px"} / {headingRole?.lineHeight || "1.2"}
                  </span>
                  <div
                    className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-snug md:text-right"
                    style={{
                      fontFamily: displayFamilyName,
                      fontWeight: headingRole?.weight || "700",
                    }}
                  >
                    {brandTagline}
                  </div>
                </div>
              </div>

              {/* ROW 3: Body */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                <div className="space-y-1 max-w-xs">
                  <span className="text-base font-bold font-heading text-foreground block">
                    Body
                  </span>
                  <p className="text-xs font-sans text-muted-foreground leading-normal">
                    Paragraph copy, descriptions, customer communication.
                  </p>

                  {/* Step Font Controls */}
                  <div className="flex items-center gap-2 pt-2">
                    <label className="text-[10px] font-mono text-muted-foreground">
                      Body font weight:
                    </label>
                    <select
                      aria-label="Body font weight"
                      value={bodyRole?.weight || "400"}
                      onChange={(e) => handleTuningChange("Body", { weight: e.target.value })}
                      className="text-xs font-mono rounded-md border border-border bg-background px-2 py-1 text-foreground"
                    >
                      <option value="400">Regular (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">SemiBold (600)</option>
                    </select>
                  </div>
                </div>

                {/* Right Specimen */}
                <div className="flex-1 flex flex-col items-start md:items-end gap-1.5 min-w-[280px]">
                  <span className="text-xs font-mono text-muted-foreground">
                    {textFamilyName} · Regular · {bodyRole?.size || "16px"} / {bodyRole?.lineHeight || "1.5"}
                  </span>
                  <p
                    className="text-sm font-sans text-muted-foreground leading-relaxed max-w-md md:text-right"
                    style={{
                      fontFamily: textFamilyName,
                      fontWeight: bodyRole?.weight || "400",
                    }}
                  >
                    Crafted specifically for autonomous workflows. Clean typography hierarchy ensures complete legibility across high-density creator dashboards.
                  </p>
                </div>
              </div>

              {/* ROW 4: Button & label */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                <div className="space-y-1 max-w-xs">
                  <span className="text-base font-bold font-heading text-foreground block">
                    Button & label
                  </span>
                  <p className="text-xs font-sans text-muted-foreground leading-normal">
                    Action triggers, badges, navigation items, metrics.
                  </p>
                </div>

                {/* Right Specimen */}
                <div className="flex-1 flex flex-col items-start md:items-end gap-2.5 min-w-[280px]">
                  <span className="text-xs font-mono text-muted-foreground">
                    {textFamilyName} · Medium · {buttonRole?.size || "14px"} / {buttonRole?.lineHeight || "1.0"}
                  </span>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-xs"
                      style={{ fontFamily: textFamilyName }}
                    >
                      Explore {brandName}
                    </button>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      style={{ fontFamily: textFamilyName }}
                    >
                      ● Active Network
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Modal Footer (Figma Node 57004:11793) */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-card shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Info className="size-3.5 text-primary shrink-0" />
            <span>2 Font Families · 4 Canonical Roles · Zero Credit Hand-Tuning</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isConfirming}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isConfirming || isPending}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5"
            >
              <span>{isConfirming ? "Finalizing Kit..." : "Confirm & Complete Brand Kit"}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

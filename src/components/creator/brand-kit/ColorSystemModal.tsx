"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BrandKit, BrandColorRole } from "@/types/creator/brand-kit";
import { brandKitApi } from "@/lib/api-creator-brand-kit";
import { creatorAiApi } from "@/lib/api-creator-ai";
import { resolveMediaUrl } from "@/lib/brand-kit-media";
import { ModalWorkflowHeader } from "./ModalWorkflowHeader";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Check,
  Copy,
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  SlidersHorizontal,
  Info,
  Sliders,
  FileText,
  Layout,
  Presentation,
  Palette,
  Sparkles,
  Loader2,
} from "lucide-react";

export interface ColorSystemModalProps {
  isOpen: boolean;
  ideaId?: string;
  kit: BrandKit;
  onClose: () => void;
  onSuccess: (updatedKit: BrandKit) => void;
}

type PaletteMood = "as_generated" | "calmer" | "warmer" | "higher_contrast";
type PreviewTab = "website" | "invoice" | "deck";

// Canonical role default usage notes from Figma Node 57004:11484
const CANONICAL_ROLE_NOTES: Record<string, string> = {
  Primary: "Buttons, links, the one thing you want clicked.",
  Secondary: "Headlines, navigation, dense text areas.",
  Accent: "Highlights, badges, small emphasis only.",
  Background: "Page and surface background.",
  Text: "Body copy on background.",
};

// Deterministic client-side contrast evaluator matching server-side WcagContrastCalculator
function calculateLuminance(r: number, g: number, b: number): number {
  const linearize = (val: number) =>
    val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  return (
    0.2126 * linearize(r / 255) +
    0.7152 * linearize(g / 255) +
    0.0722 * linearize(b / 255)
  );
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }
  return null;
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function computeWcagContrast(
  fgHex: string,
  bgHex: string,
  isAccentOrLarge = false
): { ratio: number; verdict: string } {
  const fgRgb = hexToRgb(fgHex);
  const bgRgb = hexToRgb(bgHex);
  if (!fgRgb || !bgRgb) return { ratio: 1.0, verdict: "FAIL" };

  const fgLum = calculateLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
  const bgLum = calculateLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

  const lighter = Math.max(fgLum, bgLum);
  const darker = Math.min(fgLum, bgLum);
  const rawRatio = (lighter + 0.05) / (darker + 0.05);
  const ratio = Math.round(rawRatio * 10) / 10;

  let verdict = "FAIL";
  if (ratio >= 7.0) {
    verdict = "AAA";
  } else if (ratio >= 4.5) {
    verdict = "AA";
  } else if (ratio >= 3.0 && isAccentOrLarge) {
    verdict = "AA_Large";
  }

  return { ratio, verdict };
}

// Adjust HSL for mood variant tuning
function adjustHsl(
  hex: string,
  mood: PaletteMood
): { hex: string; rgb: string } {
  const rgb = hexToRgb(hex);
  if (!rgb) return { hex, rgb: "0, 0, 0" };

  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  // Apply mood transformations
  if (mood === "calmer") {
    s = Math.max(0.05, s * 0.7); // Desaturate slightly
  } else if (mood === "warmer") {
    h = (h + 0.03) % 1.0; // Warm shift towards red/amber
    s = Math.min(1.0, s * 1.1);
  } else if (mood === "higher_contrast") {
    l = l < 0.5 ? Math.max(0.08, l * 0.75) : Math.min(0.95, l * 1.15); // Push darks darker, lights lighter
  }

  // Convert HSL back to RGB
  let outR: number, outG: number, outB: number;
  if (s === 0) {
    outR = outG = outB = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    outR = hue2rgb(p, q, h + 1 / 3);
    outG = hue2rgb(p, q, h);
    outB = hue2rgb(p, q, h - 1 / 3);
  }

  const newHex = rgbToHex(outR * 255, outG * 255, outB * 255);
  const newRgb = `${Math.round(outR * 255)}, ${Math.round(outG * 255)}, ${Math.round(outB * 255)}`;
  return { hex: newHex, rgb: newRgb };
}

export function ColorSystemModal({
  isOpen,
  ideaId,
  kit,
  onClose,
  onSuccess,
}: ColorSystemModalProps) {
  const [currentKit, setCurrentKit] = useState<BrandKit>(kit);
  const [roles, setRoles] = useState<BrandColorRole[]>(kit.colors?.roles ?? []);
  const [regenerateCount, setRegenerateCount] = useState<number>(
    kit.colors?.regenerateCount ?? 0
  );
  const [selectedMood, setSelectedMood] = useState<PaletteMood>("as_generated");
  const [previewTab, setPreviewTab] = useState<PreviewTab>("website");

  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [copiedRole, setCopiedRole] = useState<string | null>(null);
  const [colorCost, setColorCost] = useState<number>(2);

  useEffect(() => {
    creatorAiApi
      .getCredits()
      .then((res) => {
        if (res?.costs?.ColorGeneration != null) {
          setColorCost(res.costs.ColorGeneration);
        }
      })
      .catch(() => {});
  }, []);

  // Background hex reference for contrast calculation
  const backgroundHex = useMemo(() => {
    return (
      roles.find((r) => r.roleName === "Background")?.hex || "#FFFFFF"
    );
  }, [roles]);

  // Brand Name from strategy
  const brandName = useMemo(() => {
    return (
      currentKit.strategy?.nameDisplayForm ||
      currentKit.strategy?.businessName ||
      "Brand"
    );
  }, [currentKit]);

  // Logo mark from Step 4
  const logoMarkUri = useMemo(() => {
    let rawUri: string | null = null;
    if (currentKit.logo?.selectedConceptKey) {
      const concept = currentKit.logo.concepts?.find(
        (c) => c.key === currentKit.logo?.selectedConceptKey
      );
      if (concept?.markAssetUri) rawUri = concept.markAssetUri;
    }
    if (!rawUri) {
      rawUri = currentKit.logo?.variations?.["primary"]?.svgUri || null;
    }
    return rawUri ? resolveMediaUrl(rawUri, currentKit.version) : null;
  }, [currentKit.logo, currentKit.version]);

  // 1. Initial State Population (No Auto-Generate)
  useEffect(() => {
    if ((kit.colors?.roles?.length ?? 0) >= 5) {
      setRoles(kit.colors!.roles);
      setRegenerateCount(kit.colors?.regenerateCount ?? 0);
    } else {
      setRoles([]);
      setRegenerateCount(kit.colors?.regenerateCount ?? 0);
    }
  }, [ideaId, kit]);

  // 2. Copy Hex Utility
  const handleCopyHex = (e: React.MouseEvent, hex: string, roleName: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(hex);
    setCopiedRole(roleName);
    setTimeout(() => setCopiedRole(null), 1500);
  };

  // 3. Lock Toggle Handler (Data-driven for all 5 roles, Free)
  const handleToggleLock = async (roleName: string) => {
    const target = roles.find((r) => r.roleName === roleName);
    if (!target) return;

    const newLockState = !target.isLocked;
    const updatedRoles = roles.map((r) =>
      r.roleName === roleName ? { ...r, isLocked: newLockState } : r
    );
    setRoles(updatedRoles);

    try {
      const updated = await brandKitApi.patchColors(
        {
          roles: [{ roleName, isLocked: newLockState }],
        },
        ideaId,
        currentKit.version
      );
      setCurrentKit(updated);
    } catch (err: any) {
      // Revert on error
      setRoles(roles);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update role lock state."
      );
    }
  };

  // 4. Per-Role Hex Edit Handler (Free, Uncapped)
  const handleRoleHexChange = async (roleName: string, rawHex: string) => {
    let cleanHex = rawHex.trim();
    if (!cleanHex.startsWith("#")) cleanHex = `#${cleanHex}`;
    if (!/^#[0-9A-Fa-f]{6}$/.test(cleanHex)) return; // Only process valid 6-hex strings

    const rgbObj = hexToRgb(cleanHex);
    if (!rgbObj) return;
    const rgbStr = `${rgbObj.r}, ${rgbObj.g}, ${rgbObj.b}`;

    const isAccentOrLarge = roleName === "Accent";
    const { ratio, verdict } =
      roleName === "Background"
        ? { ratio: null, verdict: null }
        : computeWcagContrast(cleanHex, backgroundHex, isAccentOrLarge);

    const updatedRoles = roles.map((r) =>
      r.roleName === roleName
        ? {
            ...r,
            hex: cleanHex.toUpperCase(),
            rgb: rgbStr,
            contrastRatio: ratio,
            contrastVerdict: verdict,
            provenance: "user_edited",
          }
        : r
    );

    setRoles(updatedRoles);

    try {
      const updated = await brandKitApi.patchColors(
        {
          roles: [
            {
              roleName,
              hex: cleanHex.toUpperCase(),
              rgb: rgbStr,
              contrastRatio: ratio,
              contrastVerdict: verdict,
              provenance: "user_edited",
            },
          ],
        },
        ideaId,
        currentKit.version
      );
      setCurrentKit(updated);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save custom color."
      );
    }
  };

  // 5. Palette Mood Selection & Persistence
  const handleSelectMood = async (mood: PaletteMood) => {
    setSelectedMood(mood);
    if (mood === "as_generated") {
      // Reload baseline roles from currentKit
      if (currentKit.colors?.roles) {
        setRoles(currentKit.colors.roles);
      }
      return;
    }

    // Apply mood adjustment to all unlocked foreground roles
    const patchPayload: Array<{
      roleName: string;
      hex: string;
      rgb: string;
      contrastRatio: number | null;
      contrastVerdict: string | null;
      provenance: string;
    }> = [];

    const updatedRoles = roles.map((role) => {
      if (role.isLocked || role.roleName === "Background") return role;

      const adjusted = adjustHsl(role.hex, mood);
      const isAccentOrLarge = role.roleName === "Accent";
      const { ratio, verdict } = computeWcagContrast(
        adjusted.hex,
        backgroundHex,
        isAccentOrLarge
      );

      const updatedRole = {
        ...role,
        hex: adjusted.hex,
        rgb: adjusted.rgb,
        contrastRatio: ratio,
        contrastVerdict: verdict,
        provenance: "user_tuned",
      };

      patchPayload.push({
        roleName: role.roleName,
        hex: adjusted.hex,
        rgb: adjusted.rgb,
        contrastRatio: ratio,
        contrastVerdict: verdict,
        provenance: "user_tuned",
      });

      return updatedRole;
    });

    setRoles(updatedRoles);

    try {
      const updated = await brandKitApi.patchColors(
        { roles: patchPayload },
        ideaId,
        currentKit.version
      );
      setCurrentKit(updated);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to persist mood variant."
      );
    }
  };

  // 6. Initial Generation (Paid)
  const handleGenerateInitial = async () => {
    try {
      setIsLoadingInitial(true);
      setError(null);
      setCreditError(null);

      const updated = await brandKitApi.generateColors(
        ideaId,
        currentKit.version
      );
      setCurrentKit(updated);
      setRoles(updated.colors?.roles ?? []);
      setRegenerateCount(updated.colors?.regenerateCount ?? 0);
      setSelectedMood("as_generated");
    } catch (err: any) {
      if (err?.response?.status === 402) {
        setCreditError(
          `Insufficient AI credits to generate colour system (${colorCost} credits required). Please top up credits to continue.`
        );
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Colour system generation did not finish."
        );
      }
    } finally {
      setIsLoadingInitial(false);
    }
  };

  // 7. Whole-Palette Regeneration (Paid, 3-Cap)
  const handleRegeneratePalette = async () => {
    if (regenerateCount >= 3) return;

    try {
      setIsRegenerating(true);
      setError(null);
      setCreditError(null);

      const updated = await brandKitApi.regenerateColors(
        ideaId,
        currentKit.version
      );
      setCurrentKit(updated);
      setRoles(updated.colors?.roles ?? []);
      setRegenerateCount(updated.colors?.regenerateCount ?? 0);
      setSelectedMood("as_generated");
    } catch (err: any) {
      if (err?.response?.status === 402) {
        setCreditError(
          `Insufficient AI credits to regenerate palette (${colorCost} credits required). Please top up credits to continue.`
        );
      } else {
        setError(
          `Colour palette regeneration did not finish. Your ${colorCost} credits have been automatically refunded to your balance.`
        );
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  // 8. Confirm Step
  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      setError(null);

      const updated = await brandKitApi.patchColors(
        {
          roles: roles.map((r) => ({
            roleName: r.roleName,
            hex: r.hex,
            rgb: r.rgb,
            contrastRatio: r.contrastRatio,
            contrastVerdict: r.contrastVerdict,
            usageNote: r.usageNote || CANONICAL_ROLE_NOTES[r.roleName] || "",
            isLocked: r.isLocked,
            provenance: r.provenance,
          })),
          confirmedAt: new Date().toISOString(),
        },
        ideaId,
        currentKit.version
      );
      setCurrentKit(updated);
      onSuccess(updated);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save color system."
      );
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  // Helper to render contrast badge
  const renderContrastBadge = (role: BrandColorRole) => {
    if (role.roleName === "Background") {
      return (
        <span className="text-xs font-mono text-muted-foreground">
          Used as a ground, not for text.
        </span>
      );
    }

    const verdict = role.contrastVerdict?.toUpperCase();
    const ratio = role.contrastRatio ? `${role.contrastRatio}:1` : "—";

    if (verdict === "AAA") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="size-3.5" />
          {ratio} AAA
        </span>
      );
    }

    if (verdict === "AA" || verdict === "AA_LARGE") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
          <ShieldCheck className="size-3.5" />
          {ratio} {verdict === "AA_LARGE" ? "AA Large" : "AA"}
        </span>
      );
    }

    if (verdict === "FAIL") {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="size-3.5" />
          {ratio} FAIL
        </span>
      );
    }

    return (
      <span className="text-xs font-mono text-muted-foreground">
        {ratio}
      </span>
    );
  };

  // Find colors for preview
  const primaryColor = roles.find((r) => r.roleName === "Primary")?.hex || "#3C61DD";
  const secondaryColor = roles.find((r) => r.roleName === "Secondary")?.hex || "#0E1726";
  const accentColor = roles.find((r) => r.roleName === "Accent")?.hex || "#6366F1";
  const bgColor = roles.find((r) => r.roleName === "Background")?.hex || "#F8F9FB";
  const textColor = roles.find((r) => r.roleName === "Text")?.hex || "#111827";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="color-system-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl rounded-2xl bg-card shadow-2xl border border-border flex flex-col max-h-[92vh] overflow-hidden text-card-foreground">
        
        {/* Header & 6-Step Workflow Track (Figma Node 57004:11484) */}
        <ModalWorkflowHeader
          title="Your colour system"
          subtitle="Five roles pulled from your logo. Each one has a job — change any of them without touching the rest."
          currentStep={5}
          onClose={onClose}
          headerActions={
            roles.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegeneratePalette}
                disabled={isRegenerating || regenerateCount >= 3}
                className="gap-2 text-xs font-mono font-medium h-8 border-border bg-background hover:bg-muted/60"
              >
                <RefreshCw className={`size-3.5 text-muted-foreground ${isRegenerating ? "animate-spin text-primary" : ""}`} />
                <span>Regenerate Palette</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {Math.max(0, 3 - regenerateCount)}/3 LEFT
                </span>
              </Button>
            ) : undefined
          }
        />

        {/* Error Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {creditError && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-amber-600" />
              <span>{creditError}</span>
            </div>
            <a
              href="/dashboard/creator/billing"
              target="_blank"
              className="font-bold underline ml-3 shrink-0 hover:text-amber-700"
            >
              Top up credits
            </a>
          </div>
        )}

        {/* Modal Scrolling Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {roles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-8">
              <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
                <Palette className="size-8" />
              </div>
              <h3 className="font-heading text-lg font-bold tracking-tight mb-2">
                Generate Colour System
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-md">
                Generate a 5-role colour palette (Primary, Secondary, Accent, Background, and Text) derived from your brand direction and logo, tuned for accessible contrast.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-xs font-mono font-medium text-primary mb-6">
                <Sparkles className="size-3.5" />
                <span>Cost: {colorCost} AI credits</span>
              </div>
              <Button
                size="lg"
                onClick={handleGenerateInitial}
                disabled={isLoadingInitial}
                className="gap-2 font-mono text-sm px-6 shadow-sm"
              >
                {isLoadingInitial ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Generating colour system...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>Generate Colour System ({colorCost} credits)</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* VARIANT ROW: Palette Mood Filter Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/30 border border-border/80">
                <div className="flex items-center gap-2.5">
                  <SlidersHorizontal className="size-4 text-muted-foreground shrink-0" />
                  <span className="text-[11px] font-mono font-bold tracking-wider text-muted-foreground uppercase">
                    PALETTE MOOD:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(
                      [
                        { key: "as_generated", label: "As generated" },
                        { key: "calmer", label: "Calmer" },
                        { key: "warmer", label: "Warmer" },
                        { key: "higher_contrast", label: "Higher contrast" },
                      ] as const
                    ).map((mood) => (
                      <button
                        key={mood.key}
                        type="button"
                        onClick={() => handleSelectMood(mood.key)}
                        className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                          selectedMood === mood.key
                            ? "bg-foreground text-background shadow-xs font-semibold"
                            : "bg-background text-foreground/80 hover:bg-muted border border-border/80"
                        }`}
                      >
                        {mood.label}
                      </button>
                    ))}
                  </div>
                </div>

                <span className="text-xs font-mono text-muted-foreground">
                  Switching mood is free — it doesn't use a regenerate.
                </span>
              </div>

              {/* SECTION A: 5 CANONICAL ROLE ROWS (Figma Node 57004:11484) */}
              <div className="rounded-xl border border-border bg-card divide-y divide-border/80 overflow-hidden shadow-2xs">
                {roles.map((role) => {
                  const isPrimary = role.roleName === "Primary";
                  const isSecondary = role.roleName === "Secondary";
                  const isAccent = role.roleName === "Accent";
                  const isBg = role.roleName === "Background";
                  const isEdited = role.provenance === "user_edited" || role.provenance === "user_tuned";

                  const usageNote =
                    role.usageNote ||
                    CANONICAL_ROLE_NOTES[role.roleName] ||
                    `Canonical ${role.roleName.toLowerCase()} brand tone`;

                  return (
                    <div
                      key={role.roleName}
                      className={`group relative flex flex-col md:flex-row md:items-center justify-between p-4.5 gap-4 transition-colors ${
                        isAccent && isEdited
                          ? "bg-primary/5 border-l-2 border-l-primary"
                          : "hover:bg-muted/30"
                      }`}
                    >
                  {/* Left: 68x68 Swatch Well + Text Block */}
                  <div className="flex items-center gap-4 min-w-[280px]">
                    {/* 68x68 Swatch Well */}
                    <div
                      className={`relative size-[68px] rounded-xl border shrink-0 overflow-hidden shadow-2xs group/swatch cursor-pointer ${
                        isBg ? "border-black/15 shadow-inner" : "border-black/10"
                      }`}
                      title="Click to pick custom color"
                    >
                      <div
                        className="w-full h-full transition-transform group-hover/swatch:scale-105"
                        style={{ backgroundColor: role.hex }}
                      />
                      {/* Interactive Color Input overlay */}
                      <input
                        type="color"
                        value={role.hex}
                        onChange={(e) => handleRoleHexChange(role.roleName, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title="Click to adjust color"
                      />
                    </div>

                    {/* Text Block */}
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold font-heading text-foreground">
                          {role.roleName}
                        </span>

                        {isPrimary && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            Core Brand
                          </span>
                        )}

                        {role.isLocked && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/80">
                            <Lock className="size-2.5" /> LOCKED
                          </span>
                        )}

                        {isEdited && !role.isLocked && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 uppercase">
                            EDITED
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-sans text-muted-foreground leading-normal max-w-sm">
                        {usageNote}
                      </p>
                    </div>
                  </div>

                  {/* Center: Values Block (HEX + RGB) */}
                  <div className="flex items-center gap-6 min-w-[200px]">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold font-mono text-foreground tracking-wide">
                          {role.hex}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyHex(e, role.hex, role.roleName)}
                          className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors hover:bg-muted"
                          title="Copy Hex"
                        >
                          {copiedRole === role.roleName ? (
                            <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="size-3.5" />
                          )}
                        </button>
                      </div>
                      <span className="text-xs font-mono text-muted-foreground">
                        RGB {role.rgb || hexToRgb(role.hex) ? `${hexToRgb(role.hex)?.r}, ${hexToRgb(role.hex)?.g}, ${hexToRgb(role.hex)?.b}` : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Contrast Block */}
                  <div className="flex items-center justify-start md:justify-center min-w-[140px]">
                    {renderContrastBadge(role)}
                  </div>

                  {/* Right: Control Cluster (Adjust, Copy, Lock) */}
                  <div className="flex items-center gap-1.5 justify-end">
                    {/* Sliders / Color Picker Trigger */}
                    <label
                      className="relative p-2 rounded-lg border border-border/80 bg-background hover:bg-muted cursor-pointer transition-colors text-muted-foreground hover:text-foreground group/slider"
                      title="Adjust this role only — free"
                    >
                      <Sliders className="size-3.5" />
                      <input
                        type="color"
                        value={role.hex}
                        onChange={(e) => handleRoleHexChange(role.roleName, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>

                    {/* Copy Button */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyHex(e, role.hex, role.roleName)}
                      className="p-2 rounded-lg border border-border/80 bg-background hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title="Copy Hex"
                    >
                      {copiedRole === role.roleName ? (
                        <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>

                    {/* Lock Toggle Affordance */}
                    <button
                      type="button"
                      onClick={() => handleToggleLock(role.roleName)}
                      className={`p-2 rounded-lg border transition-colors ${
                        role.isLocked
                          ? "bg-foreground text-background border-foreground shadow-2xs font-bold"
                          : "bg-background text-muted-foreground hover:text-foreground border-border/80 hover:bg-muted"
                      }`}
                      title={
                        role.isLocked
                          ? "Role is locked against palette regeneration"
                          : "Lock role against palette regeneration"
                      }
                    >
                      {role.isLocked ? (
                        <Lock className="size-3.5" />
                      ) : (
                        <Unlock className="size-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SECTION B: LIVE APPLICATION PREVIEW ("How it looks together", Figma Node 57004:11484) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold font-heading text-foreground">
                How it looks together
              </h3>

              {/* Segmented control: Website, Invoice, Deck */}
              <div className="flex items-center p-1 rounded-lg bg-muted border border-border/80">
                {(
                  [
                    { key: "website", label: "Website", icon: Layout },
                    { key: "invoice", label: "Invoice", icon: FileText },
                    { key: "deck", label: "Deck", icon: Presentation },
                  ] as const
                ).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setPreviewTab(tab.key)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono font-medium transition-all ${
                        previewTab === tab.key
                          ? "bg-background text-foreground shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="size-3" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 220px tall preview band filled with Background role colour */}
            <div
              className="h-[220px] rounded-xl border border-border/80 p-6 flex flex-col justify-between overflow-hidden relative shadow-inner transition-colors duration-200"
              style={{ backgroundColor: bgColor }}
            >
              {previewTab === "website" && (
                <div className="flex flex-col justify-between h-full">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between pb-3 border-b border-black/10">
                    <div className="flex items-center gap-2">
                      {logoMarkUri ? (
                        <div
                          className="size-5 rounded-md flex items-center justify-center p-0.5 overflow-hidden"
                          style={{ backgroundColor: `${primaryColor}20`, border: `1px solid ${primaryColor}40` }}
                        >
                          <img src={logoMarkUri} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div
                          className="size-5 rounded-md flex items-center justify-center font-bold text-xs"
                          style={{ backgroundColor: primaryColor, color: bgColor }}
                        >
                          {brandName.charAt(0)}
                        </div>
                      )}
                      <span
                        className="text-xs font-bold font-heading"
                        style={{ color: secondaryColor }}
                      >
                        {brandName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] font-medium" style={{ color: textColor }}>
                      <span className="opacity-80">Platform</span>
                      <span className="opacity-80">Solutions</span>
                      <span className="opacity-80">Pricing</span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{
                          backgroundColor: `${accentColor}15`,
                          color: accentColor,
                          border: `1px solid ${accentColor}30`,
                        }}
                      >
                        Live Network
                      </span>
                    </div>
                  </div>

                  {/* Hero Body */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                    <div className="space-y-1">
                      <h4
                        className="text-lg font-bold font-heading tracking-tight leading-snug"
                        style={{ color: textColor }}
                      >
                        Empowering Next-Gen Autonomous Systems
                      </h4>
                      <p
                        className="text-xs font-sans max-w-md leading-relaxed"
                        style={{ color: textColor, opacity: 0.75 }}
                      >
                        Engineered with pure contrast harmony, live WCAG 2.1 compliance, and verified enterprise security.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        className="px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-opacity hover:opacity-90"
                        style={{ backgroundColor: primaryColor, color: bgColor }}
                      >
                        Get Started
                      </button>
                      <button
                        type="button"
                        className="px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors"
                        style={{
                          backgroundColor: "transparent",
                          color: textColor,
                          borderColor: `${textColor}30`,
                        }}
                      >
                        Documentation
                      </button>
                    </div>
                  </div>

                  {/* Footer Stats Strip */}
                  <div className="flex items-center gap-6 pt-2 border-t border-black/10 text-[10px] font-mono" style={{ color: textColor, opacity: 0.65 }}>
                    <span>99.99% Uptime SLA</span>
                    <span>·</span>
                    <span>Zero-Trust Architecture</span>
                    <span>·</span>
                    <span>Global Edge Deployments</span>
                  </div>
                </div>
              )}

              {previewTab === "invoice" && (
                <div className="flex flex-col justify-between h-full text-xs">
                  {/* Invoice Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-black/10">
                    <div className="flex items-center gap-2">
                      {logoMarkUri ? (
                        <div
                          className="size-5 rounded-md flex items-center justify-center p-0.5 overflow-hidden"
                          style={{ backgroundColor: `${primaryColor}20`, border: `1px solid ${primaryColor}40` }}
                        >
                          <img src={logoMarkUri} alt="Logo" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div
                          className="size-5 rounded-md flex items-center justify-center font-bold text-xs"
                          style={{ backgroundColor: primaryColor, color: bgColor }}
                        >
                          {brandName.charAt(0)}
                        </div>
                      )}
                      <span className="font-bold text-sm font-heading" style={{ color: secondaryColor }}>
                        {brandName} Technologies Inc.
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px]" style={{ color: textColor, opacity: 0.7 }}>
                        #INV-2026-089
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{
                          backgroundColor: `${accentColor}15`,
                          color: accentColor,
                          border: `1px solid ${accentColor}30`,
                        }}
                      >
                        PAID
                      </span>
                    </div>
                  </div>

                  {/* Line Items Table */}
                  <div className="space-y-1.5 py-2">
                    <div className="flex justify-between font-mono text-[11px] pb-1 border-b border-black/5" style={{ color: textColor, opacity: 0.6 }}>
                      <span>DESCRIPTION</span>
                      <span>AMOUNT</span>
                    </div>
                    <div className="flex justify-between font-medium text-xs" style={{ color: textColor }}>
                      <span>Enterprise Platform Subscription (Annual)</span>
                      <span className="font-mono font-bold">$12,000.00</span>
                    </div>
                    <div className="flex justify-between font-medium text-xs" style={{ color: textColor }}>
                      <span>Dedicated Edge Compute Cluster</span>
                      <span className="font-mono font-bold">$3,500.00</span>
                    </div>
                  </div>

                  {/* Invoice Total */}
                  <div className="flex items-center justify-between pt-2 border-t border-black/10">
                    <span className="text-[11px] font-mono" style={{ color: textColor, opacity: 0.7 }}>
                      DUE UPON RECEIPT
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: textColor }}>
                        TOTAL:
                      </span>
                      <span
                        className="text-base font-bold font-mono"
                        style={{ color: primaryColor }}
                      >
                        $15,500.00 USD
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {previewTab === "deck" && (
                <div className="flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                        style={{
                          backgroundColor: `${accentColor}15`,
                          color: accentColor,
                          border: `1px solid ${accentColor}30`,
                        }}
                      >
                        EXECUTIVE SUMMARY
                      </span>
                      <span className="text-xs font-mono" style={{ color: textColor, opacity: 0.5 }}>
                        SLIDE 04
                      </span>
                    </div>

                    <span className="text-xs font-bold font-heading" style={{ color: secondaryColor }}>
                      {brandName}
                    </span>
                  </div>

                  <div className="space-y-1.5 py-1">
                    <h4
                      className="text-xl font-bold font-heading tracking-tight"
                      style={{ color: textColor }}
                    >
                      Accelerating Market Adoption with Autonomous Value
                    </h4>
                    <p className="text-xs max-w-lg leading-relaxed" style={{ color: textColor, opacity: 0.75 }}>
                      Capturing market share through deterministic infrastructure, unified APIs, and zero friction creator-to-investor liquidity.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-black/10">
                    <div
                      className="p-2.5 rounded-lg border flex flex-col"
                      style={{
                        backgroundColor: `${primaryColor}08`,
                        borderColor: `${primaryColor}20`,
                      }}
                    >
                      <span className="text-base font-bold font-mono" style={{ color: primaryColor }}>
                        +142%
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: textColor, opacity: 0.7 }}>
                        MoM Growth
                      </span>
                    </div>
                    <div
                      className="p-2.5 rounded-lg border flex flex-col"
                      style={{
                        backgroundColor: `${accentColor}08`,
                        borderColor: `${accentColor}20`,
                      }}
                    >
                      <span className="text-base font-bold font-mono" style={{ color: accentColor }}>
                        99.4%
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: textColor, opacity: 0.7 }}>
                        Retention Rate
                      </span>
                    </div>
                    <div
                      className="p-2.5 rounded-lg border flex flex-col"
                      style={{
                        backgroundColor: `${secondaryColor}08`,
                        borderColor: `${secondaryColor}20`,
                      }}
                    >
                      <span className="text-base font-bold font-mono" style={{ color: secondaryColor }}>
                        $4.2M
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: textColor, opacity: 0.7 }}>
                        Annual ARR Run-Rate
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

        </div>

        {/* Modal Footer (Figma Node 57004:11484) */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-card shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Info className="size-3.5 text-primary shrink-0" />
            <span>5 Canonical Roles · Free Hex Edits · 3-Cap Palette Regen</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isConfirming}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isConfirming || isLoadingInitial || roles.length === 0}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5"
            >
              <span>{isConfirming ? "Confirming..." : "Confirm Colour System"}</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}

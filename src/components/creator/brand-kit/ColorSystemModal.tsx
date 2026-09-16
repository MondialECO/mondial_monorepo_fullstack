"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { BrandKit, BrandColorRole } from "@/types/creator/brand-kit";
import { brandKitApi } from "@/lib/api-creator-brand-kit";
import { RegenerateCapBadge } from "./RegenerateCapBadge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
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
  Eye,
  Info,
} from "lucide-react";

export interface ColorSystemModalProps {
  isOpen: boolean;
  ideaId?: string;
  kit: BrandKit;
  onClose: () => void;
  onSuccess: (updatedKit: BrandKit) => void;
}

type PaletteMood = "as_generated" | "calmer" | "warmer" | "higher_contrast";

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

  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);
  const [copiedRole, setCopiedRole] = useState<string | null>(null);

  // Background hex reference for contrast calculation
  const backgroundHex = useMemo(() => {
    return (
      roles.find((r) => r.roleName === "Background")?.hex || "#FFFFFF"
    );
  }, [roles]);

  // 1. Initial Generation if roles missing
  useEffect(() => {
    let isMounted = true;
    if ((kit.colors?.roles?.length ?? 0) >= 5) {
      setRoles(kit.colors!.roles);
      setRegenerateCount(kit.colors?.regenerateCount ?? 0);
      return;
    }

    async function loadOrGenerateColors() {
      try {
        setIsLoadingInitial(true);
        setError(null);
        const updated = await brandKitApi.generateColors(ideaId, kit.version);
        if (!isMounted) return;
        setCurrentKit(updated);
        setRoles(updated.colors?.roles ?? []);
        setRegenerateCount(updated.colors?.regenerateCount ?? 0);
      } catch (err: any) {
        if (!isMounted) return;
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to generate initial color system."
        );
      } finally {
        if (isMounted) setIsLoadingInitial(false);
      }
    }

    loadOrGenerateColors();
    return () => {
      isMounted = false;
    };
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

  // 6. Whole-Palette Regeneration (Paid, 3-Cap)
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
          "Insufficient AI credits to regenerate palette. Please top up credits to continue."
        );
      } else {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to regenerate colour palette."
        );
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  // 7. Confirm Step
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
            usageNote: r.usageNote,
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
          "Failed to confirm colour system."
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
        <span className="text-[11px] font-mono text-muted-foreground">
          Used as a ground, not for text
        </span>
      );
    }

    const verdict = role.contrastVerdict?.toUpperCase();
    const ratio = role.contrastRatio ? `${role.contrastRatio}:1` : "—";

    if (verdict === "AAA") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="size-3" />
          {ratio} AAA
        </span>
      );
    }

    if (verdict === "AA" || verdict === "AA_LARGE") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
          <ShieldCheck className="size-3" />
          {ratio} {verdict === "AA_LARGE" ? "AA Large" : "AA"}
        </span>
      );
    }

    if (verdict === "FAIL") {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
          <AlertTriangle className="size-3" />
          {ratio} FAIL
        </span>
      );
    }

    return (
      <span className="text-[11px] font-mono text-muted-foreground">
        {ratio}
      </span>
    );
  };

  // Find colors for preview
  const primaryColor = roles.find((r) => r.roleName === "Primary")?.hex || "#0F172A";
  const secondaryColor = roles.find((r) => r.roleName === "Secondary")?.hex || "#3B82F6";
  const accentColor = roles.find((r) => r.roleName === "Accent")?.hex || "#10B981";
  const textColor = roles.find((r) => r.roleName === "Text")?.hex || "#09090B";
  const bgColor = roles.find((r) => r.roleName === "Background")?.hex || "#FFFFFF";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="color-system-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl border border-border flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* 1. Modal Header */}
        <div className="flex items-start justify-between border-b border-border/80 px-6 py-5 bg-gradient-to-b from-slate-50/80 to-white shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold font-mono tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                STEP 5 OF 6 · COLOUR SYSTEM
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                Deterministic WCAG 2.1 Contrast
              </span>
            </div>
            <h2 id="color-system-title" className="text-xl font-bold tracking-tight text-foreground">
              Harmonized Colour System
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review 5 canonical brand color roles derived from your mark and direction. Edit hex values directly or tune the mood.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <RegenerateCapBadge usedCount={regenerateCount} maxCount={3} />
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegeneratePalette}
              disabled={isRegenerating || regenerateCount >= 3}
              className="gap-1.5 text-xs font-semibold"
            >
              <RefreshCw className={`size-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
              <span>Regenerate Palette</span>
            </Button>
          </div>
        </div>

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

        {/* 2. Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Palette Mood Filter Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-border/80">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-muted-foreground" />
              <span className="text-xs font-bold text-foreground">PALETTE MOOD:</span>
              <span className="text-[11px] text-muted-foreground">Free instant tuning</span>
            </div>

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
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedMood === mood.key
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-border"
                  }`}
                >
                  {mood.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5 Roles Single Card List */}
          <div className="rounded-xl border border-border bg-white divide-y divide-border/80 overflow-hidden shadow-2xs">
            {roles.map((role) => {
              const isBg = role.roleName === "Background";

              return (
                <div
                  key={role.roleName}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  {/* Left: Swatch Well + Names */}
                  <div className="flex items-center gap-3.5 min-w-[220px]">
                    <div className="relative size-11 rounded-xl border border-black/10 shadow-inner shrink-0 overflow-hidden group/swatch">
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: role.hex }}
                      />
                      <input
                        type="color"
                        value={role.hex}
                        onChange={(e) => handleRoleHexChange(role.roleName, e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title="Click to pick color"
                      />
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground">
                          {role.roleName}
                        </span>
                        {role.isLocked && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-border/60">
                            <Lock className="size-2.5" /> Locked
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                        {role.usageNote || `Canonical ${role.roleName.toLowerCase()} brand tone`}
                      </p>
                    </div>
                  </div>

                  {/* Center: Hex, RGB & Copy */}
                  <div className="flex items-center gap-4">
                    {/* Hex Editor with copy */}
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-border/80">
                      <span className="text-xs font-mono font-bold text-foreground">
                        {role.hex}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopyHex(e, role.hex, role.roleName)}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                        title="Copy Hex"
                      >
                        {copiedRole === role.roleName ? (
                          <Check className="size-3 text-emerald-600" />
                        ) : (
                          <Copy className="size-3" />
                        )}
                      </button>
                    </div>

                    {/* RGB Triplet */}
                    <span className="hidden sm:inline text-xs font-mono text-muted-foreground">
                      RGB: {role.rgb}
                    </span>
                  </div>

                  {/* Right: Contrast Verdict Chip & Lock Action */}
                  <div className="flex items-center gap-3 justify-end min-w-[200px]">
                    {renderContrastBadge(role)}

                    {/* Lock Affordance (Data-driven for all 5 roles) */}
                    <button
                      type="button"
                      onClick={() => handleToggleLock(role.roleName)}
                      className={`p-2 rounded-lg border transition-colors ${
                        role.isLocked
                          ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                          : "bg-white text-muted-foreground hover:text-foreground border-border hover:bg-slate-50"
                      }`}
                      title={role.isLocked ? "Role is locked against palette regeneration" : "Lock role against palette regeneration"}
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

          {/* Visual Proportion Distribution Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
              <span>PROPORTION RATIO (60-30-10 RULE)</span>
              <span>60% Ground · 30% Primary/Text · 10% Accent/Secondary</span>
            </div>
            <div className="h-3 w-full rounded-full overflow-hidden flex shadow-inner border border-black/10">
              <div style={{ width: "60%", backgroundColor: bgColor }} title="Background 60%" />
              <div style={{ width: "20%", backgroundColor: primaryColor }} title="Primary 20%" />
              <div style={{ width: "10%", backgroundColor: textColor }} title="Text 10%" />
              <div style={{ width: "6%", backgroundColor: secondaryColor }} title="Secondary 6%" />
              <div style={{ width: "4%", backgroundColor: accentColor }} title="Accent 4%" />
            </div>
          </div>

          {/* Live Mock UI Preview Component */}
          <div className="rounded-xl border border-border p-5 space-y-3 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Eye className="size-3.5 text-blue-600" />
                <span>LIVE UI APPLICATION PREVIEW</span>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                Real-time Mock Fragment
              </span>
            </div>

            <div
              className="p-6 rounded-xl border transition-all duration-200 shadow-sm"
              style={{ backgroundColor: bgColor, borderColor: `${textColor}20` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${secondaryColor}15`,
                        color: secondaryColor,
                        borderColor: `${secondaryColor}30`,
                      }}
                    >
                      ENTERPRISE READY
                    </span>
                    <span
                      className="text-[11px] font-semibold"
                      style={{ color: accentColor }}
                    >
                      ● Active Network
                    </span>
                  </div>
                  <h4
                    className="text-lg font-bold tracking-tight"
                    style={{ color: textColor }}
                  >
                    Autonomous Infrastructure Suite
                  </h4>
                  <p
                    className="text-xs leading-relaxed max-w-lg"
                    style={{ color: `${textColor}B3` }}
                  >
                    Experience deterministic contrast pairing with live WCAG 2.1 compliance across high-density creator dashboards.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg text-xs font-bold shadow-xs transition-opacity hover:opacity-90"
                    style={{ backgroundColor: primaryColor, color: bgColor }}
                  >
                    Deploy Node
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
            </div>
          </div>

        </div>

        {/* 3. Modal Footer */}
        <div className="flex items-center justify-between border-t border-border/80 px-6 py-4 bg-white shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Info className="size-3.5 text-blue-600" />
            <span>5 Canonical Roles · Free Hex Edits · 3-Cap Palette Regen</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isConfirming}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isConfirming || isLoadingInitial}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
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

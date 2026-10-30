"use client";
import { useTranslation } from "@/hooks/useTranslation";

import React, { useState, useEffect, useTransition } from "react";
import {
  BrandKit,
  BrandTypography,
  BrandTypographyRole,
  BrandTypographyFamilies,
} from "@/types/creator/brand-kit";
import { apiCreatorBrandKit, brandKitApi } from "@/lib/api-creator-brand-kit";
import { creatorAiApi } from "@/lib/api-creator-ai";
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
  Loader2,
} from "lucide-react";

export interface TypographySystemModalProps {
  isOpen: boolean;
  ideaId?: string;
  kit: BrandKit;
  onClose: () => void;
  onSuccess: (updatedKit: BrandKit) => void;
  onKitUpdated?: (updatedKit: BrandKit) => void;
}

interface PairingPreset {
  id: string;
  display: string;
  text: string;
  label: string;
  reason: string;
  license: string;
  displayWeights: string[];
  textWeights: string[];
  bundleKb: number;
}

const CANONICAL_PAIRING_PRESETS: PairingPreset[] = [
  {
    id: "syne_dmsans",
    display: "Syne",
    text: "DM Sans",
    label: "Modern Geometric",
    reason: "Distinctive geometric headings with ultra-readable neo-grotesque body copy.",
    license: "OFL (Free for commercial use)",
    displayWeights: ["Bold", "ExtraBold"],
    textWeights: ["Regular", "Medium"],
    bundleKb: 84,
  },
  {
    id: "fraunces_outfit",
    display: "Fraunces",
    text: "Outfit",
    label: "Editorial Warmth",
    reason: "Warm serif editorial presence paired with clean contemporary body proportions.",
    license: "OFL (Free for commercial use)",
    displayWeights: ["SemiBold", "Bold"],
    textWeights: ["Regular", "Medium"],
    bundleKb: 92,
  },
  {
    id: "cabinet_plusjakarta",
    display: "Cabinet Grotesk",
    text: "Plus Jakarta Sans",
    label: "High Contrast Tech",
    reason: "Sharp neo-modern display typeface matched with balanced technical clarity.",
    license: "OFL (Free for commercial use)",
    displayWeights: ["Extrabold", "Black"],
    textWeights: ["Regular", "Medium"],
    bundleKb: 78,
  },
];

const getCanonicalRoleNotes = (t: (k: string) => string): Record<string, string> => ({
  "Logo type": t("modals.typographyLockedDesc"),
  Heading: t("modals.typographyHeadingDesc"),
  Body: t("modals.typographyBodyDesc"),
  "Button & label": t("modals.typographyButtonDesc"),
});

export function TypographySystemModal({
  isOpen,
  ideaId,
  kit,
  onClose,
  onSuccess,
  onKitUpdated,
}: TypographySystemModalProps) {
  const { t } = useTranslation("creator");
  const [currentKit, setCurrentKit] = useState<BrandKit>(kit);
  const [localTypography, setLocalTypography] = useState<BrandTypography>(() => {
    return kit.typography ?? {
      roles: [],
      regenerateCount: 0,
    };
  });

  const [selectedPairingId, setSelectedPairingId] = useState<string>("syne_dmsans");
  const [isPending, startTransition] = useTransition();
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [typographyCost, setTypographyCost] = useState<number | null>(null);
  const [isCostLoading, setIsCostLoading] = useState<boolean>(true);
  const [isCostError, setIsCostError] = useState<boolean>(false);

  useEffect(() => {
    setCurrentKit(kit);
  }, [kit]);

  useEffect(() => {
    let mounted = true;
    setIsCostLoading(true);
    setIsCostError(false);
    creatorAiApi
      .getCredits()
      .then((res) => {
        if (!mounted) return;
        if (res?.costs?.TypographyGeneration != null) {
          setTypographyCost(res.costs.TypographyGeneration);
        } else {
          setIsCostError(true);
        }
      })
      .catch(() => {
        if (!mounted) return;
        setIsCostError(true);
      })
      .finally(() => {
        if (!mounted) return;
        setIsCostLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync prop changes (No Auto-Generate)
  useEffect(() => {
    if (currentKit.typography?.roles && currentKit.typography.roles.length > 0) {
      setLocalTypography(currentKit.typography);
    } else {
      setLocalTypography({
        roles: [],
        regenerateCount: currentKit.typography?.regenerateCount ?? 0,
      });
    }
  }, [currentKit.typography]);

  // Initial Generation Handler (Paid)
  const handleGenerateInitial = async () => {
    try {
      setIsLoadingInitial(true);
      setErrorMessage(null);
      setInsufficientCredits(false);

      const res = await apiCreatorBrandKit.generateTypography(ideaId, currentKit.version);
      setCurrentKit(res);
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
            "Typography generation did not finish."
        );
      }
    } finally {
      setIsLoadingInitial(false);
    }
  };

  const roles = localTypography.roles ?? [];
  const regenerateCount = localTypography.regenerateCount ?? 0;
  const isCapExhausted = regenerateCount >= 3;

  // Brand Name & Tagline from strategy
  const brandName = kit.strategy?.nameDisplayForm ||
    kit.strategy?.businessName ||
    "Mondial";

  const brandTagline = kit.strategy?.positioning?.value ||
    kit.strategy?.concept?.value ||
    "Get paid without the awkward email";

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
      const updatedKit = await apiCreatorBrandKit.patchTypography(
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
        currentKit.version
      );
      if (updatedKit) {
        setCurrentKit(updatedKit);
        onKitUpdated?.(updatedKit);
      }
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
      const updatedKit = await apiCreatorBrandKit.patchTypography(
        {
          roles: [
            {
              roleName,
              ...updates,
            },
          ],
        },
        ideaId,
        currentKit.version
      );
      if (updatedKit) {
        setCurrentKit(updatedKit);
        onKitUpdated?.(updatedKit);
      }
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
      const res = await apiCreatorBrandKit.regenerateTypography(ideaId, currentKit.version);
      if (res) {
        setCurrentKit(res);
        onKitUpdated?.(res);
        if (res.typography) {
          setLocalTypography(res.typography);
        }
      }
    } catch (err: any) {
      if (err?.response?.status === 402 || err?.status === 402) {
        setInsufficientCredits(true);
      } else {
        setErrorMessage(
          `Typography pairing regeneration did not finish. Your ${typographyCost} credits have been automatically refunded to your balance.`
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
        currentKit.version
      );
      setCurrentKit(patchRes);

      const completedKit = await apiCreatorBrandKit.advanceStep(
        6,
        ideaId,
        patchRes.version ?? currentKit.version
      );
      setCurrentKit(completedKit);
      onKitUpdated?.(completedKit);
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
      <div className="relative w-full max-w-5xl 2xl:max-w-6xl rounded-2xl bg-card shadow-2xl border border-border flex flex-col max-h-[92vh] overflow-hidden text-card-foreground">
        
        {/* Header & 6-Step Workflow Track (Figma Node 57004:11793) */}
        <ModalWorkflowHeader
          title={t("modals.typographyModalTitle")}
          subtitle="Two families, four roles. The display face carries personality; the text face carries everything people actually read."
          currentStep={6}
          onClose={onClose}
          headerActions={
            roles.length > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegeneratePairing}
                disabled={isRegenerating || isCapExhausted || isCostLoading || isCostError || typographyCost == null}
                className="gap-2 text-xs font-mono font-medium h-8 border-border bg-background hover:bg-muted/60"
              >
                <RefreshCw
                  className={`size-3.5 text-muted-foreground ${
                    isRegenerating ? "animate-spin text-primary" : ""
                  }`}
                />
                <span>{t("modals.typographySuggestOther")}</span>
                <span className="px-1.5 py-0.5 rounded text-badge font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                  {Math.max(0, 3 - regenerateCount)}{t("modals.typographySuggestLeft")}
                </span>
              </Button>
            ) : undefined
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
              <span>{t("modals.typographyInsufficientCredits")}</span>
            </div>
            <span className="text-caption font-semibold opacity-80 ml-3 shrink-0">
              {t("modals.typographyCreditsUnavailable")}
            </span>
          </div>
        )}

        {/* Modal Scrolling Body */}
        <div className="p-6 overflow-y-auto space-y-7">
          {roles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-muted/20 p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto my-8">
              <div className="size-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 text-primary">
                <Type className="size-8" />
              </div>
              <h3 className="font-heading text-lg font-bold tracking-tight mb-2">
                {t("modals.typographyGenerateTitle")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 max-w-md">
                {t("modals.typographyGenerateDesc")}
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/20 text-xs font-mono font-medium text-primary mb-6">
                <Sparkles className="size-3.5" />
                <span>{t("modals.typographyCost")} {isCostLoading ? "Loading cost…" : isCostError || typographyCost == null ? "Unavailable" : `${typographyCost} AI credits`}</span>
              </div>
              <Button
                size="lg"
                onClick={handleGenerateInitial}
                disabled={isLoadingInitial || isCostLoading || isCostError || typographyCost == null}
                className="gap-2 font-mono text-sm px-6 shadow-sm"
              >
                {isLoadingInitial ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>{t("modals.typographyGeneratingTitle")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    <span>{isCostLoading ? "Loading cost…" : isCostError || typographyCost == null ? "Cost unavailable" : `Generate Typography System (${typographyCost} credits)`}</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* SECTION A: PAIRING CHOICE ("PICK A PAIRING") */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-caption font-mono font-bold tracking-wider text-muted-foreground uppercase">
            {t("modals.typographyPickPairing")}
          </span>
                    <span className="hidden sm:inline text-xs text-muted-foreground">·</span>
                    <span className="text-caption font-mono text-muted-foreground">
                      {t("modals.typographyDisplayFamilyLabel")} <strong className="text-foreground font-semibold">{displayFamilyName}</strong> {t("modals.typographyTextFamilyLabel")} <strong className="text-foreground font-semibold">{textFamilyName}</strong>
                    </span>
                  </div>

              <span className="text-xs font-mono text-muted-foreground">
                {t("modals.typographyTuningNotice")}
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
                        className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate"
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
                          {preset.reason}
                        </p>
                      </div>

                      {/* Footer Metadata */}
                      <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-badge font-mono text-muted-foreground">
                        <span>{preset.license}</span>
                        <span>·</span>
                        <span>{preset.displayWeights.length + preset.textWeights.length} {t("modals.typographyWeights")}</span>
                        <span>·</span>
                        <span>{preset.bundleKb}{t("modals.typographyKb")}</span>
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
              <span className="text-caption font-mono font-bold tracking-wider text-muted-foreground uppercase">
            {t("modals.typographyFourRoles")}
          </span>
              <span className="text-xs font-mono text-muted-foreground">
                {t("modals.typographyTuningFree")}
              </span>
            </div>

            {/* Single Unified 4-Row Card */}
            <div className="rounded-xl border border-border bg-card divide-y divide-border/80 overflow-hidden shadow-2xs">
              
              {/* ROW 1: Logo type (LOCKED STATE) */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/10">
                <div className="space-y-1 max-w-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold font-heading text-foreground">
                    {t("modals.typographyRoleLogoType")}
                  </span>
                    <span className="inline-flex items-center gap-1 text-badge font-mono font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/80">
                      <Lock className="size-2.5" /> {t("modals.typographyLocked")}
                    </span>
                  </div>
                  <p className="text-xs font-sans text-muted-foreground leading-normal">
                    {t("modals.typographyLockedDesc")}
                  </p>
                  <span className="text-badge font-mono text-muted-foreground block pt-0.5">
                    {t("modals.typographyBoundToLogo")}
                  </span>
                </div>

                {/* Right Specimen */}
                <div className="flex-1 flex flex-col items-start md:items-end gap-1.5 min-w-[280px]">
                  <span className="text-xs font-mono text-muted-foreground">
                    {t("modals.typographyLogoTypeSpec")}
                  </span>
                  <div
                    className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground md:text-right"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {brandName}
                  </div>
                </div>
              </div>

              {/* ROW 2: Heading */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                <div className="space-y-1 max-w-xs">
                  <span className="text-base font-bold font-heading text-foreground block">
                    {t("modals.typographyRoleHeading")}
                  </span>
                  <p className="text-xs font-sans text-muted-foreground leading-normal">
                    {t("modals.typographyHeadingDesc")}
                  </p>
                  
                  {/* Step Font Controls */}
                  <div className="flex items-center gap-2 pt-2">
                    <label className="text-badge font-mono text-muted-foreground">
                      {t("modals.typographyHeadingWeightLabel")}
                    </label>
                    <select
                      aria-label={t("modals.typographyHeadingWeightAria")}
                      value={headingRole?.weight || "700"}
                      onChange={(e) => handleTuningChange("Heading", { weight: e.target.value })}
                      className="text-xs font-mono rounded-md border border-border bg-background px-2 py-1 text-foreground"
                    >
                      <option value="400">{t("modals.typographyWeightRegular400")}</option>
                      <option value="600">{t("modals.typographyWeightSemiBold600")}</option>
                      <option value="700">{t("modals.typographyWeightBold700")}</option>
                      <option value="800">{t("modals.typographyWeightExtraBold800")}</option>
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
                    {t("modals.typographyRoleBody")}
                  </span>
                  <p className="text-xs font-sans text-muted-foreground leading-normal">
                    {t("modals.typographyBodyDesc")}
                  </p>

                  {/* Step Font Controls */}
                  <div className="flex items-center gap-2 pt-2">
                    <label className="text-badge font-mono text-muted-foreground">
                      {t("modals.typographyBodyWeightLabel")}
                    </label>
                    <select
                      aria-label={t("modals.typographyBodyWeightAria")}
                      value={bodyRole?.weight || "400"}
                      onChange={(e) => handleTuningChange("Body", { weight: e.target.value })}
                      className="text-xs font-mono rounded-md border border-border bg-background px-2 py-1 text-foreground"
                    >
                      <option value="400">{t("modals.typographyWeightRegular400")}</option>
                      <option value="500">{t("modals.typographyWeightMedium500")}</option>
                      <option value="600">{t("modals.typographyWeightSemiBold600")}</option>
                    </select>
                  </div>
                </div>

                {/* Right Specimen */}
                <div className="flex-1 flex flex-col items-start md:items-end gap-1.5 min-w-[280px]">
                  <span className="text-xs font-mono text-muted-foreground">
                    {textFamilyName} {t("modals.typographySampleRegular")} {bodyRole?.size || "16px"} / {bodyRole?.lineHeight || "1.5"}
                  </span>
                  <p
                    className="text-sm font-sans text-muted-foreground leading-relaxed max-w-md md:text-right"
                    style={{
                      fontFamily: textFamilyName,
                      fontWeight: bodyRole?.weight || "400",
                    }}
                  >
                    {t("modals.typographySampleBodyText")}
                  </p>
                </div>
              </div>

              {/* ROW 4: Button & label */}
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                <div className="space-y-1 max-w-xs">
                  <span className="text-base font-bold font-heading text-foreground block">
                    {t("modals.typographyRoleButton")}
                  </span>
                  <p className="text-xs font-sans text-muted-foreground leading-normal">
                    {t("modals.typographyButtonDesc")}
                  </p>
                </div>

                {/* Right Specimen */}
                <div className="flex-1 flex flex-col items-start md:items-end gap-2.5 min-w-[280px]">
                  <span className="text-xs font-mono text-muted-foreground">
                    {textFamilyName} {t("modals.typographySampleMedium")} {buttonRole?.size || "14px"} / {buttonRole?.lineHeight || "1.0"}
                  </span>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-xs"
                      style={{ fontFamily: textFamilyName }}
                    >
                      {t("modals.typographySampleExplore")} {brandName}
                    </button>
                    <span
                      className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                      style={{ fontFamily: textFamilyName }}
                    >
                      {t("modals.typographySampleActiveNetwork")}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </>
      )}

        </div>

        {/* Modal Footer (Figma Node 57004:11793) */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-card shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Info className="size-3.5 text-primary shrink-0" />
            <span>{t("modals.typographyFooterSummary")}</span>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={onClose} disabled={isConfirming}>
              {t("modals.typographyCancel")}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isConfirming || isPending || isLoadingInitial || roles.length === 0}
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

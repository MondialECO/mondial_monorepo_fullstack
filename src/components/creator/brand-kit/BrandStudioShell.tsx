"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BrandKit } from "@/types/creator/brand-kit";
import { brandKitApi } from "@/lib/api-creator-brand-kit";
import {
  BrandStudioProgressBar,
  StudioStepKey,
  StepSegmentMeta,
} from "./BrandStudioProgressBar";
import { StrategyResultCard } from "./cards/StrategyResultCard";
import { DirectionResultCard } from "./cards/DirectionResultCard";
import { LogoTypeResultCard } from "./cards/LogoTypeResultCard";
import { LogoResultCard } from "./cards/LogoResultCard";
import { LogoCreationModal } from "./LogoCreationModal";
import { VariationSetModal } from "./VariationSetModal";
import { StudioStepPlaceholderModal } from "./StudioStepPlaceholderModal";
import { Sparkles, AlertCircle, Loader2 } from "lucide-react";

export interface BrandStudioShellProps {
  ideaId?: string;
  initialKit?: BrandKit | null;
  onBack?: () => void;
}

type StudioModalKey =
  | "strategy"
  | "direction"
  | "logo_type"
  | "logo_creation"
  | "variations"
  | "colors"
  | "typography";

export function BrandStudioShell({
  ideaId,
  initialKit,
  onBack,
}: BrandStudioShellProps) {
  const router = useRouter();
  const [kit, setKit] = useState<BrandKit | null>(initialKit ?? null);
  const [activeModal, setActiveModal] = useState<StudioModalKey | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [inFlightStatus, setInFlightStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const brandName =
    kit?.strategy?.nameDisplayForm ||
    kit?.strategy?.businessName ||
    "Brand";

  // 1. Calculate 6-segment status derived directly from server state
  const stepSegments = useMemo<StepSegmentMeta[]>(() => {
    const isStrategyComplete = Boolean(kit?.strategy?.confirmedAt);
    const isDirectionComplete = Boolean(
      kit?.direction?.selectedAt || kit?.direction?.selectedDirectionKey
    );
    const isLogoTypeComplete = Boolean(kit?.logo?.logoType);
    const isLogoComplete = Boolean(kit?.logo?.approvedAt);
    const isColorsComplete = Boolean(
      kit?.colors?.confirmedAt || (kit?.colors?.roles && kit.colors.roles.length === 5)
    );
    const isTypographyComplete = Boolean(
      kit?.typography?.confirmedAt || (kit?.typography?.roles && kit.typography.roles.length >= 4)
    );

    return [
      {
        key: "strategy",
        stepNumber: 1,
        label: "Strategy",
        status: isStrategyComplete ? "complete" : "active",
      },
      {
        key: "direction",
        stepNumber: 2,
        label: "Direction",
        status: isDirectionComplete
          ? "complete"
          : isStrategyComplete
          ? "active"
          : "locked",
      },
      {
        key: "logo_type",
        stepNumber: 3,
        label: "Logo Type",
        status: isLogoTypeComplete
          ? "complete"
          : isDirectionComplete
          ? "active"
          : "locked",
      },
      {
        key: "logo",
        stepNumber: 4,
        label: "Logo",
        status: isLogoComplete
          ? "complete"
          : isLogoTypeComplete
          ? "active"
          : "locked",
      },
      {
        key: "colors",
        stepNumber: 5,
        label: "Colour",
        status: isColorsComplete
          ? "complete"
          : isLogoComplete
          ? "active"
          : "locked",
      },
      {
        key: "typography",
        stepNumber: 6,
        label: "Typography",
        status: isTypographyComplete
          ? "complete"
          : isColorsComplete
          ? "active"
          : "locked",
      },
    ];
  }, [kit]);

  // 2. Map segment key to corresponding modal key
  const getModalKeyForStep = useCallback(
    (stepKey: StudioStepKey, currentKit: BrandKit | null): StudioModalKey => {
      if (stepKey === "logo") {
        if (currentKit?.logo?.selectedConceptKey && !currentKit.logo.approvedAt) {
          return "variations";
        }
        return "logo_creation";
      }
      return stepKey as StudioModalKey;
    },
    []
  );

  // 3. Initial Load & Server Resuming Calculation
  useEffect(() => {
    let isMounted = true;

    async function loadStudioSession() {
      setIsLoading(true);
      setError(null);
      setInFlightStatus("Initializing Studio session...");

      try {
        let currentKit = initialKit;
        if (!currentKit) {
          try {
            currentKit = await brandKitApi.openStudio(ideaId);
          } catch {
            currentKit = await brandKitApi.getBrandKit(ideaId);
          }
        }

        if (!isMounted) return;
        setKit(currentKit);

        // Resume to the first incomplete unlocked step
        const isStrategyComplete = Boolean(currentKit.strategy?.confirmedAt);
        const isDirectionComplete = Boolean(
          currentKit.direction?.selectedAt || currentKit.direction?.selectedDirectionKey
        );
        const isLogoTypeComplete = Boolean(currentKit.logo?.logoType);
        const isLogoComplete = Boolean(currentKit.logo?.approvedAt);
        const isColorsComplete = Boolean(
          currentKit.colors?.confirmedAt || (currentKit.colors?.roles && currentKit.colors.roles.length === 5)
        );

        let resumeModal: StudioModalKey = "strategy";
        if (!isStrategyComplete) {
          resumeModal = "strategy";
        } else if (!isDirectionComplete) {
          resumeModal = "direction";
        } else if (!isLogoTypeComplete) {
          resumeModal = "logo_type";
        } else if (!isLogoComplete) {
          resumeModal = currentKit.logo?.selectedConceptKey ? "variations" : "logo_creation";
        } else if (!isColorsComplete) {
          resumeModal = "colors";
        } else {
          resumeModal = "typography";
        }

        setActiveModal(resumeModal);
      } catch (err: any) {
        if (!isMounted) return;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load brand visual identity studio session.";
        setError(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setInFlightStatus(null);
        }
      }
    }

    loadStudioSession();

    return () => {
      isMounted = false;
    };
  }, [ideaId, initialKit]);

  // 4. Modal Confirm Handlers
  const handleLogoCreationConfirm = (updatedKit: BrandKit) => {
    setKit(updatedKit);
    // Move immediately to variations (Step 3b)
    setActiveModal("variations");
  };

  const handleVariationsConfirm = (updatedKit: BrandKit) => {
    setKit(updatedKit);
    // Logo complete -> advance to Colour step placeholder
    setActiveModal("colors");
  };

  const handleSelectStep = (stepKey: StudioStepKey) => {
    const modalKey = getModalKeyForStep(stepKey, kit);
    setActiveModal(modalKey);
  };

  const handleBackNavigation = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard/creator/phase-2/branding");
    }
  };

  // Determine current active progress bar key
  const currentProgressBarKey: StudioStepKey = useMemo(() => {
    if (activeModal === "logo_creation" || activeModal === "variations") {
      return "logo";
    }
    if (activeModal) {
      return activeModal as StudioStepKey;
    }
    // Default to first active segment
    const activeSeg = stepSegments.find((s) => s.status === "active");
    return activeSeg ? activeSeg.key : "strategy";
  }, [activeModal, stepSegments]);

  return (
    <div className="relative flex flex-col min-h-screen w-full bg-[#EFEFF1]">
      {/* 1. Top Fixed Progress Bar */}
      <BrandStudioProgressBar
        segments={stepSegments}
        activeStepKey={currentProgressBarKey}
        brandName={brandName}
        inFlightStatus={inFlightStatus}
        onSelectStep={handleSelectStep}
        onBack={handleBackNavigation}
      />

      {/* Global Error Banner */}
      {error && (
        <div className="mx-auto mt-4 w-full max-w-4xl px-4">
          <div className="flex items-center gap-2 p-3 text-xs text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-xl">
            <AlertCircle className="size-4 shrink-0 text-destructive" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 2. Full-Bleed Dot-Grid Canvas & Accumulated Result Cards */}
      <main
        className="flex-1 w-full px-4 md:px-8 py-8 flex flex-col items-center justify-start gap-6 overflow-y-auto"
        style={{
          backgroundImage:
            "radial-gradient(#d1d5db 1.2px, transparent 1.2px)",
          backgroundSize: "24px 24px",
        }}
      >
        {isLoading && !kit ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">
              Loading Visual Identity Studio...
            </p>
          </div>
        ) : (
          <div className="w-full max-w-4xl flex flex-col items-center gap-6">
            {/* Strategy Result Card (Step 1) */}
            {kit?.strategy && (
              <StrategyResultCard
                strategy={kit.strategy}
                onEdit={() => setActiveModal("strategy")}
              />
            )}

            {/* Direction Result Card (Step 2) */}
            {kit?.direction && (
              <DirectionResultCard
                direction={kit.direction}
                onEdit={() => setActiveModal("direction")}
              />
            )}

            {/* Logo Type Result Card (Step 3) */}
            {kit?.logo?.logoType && (
              <LogoTypeResultCard
                logo={kit.logo}
                onEdit={() => setActiveModal("logo_type")}
              />
            )}

            {/* Logo Result Card (Step 4) */}
            {kit?.logo?.selectedConceptKey && (
              <LogoResultCard
                logo={kit.logo}
                brandName={brandName}
                onEdit={() => {
                  if (kit.logo?.approvedAt) {
                    setActiveModal("variations");
                  } else {
                    setActiveModal("logo_creation");
                  }
                }}
              />
            )}

            {/* Studio Canvas Hero Banner if no cards yet */}
            {!kit?.strategy?.confirmedAt &&
              !kit?.direction?.selectedAt &&
              !kit?.logo?.logoType && (
                <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-white border border-border/80 text-center max-w-lg shadow-sm my-12">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                    <Sparkles className="size-6" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground">
                    Welcome to Visual Identity Studio
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
                    Create a complete, unified visual system for {brandName}. Your confirmed decisions will land here on the canvas.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveModal("strategy")}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary/90"
                  >
                    Start Strategy Definition
                  </button>
                </div>
              )}
          </div>
        )}
      </main>

      {/* 3. Modal Overlays */}

      {/* Step 3a: Logo Creation Modal */}
      {activeModal === "logo_creation" && (
        <LogoCreationModal
          ideaId={ideaId}
          initialKit={kit}
          onConfirm={handleLogoCreationConfirm}
          onBack={() => setActiveModal(null)}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Step 3b: Variation Set Modal */}
      {activeModal === "variations" && (
        <VariationSetModal
          ideaId={ideaId}
          initialKit={kit}
          onConfirm={handleVariationsConfirm}
          onBack={() => setActiveModal("logo_creation")}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Unbuilt Steps Placeholders */}
      {activeModal === "strategy" && (
        <StudioStepPlaceholderModal
          stepKey="strategy"
          stepNumber={1}
          stepTitle="Brand Strategy & Core Attributes"
          description="Define brand personality traits, positioning, target audience and aesthetic boundaries."
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "direction" && (
        <StudioStepPlaceholderModal
          stepKey="direction"
          stepNumber={2}
          stepTitle="Visual Directions"
          description="Explore and select from four generative strategic visual directions tailored to your archetype."
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "logo_type" && (
        <StudioStepPlaceholderModal
          stepKey="logo_type"
          stepNumber={3}
          stepTitle="Logo Type Chooser"
          description="Select the architectural mark family (Monogram, Geometric, Emblem, Wordmark, Line, Combination)."
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "colors" && (
        <StudioStepPlaceholderModal
          stepKey="colors"
          stepNumber={5}
          stepTitle="Harmonized Colour System"
          description="Review and customize the 5 canonical brand color roles with live WCAG contrast checking."
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === "typography" && (
        <StudioStepPlaceholderModal
          stepKey="typography"
          stepNumber={6}
          stepTitle="Typography System"
          description="Configure heading, body and UI button typefaces with optical hierarchy scales."
          isOpen={true}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
}

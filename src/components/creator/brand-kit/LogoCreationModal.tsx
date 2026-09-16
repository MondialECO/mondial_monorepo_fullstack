"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BrandKit, BrandLogoConcept } from "@/types/creator/brand-kit";
import { brandKitApi } from "@/lib/api-creator-brand-kit";
import { ConceptTile } from "./ConceptTile";
import { CompareOverlay } from "./CompareOverlay";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Columns2,
  RefreshCw,
  AlertCircle,
  Eye,
  FileText,
  Scan,
} from "lucide-react";

export interface LogoCreationModalProps {
  ideaId?: string;
  initialKit?: BrandKit | null;
  onConfirm?: (kit: BrandKit) => void;
  onBack?: () => void;
  onClose?: () => void;
}

export function LogoCreationModal({
  ideaId,
  initialKit,
  onConfirm,
  onBack,
  onClose,
}: LogoCreationModalProps) {
  const [kit, setKit] = useState<BrandKit | null>(initialKit ?? null);
  const [concepts, setConcepts] = useState<BrandLogoConcept[]>(
    initialKit?.logo?.concepts ?? []
  );
  const [selectedConceptKey, setSelectedConceptKey] = useState<string | null>(
    initialKit?.logo?.selectedConceptKey ?? null
  );

  const [viewMode, setViewMode] = useState<"mark" | "invoice" | "16px">("mark");
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [showCompareOverlay, setShowCompareOverlay] = useState<boolean>(false);

  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Per-tile loading and error states to ensure isolated tile updates
  const [regeneratingKeys, setRegeneratingKeys] = useState<Record<string, boolean>>({});
  const [tileErrors, setTileErrors] = useState<
    Record<string, { type: "cap" | "credits" | "network"; message: string } | null>
  >({});

  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  // 1. Initial Data Fetch & Generation if missing
  useEffect(() => {
    let isMounted = true;

    // If initialKit is already provided with 6 concepts, skip re-fetching
    if (initialKit && (initialKit.logo?.concepts?.length ?? 0) >= 6) {
      return;
    }

    async function loadOrCreateConcepts() {
      try {
        setIsLoadingInitial(true);
        setGlobalError(null);

        let currentKit = initialKit;
        if (!currentKit) {
          currentKit = await brandKitApi.getBrandKit(ideaId);
        }

        if (!isMounted) return;
        setKit(currentKit);

        const existingConcepts = currentKit.logo?.concepts ?? [];
        if (existingConcepts.length >= 6) {
          setConcepts(existingConcepts);
          if (currentKit.logo?.selectedConceptKey) {
            setSelectedConceptKey(currentKit.logo.selectedConceptKey);
          }
        } else {
          // Trigger generation if not yet populated
          const updatedKit = await brandKitApi.generateLogoConcepts(
            ideaId,
            currentKit.version
          );
          if (!isMounted) return;
          setKit(updatedKit);
          setConcepts(updatedKit.logo?.concepts ?? []);
          if (updatedKit.logo?.selectedConceptKey) {
            setSelectedConceptKey(updatedKit.logo.selectedConceptKey);
          }
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (err?.response?.status === 409) {
          try {
            const freshKit = await brandKitApi.getBrandKit(ideaId);
            if (isMounted && (freshKit.logo?.concepts?.length ?? 0) >= 6) {
              setKit(freshKit);
              setConcepts(freshKit.logo?.concepts ?? []);
              if (freshKit.logo?.selectedConceptKey) {
                setSelectedConceptKey(freshKit.logo.selectedConceptKey);
              }
              return;
            }
          } catch {
            // fall through
          }
        }
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load or generate logo concepts.";
        setGlobalError(msg);
      } finally {
        if (isMounted) {
          setIsLoadingInitial(false);
        }
      }
    }

    loadOrCreateConcepts();

    return () => {
      isMounted = false;
    };
  }, [ideaId, initialKit]);

  // 2. Per-Tile Concept Selection Handler
  const handleSelectConcept = useCallback((key: string) => {
    setSelectedConceptKey(key);
  }, []);

  // 3. Per-Tile Regeneration Handler (Isolated State)
  const handleRegenerateConcept = useCallback(
    async (conceptKey: string) => {
      // Clear previous error for this tile
      setTileErrors((prev) => ({ ...prev, [conceptKey]: null }));
      setRegeneratingKeys((prev) => ({ ...prev, [conceptKey]: true }));

      try {
        const updatedKit = await brandKitApi.regenerateSingleLogoConcept(
          conceptKey,
          ideaId,
          kit?.version
        );

        setKit(updatedKit);
        const updatedConcepts = updatedKit.logo?.concepts ?? [];

        // In-place update of target concept only to preserve sibling reference stability
        setConcepts((prev) =>
          prev.map((c) => {
            if (c.key === conceptKey) {
              const fresh = updatedConcepts.find((uc) => uc.key === conceptKey);
              return fresh ?? c;
            }
            return c;
          })
        );
      } catch (err: any) {
        const status = err?.response?.status;
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Regeneration failed. Try again.";

        if (status === 402) {
          setTileErrors((prev) => ({
            ...prev,
            [conceptKey]: {
              type: "credits",
              message: "Insufficient AI credits (2 credits required).",
            },
          }));
        } else if (status === 400 && msg.toLowerCase().includes("limit")) {
          setTileErrors((prev) => ({
            ...prev,
            [conceptKey]: {
              type: "cap",
              message: "Regeneration limit of 3 reached for this concept.",
            },
          }));
        } else {
          setTileErrors((prev) => ({
            ...prev,
            [conceptKey]: {
              type: "network",
              message: msg,
            },
          }));
        }
      } finally {
        setRegeneratingKeys((prev) => ({ ...prev, [conceptKey]: false }));
      }
    },
    [ideaId, kit?.version]
  );

  // 4. Compare Mode Selection Toggle
  const handleToggleCompareSelection = useCallback((key: string) => {
    setCompareSelection((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      if (prev.length < 2) {
        const next = [...prev, key];
        if (next.length === 2) {
          setShowCompareOverlay(true);
        }
        return next;
      }
      // If already 2 selected, replace second
      const next = [prev[0], key];
      setShowCompareOverlay(true);
      return next;
    });
  }, []);

  // 5. Final Confirmation Handler
  const handleConfirmSelection = async () => {
    if (!selectedConceptKey || isConfirming) return;

    setIsConfirming(true);
    setGlobalError(null);

    try {
      const updatedKit = await brandKitApi.patchLogo(
        { selectedConceptKey },
        ideaId,
        kit?.version
      );

      setKit(updatedKit);
      if (onConfirm) {
        onConfirm(updatedKit);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to confirm selected logo concept.";
      setGlobalError(msg);
      setIsConfirming(false);
    }
  };

  // Resolve selected concept display title
  const selectedConcept = useMemo(
    () => concepts.find((c) => c.key === selectedConceptKey),
    [concepts, selectedConceptKey]
  );

  const selectedConceptTitle = selectedConcept?.parameters?.descriptor
    ? selectedConcept.parameters.descriptor
    : selectedConcept?.key
    ? `Concept ${selectedConcept.key.replace("concept_", "")}`
    : "Concept";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-6xl mx-auto flex flex-col bg-background text-foreground rounded-3xl border border-border shadow-xl overflow-hidden min-h-[720px]">
      {/* 1. Modal Top Navigation Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/60 backdrop-blur-xs px-6 py-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8"
            >
              <ArrowLeft className="size-3.5" />
              Back
            </Button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-primary uppercase tracking-wider">
                STEP 4 OF 6
              </span>
              <span className="text-muted-foreground text-xs">•</span>
              <span className="text-xs text-muted-foreground">Logo Creation</span>
            </div>
            <h1 className="font-heading font-bold text-lg text-foreground tracking-tight">
              Select Your Brand Mark
            </h1>
          </div>
        </div>

        {/* View Mode Bar and Compare Mode Toggle */}
        <div className="flex items-center gap-3">
          {/* View Modes */}
          <div className="inline-flex rounded-xl border border-border/80 bg-muted/30 p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("mark")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === "mark"
                  ? "bg-card font-medium text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Eye className="size-3.5" />
              <span>Mark only</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("invoice")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === "invoice"
                  ? "bg-card font-medium text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="size-3.5" />
              <span>On an invoice</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("16px")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === "16px"
                  ? "bg-card font-medium text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Scan className="size-3.5" />
              <span>At 16px</span>
            </button>
          </div>

          {/* Compare Two Toggle */}
          <Button
            type="button"
            variant={isCompareMode ? "secondary" : "outline"}
            size="sm"
            onClick={() => {
              setIsCompareMode(!isCompareMode);
              setCompareSelection([]);
            }}
            className={`h-9 gap-1.5 text-xs ${
              isCompareMode
                ? "bg-primary/10 text-primary border-primary/30"
                : "border-border/80 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Columns2 className="size-3.5" />
            <span>{isCompareMode ? "Exit compare" : "Compare two"}</span>
          </Button>
        </div>
      </header>

      {/* Global Error Banner */}
      {globalError && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{globalError}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setGlobalError(null)}
            className="h-6 px-2 text-xs"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Compare Selection Helper Banner */}
      {isCompareMode && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs flex items-center justify-between">
          <span className="font-medium text-foreground">
            Select {2 - compareSelection.length} more concept{compareSelection.length === 1 ? "" : "s"} to compare side-by-side.
          </span>
          {compareSelection.length === 2 && (
            <Button
              size="sm"
              onClick={() => setShowCompareOverlay(true)}
              className="h-7 text-xs bg-primary text-primary-foreground"
            >
              Open Comparison
            </Button>
          )}
        </div>
      )}

      {/* 2. Main 3x2 Grid Area */}
      <main className="flex-1 p-6">
        {isLoadingInitial ? (
          <div className="flex flex-col items-center justify-center min-h-[420px] gap-3">
            <RefreshCw className="size-8 text-primary animate-spin" />
            <div className="text-center">
              <h3 className="font-heading font-semibold text-sm text-foreground">
                Generating 6 parametric brand concepts...
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Synthesizing direction archetype, motif geometry, and typographic pairings.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {concepts.map((concept, index) => {
              const key = concept.key || `concept_${index + 1}`;
              return (
                <ConceptTile
                  key={key}
                  concept={concept}
                  index={index}
                  isSelected={selectedConceptKey === key}
                  isRegenerating={!!regeneratingKeys[key]}
                  error={tileErrors[key] ?? null}
                  viewMode={viewMode}
                  onSelect={() => handleSelectConcept(key)}
                  onRegenerate={() => handleRegenerateConcept(key)}
                  isCompareMode={isCompareMode}
                  isCompareSelected={compareSelection.includes(key)}
                  onToggleCompare={() => handleToggleCompareSelection(key)}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* 3. Bottom Action Footer */}
      <footer className="flex items-center justify-between border-t border-border bg-card/60 backdrop-blur-xs px-6 py-4 mt-auto">
        <div className="text-xs text-muted-foreground">
          {selectedConceptKey ? (
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              Selected:{" "}
              <strong className="text-foreground font-medium">
                {selectedConceptTitle}
              </strong>
            </span>
          ) : (
            <span>Please click a concept card to select your mark.</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          )}

          <Button
            type="button"
            disabled={!selectedConceptKey || isConfirming || isLoadingInitial}
            onClick={handleConfirmSelection}
            className="h-10 px-5 text-xs font-semibold gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs disabled:opacity-50"
          >
            {isConfirming ? (
              <>
                <RefreshCw className="size-3.5 animate-spin" />
                <span>Confirming...</span>
              </>
            ) : (
              <>
                <span>
                  Confirm & Continue with {selectedConceptKey ? selectedConceptTitle : "Mark"}
                </span>
                <ArrowRight className="size-3.5" />
              </>
            )}
          </Button>
        </div>
      </footer>

      {/* 4. Compare Overlay Modal */}
      {showCompareOverlay && compareSelection.length === 2 && (
        <CompareOverlay
          concepts={concepts}
          selectedKeys={[compareSelection[0], compareSelection[1]]}
          onClose={() => {
            setShowCompareOverlay(false);
            setIsCompareMode(false);
            setCompareSelection([]);
          }}
          onSelectWinningConcept={(key) => {
            setSelectedConceptKey(key);
            setShowCompareOverlay(false);
            setIsCompareMode(false);
            setCompareSelection([]);
          }}
        />
      )}
      </div>
    </div>
  );
}

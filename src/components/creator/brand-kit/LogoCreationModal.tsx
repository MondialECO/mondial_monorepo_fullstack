"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { BrandKit, BrandLogoConcept } from "@/types/creator/brand-kit";
import { brandKitApi } from "@/lib/api-creator-brand-kit";
import { ConceptTile } from "./ConceptTile";
import { CompareOverlay } from "./CompareOverlay";
import { ModalWorkflowHeader } from "./ModalWorkflowHeader";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  Columns2,
  RefreshCw,
  AlertCircle,
  Eye,
  FileText,
  Scan,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

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
    initialKit?.logo?.selectedConceptKey ?? (initialKit?.logo?.concepts?.[0]?.key || "concept_1")
  );

  const [viewMode, setViewMode] = useState<"mark" | "invoice" | "16px">("mark");
  const [isCompareMode, setIsCompareMode] = useState<boolean>(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [showCompareOverlay, setShowCompareOverlay] = useState<boolean>(false);

  const [isLoadingInitial, setIsLoadingInitial] = useState<boolean>(false);
  const [isBatchRegenerating, setIsBatchRegenerating] = useState<boolean>(false);
  const [batchRegenerateCount, setBatchRegenerateCount] = useState<number>(0);
  const [globalError, setGlobalError] = useState<{
    type: "credits" | "cap" | "network";
    message: string;
  } | null>(null);

  // Per-tile loading and error states to ensure isolated tile updates
  const [regeneratingKeys, setRegeneratingKeys] = useState<Record<string, boolean>>({});
  const [tileErrors, setTileErrors] = useState<
    Record<string, { type: "cap" | "credits" | "network"; message: string } | null>
  >({});

  const [isConfirming, setIsConfirming] = useState<boolean>(false);

  // 1. Initial Data Fetch & Generation if missing
  useEffect(() => {
    let isMounted = true;

    // If initialKit is already provided with 6 concepts, populate state directly
    if (initialKit && (initialKit.logo?.concepts?.length ?? 0) >= 6) {
      setKit(initialKit);
      setConcepts(initialKit.logo!.concepts);
      setSelectedConceptKey(
        initialKit.logo?.selectedConceptKey || initialKit.logo!.concepts[0].key
      );
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

        const existingConcepts = currentKit?.logo?.concepts ?? [];
        if (existingConcepts.length >= 6) {
          setConcepts(existingConcepts);
          setSelectedConceptKey(
            currentKit?.logo?.selectedConceptKey || existingConcepts[0].key
          );
        } else {
          // Trigger generation if not yet populated
          const updatedKit = await brandKitApi.generateLogoConcepts(
            ideaId,
            currentKit?.version
          );
          if (!isMounted) return;
          setKit(updatedKit);
          setConcepts(updatedKit.logo?.concepts ?? []);
          setSelectedConceptKey(
            updatedKit.logo?.selectedConceptKey || updatedKit.logo?.concepts?.[0]?.key || "concept_1"
          );
        }
      } catch (err: any) {
        if (!isMounted) return;
        if (err?.response?.status === 409) {
          try {
            const freshKit = await brandKitApi.getBrandKit(ideaId);
            if (isMounted && (freshKit.logo?.concepts?.length ?? 0) >= 6) {
              setKit(freshKit);
              setConcepts(freshKit.logo?.concepts ?? []);
              setSelectedConceptKey(
                freshKit.logo?.selectedConceptKey || freshKit.logo?.concepts?.[0]?.key || "concept_1"
              );
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
        setGlobalError({ type: "network", message: msg });
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

  // Derived context metadata
  const businessName = useMemo(() => {
    return (
      kit?.strategy?.nameDisplayForm ||
      kit?.strategy?.businessName ||
      "AutoInvoice"
    );
  }, [kit]);

  const logoTypeName = useMemo(() => {
    const raw = kit?.logo?.logoType;
    if (!raw) return "Symbol + Name";
    if (raw === "symbol_plus_name") return "Symbol + Name";
    if (raw === "wordmark") return "Wordmark";
    if (raw === "monogram") return "Monogram";
    if (raw === "abstract") return "Abstract mark";
    if (raw === "icon") return "Icon";
    if (raw === "minimal") return "Minimal";
    return raw.replace(/_/g, " ");
  }, [kit]);

  const directionName = useMemo(() => {
    const candidate = kit?.direction?.candidates?.find(
      (c) => c.key === kit?.direction?.selectedDirectionKey
    );
    return candidate?.name || "Bold & Innovative";
  }, [kit]);

  // Batch Redraw Cap logic (3 max batch regenerations)
  const remainingBatchCap = Math.max(0, 3 - batchRegenerateCount);
  const isBatchCapExhausted = remainingBatchCap === 0;

  // 2. Batch Regeneration Handler ("Redraw all six" - 4 credits, capped at 3)
  const handleRedrawAll = async () => {
    if (isBatchRegenerating || isBatchCapExhausted) return;

    setIsBatchRegenerating(true);
    setGlobalError(null);

    try {
      const updatedKit = await brandKitApi.generateLogoConcepts(
        ideaId,
        kit?.version
      );
      setKit(updatedKit);
      setConcepts(updatedKit.logo?.concepts ?? []);
      setSelectedConceptKey(
        updatedKit.logo?.selectedConceptKey || updatedKit.logo?.concepts?.[0]?.key || "concept_1"
      );
      setBatchRegenerateCount((prev) => prev + 1);
    } catch (err: any) {
      const status = err?.response?.status;
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to redraw logo concepts.";

      if (status === 402) {
        setGlobalError({
          type: "credits",
          message: "Insufficient AI credits (4 credits required for batch redraw).",
        });
      } else if (status === 400 && msg.toLowerCase().includes("limit")) {
        setGlobalError({
          type: "cap",
          message: "Maximum batch regeneration limit (3/3) reached.",
        });
      } else {
        setGlobalError({ type: "network", message: msg });
      }
    } finally {
      setIsBatchRegenerating(false);
    }
  };

  // 3. Per-Tile Concept Selection Handler
  const handleSelectConcept = useCallback((key: string) => {
    setSelectedConceptKey(key);
  }, []);

  // 4. Per-Tile Regeneration Handler (Isolated State - 2 credits, 3-cap)
  const handleRegenerateConcept = useCallback(
    async (conceptKey: string) => {
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

        // In-place update of target concept only
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

  // 5. Compare Mode Selection Toggle
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
      const next = [prev[0], key];
      setShowCompareOverlay(true);
      return next;
    });
  }, []);

  // 6. Final Confirmation Handler -> transitions to Variation Set Modal
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
      setGlobalError({ type: "network", message: msg });
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
    ? `Concept 0${selectedConcept.key.replace("concept_", "")}`
    : "Concept 01";

  const closeHandler = onClose || onBack || (() => {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 md:p-8 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] rounded-2xl bg-card border border-border/80 shadow-2xl overflow-hidden flex flex-col my-auto bg-white">
        
        {/* 1. Modal Header & 6-Step Workflow Track (Figma Node 57004:10578) */}
        <ModalWorkflowHeader
          title="Choose your logo"
          subtitle={`Six ${logoTypeName} concepts, drawn inside ${directionName}. Pick the one you'd defend to a customer.`}
          currentStep={4}
          onClose={closeHandler}
          headerActions={
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isBatchRegenerating || isBatchCapExhausted || isLoadingInitial}
                onClick={handleRedrawAll}
                className="h-8 px-3 text-xs font-medium gap-1.5 hover:bg-muted text-foreground disabled:opacity-50 font-sans cursor-pointer"
                title={
                  isBatchCapExhausted
                    ? "Maximum 3 batch redraws reached"
                    : "Redraw all 6 concepts (4 credits)"
                }
              >
                <RefreshCw className={`size-3.5 ${isBatchRegenerating ? "animate-spin text-primary" : ""}`} />
                <span>Redraw all six</span>
              </Button>

              <span
                className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full border tabular-nums shrink-0 ${
                  isBatchCapExhausted
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                    : "bg-muted text-muted-foreground border-border/60"
                }`}
                title={`${remainingBatchCap} of 3 batch redraws left`}
              >
                {`${remainingBatchCap}/3 LEFT`}
              </span>
            </div>
          }
        />

        {/* 2. VIEW BAR (48px tall, hairline bottom border, px-6 sm:px-8) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 sm:px-8 py-2.5 border-b border-border/70 bg-muted/15 shrink-0">
          {/* Left: SHOW AS chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase font-mono pr-1">
              SHOW AS
            </span>
            <button
              type="button"
              onClick={() => setViewMode("mark")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors font-sans cursor-pointer ${
                viewMode === "mark"
                  ? "bg-foreground text-background font-semibold shadow-2xs"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              Mark only
            </button>
            <button
              type="button"
              onClick={() => setViewMode("invoice")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors font-sans cursor-pointer ${
                viewMode === "invoice"
                  ? "bg-foreground text-background font-semibold shadow-2xs"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              On an invoice
            </button>
            <button
              type="button"
              onClick={() => setViewMode("16px")}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors font-sans cursor-pointer ${
                viewMode === "16px"
                  ? "bg-foreground text-background font-semibold shadow-2xs"
                  : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border/60"
              }`}
            >
              At 16px
            </button>
          </div>

          {/* Right: Compare two + Concepts counter */}
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant={isCompareMode ? "secondary" : "outline"}
              size="sm"
              onClick={() => {
                setIsCompareMode(!isCompareMode);
                setCompareSelection([]);
              }}
              className={`h-7 px-2.5 gap-1.5 text-xs font-sans cursor-pointer ${
                isCompareMode
                  ? "bg-primary/10 text-primary border-primary/30 font-semibold"
                  : "bg-card border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns2 className="size-3.5" />
              <span>{isCompareMode ? "Exit compare" : "Compare two"}</span>
            </Button>

            <span className="font-mono text-[10px] font-semibold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded border border-border/60 uppercase">
              6 CONCEPTS
            </span>
          </div>
        </div>

        {/* Global Error Banner (if any) */}
        {globalError && (
          <div className="px-6 py-2.5 bg-destructive/10 border-b border-destructive/20 text-destructive text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span className="font-medium">{globalError.message}</span>
            </div>
            {globalError.type === "credits" && (
              <Link
                href="/dashboard/creator/credits"
                target="_blank"
                className="inline-flex items-center gap-1 font-semibold underline hover:opacity-85"
              >
                Top up credits <ArrowRight className="size-3" />
              </Link>
            )}
          </div>
        )}

        {/* Compare Mode Helper Strip */}
        {isCompareMode && (
          <div className="px-6 sm:px-8 py-2 bg-primary/5 border-b border-primary/20 text-xs flex items-center justify-between shrink-0">
            <span className="font-medium text-foreground font-sans">
              Select {2 - compareSelection.length} more concept{compareSelection.length === 1 ? "" : "s"} to compare side-by-side.
            </span>
            {compareSelection.length === 2 && (
              <Button
                size="sm"
                onClick={() => setShowCompareOverlay(true)}
                className="h-6 px-2.5 text-xs bg-primary text-primary-foreground font-sans"
              >
                Open Comparison
              </Button>
            )}
          </div>
        )}

        {/* 3. Scrollable Main 3x2 Grid Area */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {isLoadingInitial ? (
            <div className="flex flex-col items-center justify-center min-h-[420px] gap-3">
              <RefreshCw className="size-8 text-primary animate-spin" />
              <div className="text-center">
                <h3 className="font-heading font-semibold text-sm text-foreground">
                  Generating 6 parametric brand concepts...
                </h3>
                <p className="text-xs text-muted-foreground mt-1 font-sans">
                  Synthesizing direction archetype, motif geometry, and typographic pairings.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {concepts.map((concept, idx) => (
                <ConceptTile
                  key={concept.key || `concept_${idx + 1}`}
                  concept={concept}
                  index={idx}
                  isSelected={selectedConceptKey === concept.key}
                  isRegenerating={Boolean(regeneratingKeys[concept.key])}
                  error={tileErrors[concept.key] ?? null}
                  viewMode={viewMode}
                  businessName={businessName}
                  onSelect={() => handleSelectConcept(concept.key)}
                  onRegenerate={() => handleRegenerateConcept(concept.key)}
                  isCompareMode={isCompareMode}
                  isCompareSelected={compareSelection.includes(concept.key)}
                  onToggleCompare={() => handleToggleCompareSelection(concept.key)}
                  disabled={isConfirming}
                />
              ))}
            </div>
          )}
        </div>

        {/* 4. Modal Footer Bar */}
        <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-t border-border/60 bg-muted/15 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground font-sans">
              Selected:{" "}
              <strong className="text-foreground font-semibold">
                {selectedConceptTitle}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={closeHandler}
              disabled={isConfirming}
              className="cursor-pointer font-sans"
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={!selectedConceptKey || isConfirming || isLoadingInitial}
              onClick={handleConfirmSelection}
              className="gap-1.5 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer font-sans"
            >
              {isConfirming ? (
                <>
                  <RefreshCw className="size-3.5 animate-spin" />
                  <span>Confirming Mark...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Use {selectedConceptTitle}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Full-Screen / Modal Compare Overlay */}
        {showCompareOverlay && compareSelection.length === 2 && (
          <CompareOverlay
            conceptA={concepts.find((c) => c.key === compareSelection[0])!}
            conceptB={concepts.find((c) => c.key === compareSelection[1])!}
            onSelect={(key) => {
              setSelectedConceptKey(key);
              setShowCompareOverlay(false);
              setIsCompareMode(false);
              setCompareSelection([]);
            }}
            onClose={() => setShowCompareOverlay(false)}
          />
        )}

      </div>
    </div>
  );
}

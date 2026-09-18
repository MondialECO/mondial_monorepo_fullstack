"use client";

import React, { useState, useMemo } from "react";
import { BrandKit, BrandStrategy } from "@/types/creator/brand-kit";
import {
  Check,
  CheckCircle2,
  Edit3,
  Globe,
  Plus,
  X,
  Lock,
  Loader2,
  FileText,
  Smartphone,
  Layers,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalWorkflowHeader } from "./ModalWorkflowHeader";
import { formatDistanceToNowStrict } from "date-fns";

interface StrategyReviewModalProps {
  kit: BrandKit;
  onClose: () => void;
  onConfirm: (updatedStrategy: Partial<BrandStrategy>) => Promise<void>;
  isSubmitting?: boolean;
}

const SUGGESTED_PERSONALITY_TRAITS = [
  "Direct",
  "Calm",
  "Practical",
  "Modern",
  "Trustworthy",
  "Playful",
  "Bold",
  "Premium",
  "Technical",
  "Warm",
];

const FIRST_APPEARANCE_OPTIONS = [
  { id: "invoice", label: "Invoice header", icon: FileText },
  { id: "app_icon", label: "App icon", icon: Smartphone },
  { id: "website", label: "Website hero", icon: Globe },
  { id: "saas", label: "Product / SaaS", icon: Layers },
];

function formatEditedTime(
  isLocallyEdited: boolean,
  savedEditedAt?: string | Date | null
): string | null {
  if (isLocallyEdited) {
    return "EDITED JUST NOW";
  }
  if (!savedEditedAt) {
    return null;
  }
  try {
    const d = typeof savedEditedAt === "string" ? new Date(savedEditedAt) : savedEditedAt;
    if (isNaN(d.getTime())) return null;
    const distance = formatDistanceToNowStrict(d, { addSuffix: true });
    return `EDITED ${distance.toUpperCase()}`;
  } catch {
    return null;
  }
}

export function StrategyReviewModal({
  kit,
  onClose,
  onConfirm,
  isSubmitting = false,
}: StrategyReviewModalProps) {
  const strategy = kit?.strategy;

  // Real Database Field Ingestion directly from MongoDB BrandKit/CreatorIdea
  const [businessName, setBusinessName] = useState(
    strategy?.businessName || (kit as any)?.businessName || ""
  );
  const [concept, setConcept] = useState(strategy?.concept?.value || "");
  const [targetAudience, setTargetAudience] = useState(
    strategy?.targetAudience?.value || ""
  );
  const [industry, setIndustry] = useState(strategy?.industry?.value || "");
  const [positioning, setPositioning] = useState(
    strategy?.positioning?.value || ""
  );

  // Field provenance / edit flags (tracks user modifications vs derived/stated from idea)
  const [editedFields, setEditedFields] = useState<Record<string, boolean>>({});
  const [editingField, setEditingField] = useState<string | null>(null);

  // Computed edit flags and real relative timestamps for all 4 provenanced fields
  const isBusinessNameEdited = Boolean(editedFields["businessName"]);
  const isConceptEdited = Boolean(
    editedFields["concept"] ||
      (strategy?.concept?.editedAt && strategy?.concept?.provenance === "user_refined")
  );
  const isAudienceEdited = Boolean(
    editedFields["targetAudience"] ||
      (strategy?.targetAudience?.editedAt && strategy?.targetAudience?.provenance === "user_refined")
  );
  const isIndustryEdited = Boolean(
    editedFields["industry"] ||
      (strategy?.industry?.editedAt && strategy?.industry?.provenance === "user_refined")
  );
  const isPositioningEdited = Boolean(
    editedFields["positioning"] ||
      (strategy?.positioning?.editedAt && strategy?.positioning?.provenance === "user_refined")
  );

  const conceptEditedTime = formatEditedTime(
    Boolean(editedFields["concept"]),
    strategy?.concept?.editedAt
  );
  const audienceEditedTime = formatEditedTime(
    Boolean(editedFields["targetAudience"]),
    strategy?.targetAudience?.editedAt
  );
  const industryEditedTime = formatEditedTime(
    Boolean(editedFields["industry"]),
    strategy?.industry?.editedAt
  );
  const positioningEditedTime = formatEditedTime(
    Boolean(editedFields["positioning"]),
    strategy?.positioning?.editedAt
  );

  // Name display form choices derived dynamically from real businessName
  const casingVariants = useMemo(() => {
    const raw = businessName.trim();
    if (!raw) {
      return [
        { id: "original", label: "" },
        { id: "uppercase", label: "" },
        { id: "lowercase", label: "" },
      ];
    }

    const separated = raw
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");

    const uppercase = raw.toUpperCase();
    const lowercase = raw.toLowerCase();

    const options: { id: string; label: string }[] = [];

    // 1. Original / Stated Form (e.g., "Instaly" or "AutoInvoice")
    options.push({ id: "original", label: raw });

    // 2. ALL CAPS / Uppercase (e.g., "INSTALY" or "AUTOINVOICE")
    if (uppercase !== raw) {
      options.push({ id: "uppercase", label: uppercase });
    }

    // 3. Separated Form (if distinct from raw, e.g. "Auto Invoice")
    if (
      separated !== raw &&
      separated.toUpperCase() !== uppercase &&
      separated.toLowerCase() !== lowercase
    ) {
      options.push({ id: "separated", label: separated });
    }

    // 4. all lowercase (e.g., "instaly" or "autoinvoice")
    if (lowercase !== raw && lowercase !== uppercase) {
      options.push({ id: "lowercase", label: lowercase });
    }

    // Deduplicate by label just in case
    const seen = new Set<string>();
    const uniqueOptions: { id: string; label: string }[] = [];
    for (const opt of options) {
      if (!seen.has(opt.label)) {
        seen.add(opt.label);
        uniqueOptions.push(opt);
      }
    }

    return uniqueOptions;
  }, [businessName]);

  const [nameDisplayForm, setNameDisplayForm] = useState(
    strategy?.nameDisplayForm || (businessName.trim() ? businessName.trim() : "")
  );

  // Personality traits pills - directly from real strategy array
  const [traits, setTraits] = useState<string[]>(
    strategy?.personalityTraits && strategy.personalityTraits.length > 0
      ? strategy.personalityTraits
      : ["Precise", "Resilient", "Autonomous"]
  );
  const [newTraitInput, setNewTraitInput] = useState("");
  const [showAddTraitInput, setShowAddTraitInput] = useState(false);

  const handleAddTrait = (traitName: string) => {
    const trimmed = traitName.trim();
    if (trimmed && !traits.includes(trimmed)) {
      setTraits([...traits, trimmed]);
      setNewTraitInput("");
      setShowAddTraitInput(false);
    }
  };

  const handleRemoveTrait = (traitToRemove: string) => {
    setTraits(traits.filter((t) => t !== traitToRemove));
  };

  // Tone position (1 to 5 scale: 1=Formal, 5=Casual, 3=Balanced, 4=Approachable)
  const tonePositionMap: Record<string, number> = {
    formal: 1,
    structured: 2,
    balanced: 3,
    approachable: 4,
    casual: 5,
  };
  const [toneScale, setToneScale] = useState<number>(
    strategy?.tonePosition ? tonePositionMap[strategy.tonePosition] || 3 : 3
  );

  // First appearance
  const [firstAppearance, setFirstAppearance] = useState<string>(
    strategy?.firstAppearance || "website"
  );

  // Remaining choices count calculation
  const remainingCount = useMemo(() => {
    let count = 0;
    if (!nameDisplayForm) count++;
    if (traits.length < 3) count++;
    if (!toneScale) count++;
    if (!firstAppearance) count++;
    return count;
  }, [nameDisplayForm, traits.length, toneScale, firstAppearance]);

  const handleSaveAndConfirm = async () => {
    const toneMapping: Record<number, string> = {
      1: "formal",
      2: "structured",
      3: "balanced",
      4: "approachable",
      5: "casual",
    };

    const payload: Partial<BrandStrategy> = {
      businessName,
      nameDisplayForm,
      concept: {
        value: concept,
        provenance: editedFields["concept"] ? "user_refined" : strategy?.concept?.provenance || "stated",
        editedAt: editedFields["concept"] ? new Date().toISOString() : strategy?.concept?.editedAt,
      },
      targetAudience: {
        value: targetAudience,
        provenance: editedFields["targetAudience"] ? "user_refined" : strategy?.targetAudience?.provenance || "stated",
        editedAt: editedFields["targetAudience"] ? new Date().toISOString() : strategy?.targetAudience?.editedAt,
      },
      industry: {
        value: industry,
        provenance: editedFields["industry"] ? "user_refined" : strategy?.industry?.provenance || "stated",
        editedAt: editedFields["industry"] ? new Date().toISOString() : strategy?.industry?.editedAt,
      },
      positioning: {
        value: positioning,
        provenance: editedFields["positioning"] ? "user_refined" : strategy?.positioning?.provenance || "stated",
        editedAt: editedFields["positioning"] ? new Date().toISOString() : strategy?.positioning?.editedAt,
      },
      personalityTraits: traits,
      tonePosition: toneMapping[toneScale] || "balanced",
      firstAppearance,
      confirmedAt: new Date().toISOString(),
    };

    await onConfirm(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-5 lg:p-6 overflow-y-auto">
      <div className="relative flex flex-col w-full max-w-[1080px] max-h-[94vh] rounded-2xl sm:rounded-3xl bg-card border border-border/90 shadow-2xl overflow-hidden animate-in fade-in duration-200">
        
        {/* Modal Header & 6-Step Workflow Track (Figma Node 57003:9812) */}
        <ModalWorkflowHeader
          title="Confirm your brand strategy"
          subtitle="Pulled from your idea. Correct anything that's off — this drives every visual choice after it."
          currentStep={1}
          onClose={onClose}
        />

        {/* Modal Scrollable Body - 2 Column Split (58% / 42%) */}
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[calc(94vh-180px)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* LEFT COLUMN: Core Venture Confirmations (58% / 7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h2 className="text-section-heading font-semibold text-foreground tracking-tight font-heading">
                    Review what we derived from your idea
                  </h2>
                  <p className="text-caption text-muted-foreground font-sans">
                    Click any field to correct — changes update downstream steps.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md text-badge font-medium bg-muted/70 text-foreground/80 border border-border/60 font-sans">
                  <span className="font-mono font-semibold text-foreground">5</span> FIELDS
                </span>
              </div>

              {/* Field 1: Business Name */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-2 transition-all hover:border-border">
                <div className="flex items-center justify-between">
                  <span className="text-badge font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                    BUSINESS NAME
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-badge font-medium border font-sans ${
                      isBusinessNameEdited
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                        : "bg-muted/60 text-muted-foreground border-border/50"
                    }`}>
                      {isBusinessNameEdited ? "Edited" : "From your idea"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingField(editingField === "businessName" ? null : "businessName")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                      title="Edit Business Name"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {editingField === "businessName" ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => {
                        setBusinessName(e.target.value);
                        setEditedFields((prev) => ({ ...prev, businessName: true }));
                      }}
                      className="w-full rounded-lg border border-primary bg-background px-3 py-1.5 text-body font-medium text-foreground focus:outline-none font-sans"
                    />
                    <Button
                      size="sm"
                      onClick={() => setEditingField(null)}
                      className="h-8 px-3 text-button bg-primary text-primary-foreground cursor-pointer font-sans"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <p className="text-body font-medium text-foreground font-sans">{businessName}</p>
                )}
              </div>

              {/* Field 2: One-Line Concept */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-2 transition-all hover:border-border">
                <div className="flex items-center justify-between">
                  <span className="text-badge font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                    ONE-LINE CONCEPT
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-badge font-medium border font-sans ${
                      isConceptEdited
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                        : "bg-muted/60 text-muted-foreground border-border/50"
                    }`}>
                      {isConceptEdited ? "Edited" : "From your idea"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingField(editingField === "concept" ? null : "concept")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                      title="Edit Concept"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {editingField === "concept" ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      value={concept}
                      onChange={(e) => {
                        setConcept(e.target.value);
                        setEditedFields((prev) => ({ ...prev, concept: true }));
                      }}
                      className="w-full rounded-lg border border-primary bg-background p-2.5 text-body font-sans text-foreground focus:outline-none leading-relaxed"
                    />
                    <Button
                      size="sm"
                      onClick={() => setEditingField(null)}
                      className="h-8 px-3 text-button bg-primary text-primary-foreground cursor-pointer font-sans"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-body font-sans text-foreground/90 leading-relaxed">{concept}</p>
                    {conceptEditedTime && (
                      <p className="text-badge font-medium text-muted-foreground/75 uppercase tracking-wider font-sans pt-1">
                        {conceptEditedTime}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Field 3: Target Audience */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-2 transition-all hover:border-border">
                <div className="flex items-center justify-between">
                  <span className="text-badge font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                    TARGET AUDIENCE
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-badge font-medium border font-sans ${
                      isAudienceEdited
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                        : "bg-muted/60 text-muted-foreground border-border/50"
                    }`}>
                      {isAudienceEdited ? "Edited" : "From your idea"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingField(editingField === "targetAudience" ? null : "targetAudience")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                      title="Edit Target Audience"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {editingField === "targetAudience" ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      value={targetAudience}
                      onChange={(e) => {
                        setTargetAudience(e.target.value);
                        setEditedFields((prev) => ({ ...prev, targetAudience: true }));
                      }}
                      className="w-full rounded-lg border border-primary bg-background p-2.5 text-body font-sans text-foreground focus:outline-none leading-relaxed"
                    />
                    <Button
                      size="sm"
                      onClick={() => setEditingField(null)}
                      className="h-8 px-3 text-button bg-primary text-primary-foreground cursor-pointer font-sans"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-body font-sans text-foreground/90 leading-relaxed">{targetAudience}</p>
                    {audienceEditedTime && (
                      <p className="text-badge font-medium text-muted-foreground/75 uppercase tracking-wider font-sans pt-1">
                        {audienceEditedTime}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Field 4: Industry */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-2 transition-all hover:border-border">
                <div className="flex items-center justify-between">
                  <span className="text-badge font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                    INDUSTRY
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-badge font-medium border font-sans ${
                      isIndustryEdited
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                        : "bg-muted/60 text-muted-foreground border-border/50"
                    }`}>
                      {isIndustryEdited ? "Edited" : "From your idea"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingField(editingField === "industry" ? null : "industry")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                      title="Edit Industry"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {editingField === "industry" ? (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => {
                        setIndustry(e.target.value);
                        setEditedFields((prev) => ({ ...prev, industry: true }));
                      }}
                      className="w-full rounded-lg border border-primary bg-background px-3 py-1.5 text-body font-medium text-foreground focus:outline-none font-sans"
                    />
                    <Button
                      size="sm"
                      onClick={() => setEditingField(null)}
                      className="h-8 px-3 text-button bg-primary text-primary-foreground cursor-pointer font-sans"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-caption font-medium font-sans">
                        {industry}
                      </span>
                      <span className="text-caption text-muted-foreground font-sans">
                        Used to shortlist visual directions.
                      </span>
                    </div>
                    {industryEditedTime && (
                      <p className="text-badge font-medium text-muted-foreground/75 uppercase tracking-wider font-sans pt-1">
                        {industryEditedTime}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Field 5: Positioning */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-2 transition-all hover:border-border">
                <div className="flex items-center justify-between">
                  <span className="text-badge font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                    POSITIONING
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-badge font-medium border font-sans ${
                      isPositioningEdited
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                        : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                    }`}>
                      {isPositioningEdited ? "Edited" : "From your idea"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingField(editingField === "positioning" ? null : "positioning")}
                      className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                      title="Edit Positioning"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {editingField === "positioning" ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      rows={2}
                      value={positioning}
                      onChange={(e) => {
                        setPositioning(e.target.value);
                        setEditedFields((prev) => ({ ...prev, positioning: true }));
                      }}
                      className="w-full rounded-lg border border-primary bg-background p-2.5 text-body font-sans text-foreground focus:outline-none leading-relaxed"
                    />
                    <Button
                      size="sm"
                      onClick={() => setEditingField(null)}
                      className="h-8 px-3 text-button bg-primary text-primary-foreground cursor-pointer font-sans"
                    >
                      Done
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="text-body font-sans text-foreground/90 leading-relaxed">{positioning}</p>
                    {positioningEditedTime && (
                      <p className="text-badge font-medium text-muted-foreground/75 uppercase tracking-wider font-sans pt-1">
                        {positioningEditedTime}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Choices (42% / 5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <h2 className="text-section-heading font-semibold text-foreground tracking-tight font-heading">
                    What we need from you
                  </h2>
                  <p className="text-caption text-muted-foreground font-sans">
                    Six quick choices — nothing to type
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md text-badge font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-sans">
                  <span className="font-mono font-semibold">{remainingCount}</span> LEFT
                </span>
              </div>

              {/* Choice Card A: Name Display Form */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-badge font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                    NAME DISPLAY FORM
                  </span>
                  {nameDisplayForm && (
                    <div className="flex size-4 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div
                  className={`grid ${
                    casingVariants.length >= 4
                      ? "grid-cols-2 sm:grid-cols-4"
                      : casingVariants.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-3"
                  } gap-2`}
                >
                  {casingVariants.map((variant) => {
                    const isSelected = nameDisplayForm === variant.label;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setNameDisplayForm(variant.label)}
                        className={`px-3 py-2.5 rounded-lg border text-caption font-medium transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer font-sans ${
                          isSelected
                            ? "border-primary bg-primary/10 text-foreground font-semibold shadow-2xs"
                            : "border-border/70 bg-card/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        <span className="truncate">{variant.label}</span>
                        {isSelected && <span className="size-1.5 rounded-full bg-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <p className="text-caption text-muted-foreground font-sans">
                  How your name will be set in the logo.
                </p>
              </div>

              {/* Choice Card B: Brand Personality */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-badge font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                    BRAND PERSONALITY
                  </span>
                  {traits.length >= 3 && (
                    <div className="flex size-4 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {/* Selected Pills */}
                  {traits.map((trait) => (
                    <span
                      key={trait}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-caption font-medium bg-primary/10 text-foreground border border-primary/25 font-sans"
                    >
                      <span>{trait}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTrait(trait)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                        aria-label={`Remove ${trait}`}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}

                  {/* Unselected Suggestion Pills */}
                  {SUGGESTED_PERSONALITY_TRAITS.filter((t) => !traits.includes(t)).map((trait) => (
                    <button
                      key={trait}
                      type="button"
                      onClick={() => handleAddTrait(trait)}
                      className="px-2.5 py-1 rounded-md text-caption font-medium bg-card border border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer font-sans"
                    >
                      {trait}
                    </button>
                  ))}

                  {/* Add Custom Pill */}
                  {showAddTraitInput ? (
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        value={newTraitInput}
                        onChange={(e) => setNewTraitInput(e.target.value)}
                        placeholder="Custom..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTrait(newTraitInput);
                          }
                        }}
                        className="w-20 rounded-md border border-primary bg-background px-2 py-0.5 text-caption font-sans text-foreground focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTrait(newTraitInput)}
                        className="p-1 rounded bg-primary text-primary-foreground text-caption cursor-pointer"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowAddTraitInput(true)}
                      className="px-2.5 py-1 rounded-md text-caption font-medium border border-dashed border-border/90 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors cursor-pointer font-sans"
                    >
                      + Add your own
                    </button>
                  )}
                </div>

                <p className="text-caption text-muted-foreground font-sans">
                  Pick <span className="font-mono font-medium text-foreground">3</span>-<span className="font-mono font-medium text-foreground">5</span>. This is the strongest signal for how your brand looks.
                </p>
              </div>

              {/* Choice Card C: Tone */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-badge font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                    TONE
                  </span>
                  {toneScale && (
                    <div className="flex size-4 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-caption text-muted-foreground font-sans">
                    <span className={toneScale <= 2 ? "text-foreground font-semibold" : ""}>Formal</span>
                    <span className={toneScale >= 4 ? "text-foreground font-semibold" : ""}>Casual</span>
                  </div>

                  {/* 5 Tick Positions Interactive Track */}
                  <div className="relative flex items-center justify-between h-5 px-1">
                    <div className="absolute left-2 right-2 h-0.5 bg-border/80 rounded-full" />
                    {[1, 2, 3, 4, 5].map((pos) => {
                      const isActive = toneScale === pos;
                      return (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => setToneScale(pos)}
                          className="relative z-10 size-4 rounded-full flex items-center justify-center transition-all cursor-pointer"
                          aria-label={`Set tone to position ${pos}`}
                        >
                          <span
                            className={`size-3 rounded-full transition-all ${
                              isActive
                                ? "bg-primary ring-4 ring-primary/20 scale-110"
                                : "bg-card border border-border/90 hover:border-primary/50"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <p className="text-caption text-muted-foreground font-sans">
                  {targetAudience ? `Tailored for ${targetAudience}.` : "Calibrate how your brand speaks to your target audience."}
                </p>
              </div>

              {/* Choice Card D: First Place It Appears */}
              <div className="rounded-xl border border-border/80 bg-background/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-badge font-semibold uppercase tracking-wider text-muted-foreground font-heading">
                    FIRST PLACE IT APPEARS
                  </span>
                  {firstAppearance && (
                    <div className="flex size-4 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Check className="size-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {FIRST_APPEARANCE_OPTIONS.map((opt) => {
                    const isSelected = firstAppearance === opt.id;
                    const IconComp = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFirstAppearance(opt.id)}
                        className={`h-11 px-3 rounded-lg border text-caption font-medium transition-all flex items-center gap-2 cursor-pointer font-sans ${
                          isSelected
                            ? "border-primary bg-primary/10 text-foreground font-semibold shadow-2xs"
                            : "border-border/70 bg-card/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        }`}
                      >
                        <IconComp className={`size-3.5 ${isSelected ? "text-primary" : "text-muted-foreground/80"}`} />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="px-6 sm:px-8 py-4 border-t border-border/80 bg-card/90 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-caption text-muted-foreground font-sans">
            <span className="font-mono text-badge font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              <span className="font-mono font-semibold">0</span> CREDITS
            </span>
            <span>Refining strategy is free of charge. Everything cascades automatically.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl border-border/80 text-button font-medium font-sans cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAndConfirm}
              disabled={isSubmitting || !businessName.trim()}
              className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-button font-medium h-9 px-5 inline-flex items-center gap-2 cursor-pointer transition-all shadow-xs font-sans"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Confirming…</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Confirm Brand Strategy</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

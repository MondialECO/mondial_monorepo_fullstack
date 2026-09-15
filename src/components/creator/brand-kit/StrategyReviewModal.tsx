"use client";

import React, { useState } from "react";
import { BrandKit, BrandStrategy } from "@/types/creator/brand-kit";
import {
  Check,
  CheckCircle2,
  Edit3,
  Globe,
  Plus,
  Sliders,
  Sparkles,
  Tag,
  X,
  ShieldAlert,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface StrategyReviewModalProps {
  kit: BrandKit;
  onClose: () => void;
  onConfirm: (updatedStrategy: Partial<BrandStrategy>) => Promise<void>;
  isSubmitting?: boolean;
}

export function StrategyReviewModal({
  kit,
  onClose,
  onConfirm,
  isSubmitting = false,
}: StrategyReviewModalProps) {
  const strategy = kit.strategy || {
    businessName: "CyberLock",
    nameDisplayForm: "CyberLock",
    concept: { value: "Autonomous AI defense system for cloud infrastructure.", provenance: "stated" },
    targetAudience: { value: "Enterprise DevOps and SecOps teams", provenance: "stated" },
    industry: { value: "Cybersecurity & Cloud Infrastructure", provenance: "stated" },
    positioning: { value: "Zero-compromise cloud security automation.", provenance: "stated" },
    personalityTraits: ["Precise", "Resilient", "Autonomous"],
    avoidList: ["Cliché padlocks", "Generic shields"],
    tonePosition: "balanced",
    firstAppearance: "website",
    symbolFeeling: "The Guardian",
    confirmedAt: null,
  };

  // State for editable fields
  const [businessName, setBusinessName] = useState(strategy.businessName || "");
  const [concept, setConcept] = useState(strategy.concept?.value || "");
  const [targetAudience, setTargetAudience] = useState(strategy.targetAudience?.value || "");
  const [industry, setIndustry] = useState(strategy.industry?.value || "");
  const [positioning, setPositioning] = useState(strategy.positioning?.value || "");

  // Editing toggle flags
  const [editingField, setEditingField] = useState<string | null>(null);

  // Name display form options derived from businessName
  const getCasingVariants = (name: string) => {
    const raw = name.trim() || "Brand Name";
    return [
      { id: "standard", label: raw, note: "Standard / As Entered" },
      { id: "uppercase", label: raw.toUpperCase(), note: "All Caps Display" },
      {
        id: "lowercase",
        label: raw.toLowerCase(),
        note: "Modern Lowercase",
      },
    ];
  };

  const casingVariants = getCasingVariants(businessName);
  const [nameDisplayForm, setNameDisplayForm] = useState(
    strategy.nameDisplayForm || casingVariants[0].label
  );

  // Personality traits pills
  const [traits, setTraits] = useState<string[]>(
    strategy.personalityTraits && strategy.personalityTraits.length > 0
      ? strategy.personalityTraits
      : ["Precise", "Resilient", "Autonomous"]
  );
  const [newTraitInput, setNewTraitInput] = useState("");

  const handleAddTrait = () => {
    const trimmed = newTraitInput.trim();
    if (trimmed && !traits.includes(trimmed)) {
      setTraits([...traits, trimmed]);
      setNewTraitInput("");
    }
  };

  const handleRemoveTrait = (traitToRemove: string) => {
    setTraits(traits.filter((t) => t !== traitToRemove));
  };

  // Avoidances list
  const [avoidList, setAvoidList] = useState<string[]>(
    strategy.avoidList && strategy.avoidList.length > 0
      ? strategy.avoidList
      : ["Cliché padlocks", "Generic shields"]
  );
  const [newAvoidInput, setNewAvoidInput] = useState("");

  const suggestedAvoidances = [
    "Cliché padlocks",
    "Generic shields",
    "Overused swooshes",
    "Literal circuit lines",
    "Gaudy gradients",
  ].filter((item) => !avoidList.includes(item));

  const handleAddAvoid = (itemToAdd: string) => {
    const trimmed = itemToAdd.trim();
    if (trimmed && !avoidList.includes(trimmed)) {
      setAvoidList([...avoidList, trimmed]);
      setNewAvoidInput("");
    }
  };

  const handleRemoveAvoid = (itemToRemove: string) => {
    setAvoidList(avoidList.filter((a) => a !== itemToRemove));
  };

  // Tone & First appearance
  const [tonePosition, setTonePosition] = useState(strategy.tonePosition || "balanced");
  const [firstAppearance, setFirstAppearance] = useState(strategy.firstAppearance || "website");

  const handleSaveAndConfirm = async () => {
    const payload: Partial<BrandStrategy> = {
      businessName,
      nameDisplayForm,
      concept: {
        value: concept,
        provenance: strategy.concept?.provenance || "stated",
        editedAt: new Date().toISOString(),
      },
      targetAudience: {
        value: targetAudience,
        provenance: strategy.targetAudience?.provenance || "stated",
        editedAt: new Date().toISOString(),
      },
      industry: {
        value: industry,
        provenance: strategy.industry?.provenance || "stated",
        editedAt: new Date().toISOString(),
      },
      positioning: {
        value: positioning,
        provenance: strategy.positioning?.provenance || "stated",
        editedAt: new Date().toISOString(),
      },
      personalityTraits: traits,
      avoidList: avoidList,
      tonePosition,
      firstAppearance,
      confirmedAt: new Date().toISOString(),
    };

    await onConfirm(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 md:p-6 overflow-y-auto">
      <div className="relative flex flex-col w-full max-w-5xl max-h-[92vh] rounded-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 md:px-8 md:py-6 border-b border-border/80 bg-background/50">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20">
                <span className="font-mono font-semibold mr-1">STEP 1 OF 6</span> • BRAND STRATEGY
              </span>
              <span className="text-xs text-muted-foreground font-mono">{businessName}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Brand Strategy Foundation
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Review and calibrate the core strategic pillars pulled from your venture project before proceeding to visual direction.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors self-start sm:self-center"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 md:p-8 space-y-7 overflow-y-auto">
          {/* Section 1: Pulled Strategic Foundations */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                1. Core Venture Inputs (Pulled from Project)
              </h2>
              <span className="text-[11px] font-mono text-muted-foreground">
                Click any card or edit button to refine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Card 1: Business Name */}
              <div className="rounded-xl border border-border/80 bg-white p-4 transition-all hover:border-primary/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-primary">
                    Business Name
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                    stated
                  </span>
                </div>
                {editingField === "businessName" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full rounded-md border border-primary px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingField(null)}
                      className="px-2.5 py-1 rounded-md bg-primary text-white text-[11px] font-medium"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">{businessName}</p>
                    <button
                      type="button"
                      onClick={() => setEditingField("businessName")}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Card 2: Industry / Sector */}
              <div className="rounded-xl border border-border/80 bg-white p-4 transition-all hover:border-primary/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-purple-600">
                    Industry / Sector
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                    {strategy.industry?.provenance || "stated"}
                  </span>
                </div>
                {editingField === "industry" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full rounded-md border border-primary px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingField(null)}
                      className="px-2.5 py-1 rounded-md bg-primary text-white text-[11px] font-medium"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-foreground">{industry}</p>
                    <button
                      type="button"
                      onClick={() => setEditingField("industry")}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Card 3: Concept */}
              <div className="rounded-xl border border-border/80 bg-white p-4 transition-all hover:border-primary/40 md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-blue-600">
                    Core Concept
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                    {strategy.concept?.provenance || "stated"}
                  </span>
                </div>
                {editingField === "concept" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={concept}
                      onChange={(e) => setConcept(e.target.value)}
                      className="w-full rounded-md border border-primary px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingField(null)}
                      className="px-2.5 py-1 rounded-md bg-primary text-white text-[11px] font-medium"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-foreground font-medium">{concept}</p>
                    <button
                      type="button"
                      onClick={() => setEditingField("concept")}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Card 4: Target Audience */}
              <div className="rounded-xl border border-border/80 bg-white p-4 transition-all hover:border-primary/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-600">
                    Target Audience
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                    {strategy.targetAudience?.provenance || "stated"}
                  </span>
                </div>
                {editingField === "targetAudience" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full rounded-md border border-primary px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingField(null)}
                      className="px-2.5 py-1 rounded-md bg-primary text-white text-[11px] font-medium"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-foreground font-medium">{targetAudience}</p>
                    <button
                      type="button"
                      onClick={() => setEditingField("targetAudience")}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Card 5: Positioning */}
              <div className="rounded-xl border border-border/80 bg-white p-4 transition-all hover:border-primary/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-amber-600">
                    Market Positioning
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-200">
                    {strategy.positioning?.provenance || "stated"}
                  </span>
                </div>
                {editingField === "positioning" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={positioning}
                      onChange={(e) => setPositioning(e.target.value)}
                      className="w-full rounded-md border border-primary px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingField(null)}
                      className="px-2.5 py-1 rounded-md bg-primary text-white text-[11px] font-medium"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-foreground font-medium">{positioning}</p>
                    <button
                      type="button"
                      onClick={() => setEditingField("positioning")}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Name Display Form Selector */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                2. Name Display Form
              </h2>
              <span className="text-[11px] text-muted-foreground">
                Determines default casing on brand marks & collateral
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {casingVariants.map((variant) => {
                const isSelected = nameDisplayForm === variant.label;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setNameDisplayForm(variant.label)}
                    className={`flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-2xs"
                        : "border-border/80 bg-white hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-foreground tracking-tight">
                        {variant.label}
                      </span>
                      {isSelected ? (
                        <div className="flex size-4 items-center justify-center rounded-full bg-primary text-white">
                          <Check className="size-2.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="size-4 rounded-full border border-border/80" />
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {variant.note}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Personality Traits Pills */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <Tag className="size-3.5 text-primary" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                  3. Personality Traits
                </h2>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Free to edit • {traits.length} selected
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 p-3.5 rounded-xl border border-border/80 bg-white">
              {traits.map((trait) => (
                <span
                  key={trait}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted/60 text-foreground border border-border/60 hover:border-rose-300 transition-colors"
                >
                  {trait}
                  <button
                    type="button"
                    onClick={() => handleRemoveTrait(trait)}
                    className="text-muted-foreground hover:text-rose-600 transition-colors"
                    title={`Remove ${trait}`}
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1.5 ml-auto">
                <input
                  type="text"
                  placeholder="Add trait..."
                  value={newTraitInput}
                  onChange={(e) => setNewTraitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTrait();
                    }
                  }}
                  className="w-32 rounded-lg border border-border/80 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddTrait}
                  disabled={!newTraitInput.trim()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-medium disabled:opacity-50"
                >
                  <Plus className="size-3" />
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Sector Avoidances */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="size-3.5 text-rose-500" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                  4. Visual Avoidances (Exclusions)
                </h2>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Free to edit • Clichés to avoid in logo & direction
              </span>
            </div>

            <div className="space-y-2.5 p-3.5 rounded-xl border border-border/80 bg-white">
              <div className="flex flex-wrap items-center gap-2">
                {avoidList.map((avoid) => (
                  <span
                    key={avoid}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"
                  >
                    {avoid}
                    <button
                      type="button"
                      onClick={() => handleRemoveAvoid(avoid)}
                      className="text-rose-500 hover:text-rose-800 transition-colors"
                      title={`Remove ${avoid}`}
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}

                <div className="flex items-center gap-1.5 ml-auto">
                  <input
                    type="text"
                    placeholder="Add avoidance..."
                    value={newAvoidInput}
                    onChange={(e) => setNewAvoidInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddAvoid(newAvoidInput);
                      }
                    }}
                    className="w-36 rounded-lg border border-border/80 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:border-rose-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddAvoid(newAvoidInput)}
                    disabled={!newAvoidInput.trim()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-medium disabled:opacity-50"
                  >
                    <Plus className="size-3" />
                    Add
                  </button>
                </div>
              </div>

              {suggestedAvoidances.length > 0 && (
                <div className="flex items-center gap-2 pt-2 border-t border-border/40">
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Suggestions:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedAvoidances.slice(0, 3).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleAddAvoid(item)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 border border-border/40"
                      >
                        <Plus className="size-2.5" />
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Tone & First Appearance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/80 bg-white p-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Sliders className="size-3.5 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                  Tone Position
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "balanced", label: "Balanced" },
                  { id: "technical", label: "Technical" },
                  { id: "approachable", label: "Approachable" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTonePosition(t.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium text-center border transition-all ${
                      tonePosition === t.id
                        ? "bg-primary text-white border-primary shadow-2xs"
                        : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border/80 bg-white p-4">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Globe className="size-3.5 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                  Primary Brand Medium
                </h3>
              </div>
              <select
                value={firstAppearance}
                onChange={(e) => setFirstAppearance(e.target.value)}
                className="w-full rounded-lg border border-border/80 bg-white px-3 py-1.5 text-xs font-medium text-foreground focus:border-primary focus:outline-none"
              >
                <option value="website">Digital & Website Hero</option>
                <option value="mobile_app">Mobile App & App Store Icon</option>
                <option value="presentation">Pitch Deck & Enterprise Reports</option>
                <option value="packaging">Physical Product & Packaging</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 md:px-8 border-t border-border/80 bg-background/60">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              0 CREDITS
            </span>
            <span>Refining strategy is free of charge</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border/80 bg-white text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndConfirm}
              disabled={isSubmitting || !businessName.trim()}
              className="inline-flex items-center gap-2 px-6 h-10 rounded-lg bg-primary text-sm font-semibold text-white shadow-md hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Confirm Brand Strategy
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

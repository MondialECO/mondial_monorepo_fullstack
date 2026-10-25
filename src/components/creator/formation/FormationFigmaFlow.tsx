'use client';

import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import type {
  FormationGenerator,
  FormationTypeCode,
} from '@/lib/api-creator-journey';

export interface FormationProjectContext {
  sector?: string;
  concept?: string;
  geography?: string;
  country?: string;
  userName?: string;
}

export interface FormationSetupPayload {
  mode?: 'solo' | 'team' | 'undecided';
  founderEquity?: number;
  plannedRole?: string;
  capitalAmount?: number;
  capitalConfirmed?: boolean;
}

export interface FormationFigmaFlowProps {
  formation: FormationGenerator;
  project?: FormationProjectContext | null;
  onSelectType: (type: FormationTypeCode) => Promise<void>;
  onContinue: (config?: FormationSetupPayload) => void;
  onBack: () => void;
  isSaving?: boolean;
}

export function FormationFigmaFlow({
  formation,
  project,
  onSelectType,
  onContinue,
  onBack,
  isSaving = false,
}: FormationFigmaFlowProps) {
  const { t } = useTranslation();
  // Dynamic context
  const sectorName = project?.sector ? project.sector : 'digital';
  const jurisdictionName = project?.geography || project?.country || 'France';
  const userInitial = (project?.userName?.[0] || 'Y').toUpperCase();

  // -------------------------------------------------------------
  // SECTION 3: Starting Plan Mode ('solo' | 'team' | 'undecided')
  // -------------------------------------------------------------
  const initialMode = (() => {
    if (formation.startingMode) return formation.startingMode;
    if (formation.cofounderDraft?.roleNeeded) return 'team';
    if (formation.recommendedType === 'SAS-U') return 'solo';
    if (formation.recommendedType === 'SAS') return 'team';
    return 'solo';
  })() as 'solo' | 'team' | 'undecided';

  const [startingMode, setStartingMode] = useState<'solo' | 'team' | 'undecided'>(initialMode);
  const [isModeExplicit, setIsModeExplicit] = useState<boolean>(Boolean(formation.startingMode));

  // -------------------------------------------------------------
  // SECTION 4: Structure Details & Exploration
  // -------------------------------------------------------------
  const [showOtherStructures, setShowOtherStructures] = useState(false);
  const currentStructureCode = formation.selectedType || formation.recommendedType || 'SAS-U';
  const displayStructureCode = currentStructureCode === 'SAS-U' ? 'SASU' : currentStructureCode;

  // Dynamic recommendation factors (reasons why it fits)
  const fitReasons = (() => {
    if (formation.recommendationFactors && formation.recommendationFactors.length > 0) {
      return formation.recommendationFactors.slice(0, 3).map((f) => f.implication);
    }
    return [
      startingMode === ‘solo’
        ? t(‘creator.phase3.formation.startingSoloReason’, ‘You’re starting alone.’)
        : t(‘creator.phase3.formation.startingTeamReason’, ‘You have a collaborative founding team.’),
      t(‘creator.phase3.formation.buildingToGrowReason’, ‘You’re building a company designed to grow.’),
      t(‘creator.phase3.formation.addInvestorsReason’, ‘You may want to add investors or shareholders later.’),
    ];
  })();

  // -------------------------------------------------------------
  // SECTION 5: Ownership Split
  // -------------------------------------------------------------
  const [isAdjustingOwnership, setIsAdjustingOwnership] = useState(false);
  const [isEquityExplicit, setIsEquityExplicit] = useState<boolean>(formation.founderEquity != null);
  const [founderEquity, setFounderEquity] = useState<number>(
    formation.founderEquity ?? (startingMode === 'solo' ? 100 : 70)
  );

  // -------------------------------------------------------------
  // SECTION 6: Leadership Role
  // -------------------------------------------------------------
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [isRoleExplicit, setIsRoleExplicit] = useState<boolean>(Boolean(formation.plannedRole));
  const [plannedRole, setPlannedRole] = useState<string>(
    formation.plannedRole ?? (currentStructureCode === 'SARL' ? 'Managing Director (Gérant)' : 'President')
  );

  // -------------------------------------------------------------
  // SECTION 7: Starting Capital Plan
  // -------------------------------------------------------------
  const initialCapitalValue = (() => {
    const opex = formation.forecastBasis?.opex;
    if (opex && opex > 0) {
      return Math.max(1000, Math.round((opex * 2) / 1000) * 1000);
    }
    return 5000;
  })();

  const currencySymbol = (() => {
    const c = formation.forecastBasis?.currency?.toUpperCase();
    if (c === 'USD' || c === '$') return '$';
    if (c === 'GBP' || c === '£') return '£';
    return '€';
  })();

  const [isCapitalInteracted, setIsCapitalInteracted] = useState<boolean>(
    formation.capitalConfirmed != null || formation.capitalAmount != null
  );
  const [capitalAmount, setCapitalAmount] = useState<number>(
    formation.capitalAmount ?? initialCapitalValue
  );
  const [capitalConfirmed, setCapitalConfirmed] = useState<boolean>(
    formation.capitalConfirmed === true
  );
  const [isEditingCapital, setIsEditingCapital] = useState(false);

  // -------------------------------------------------------------
  // SECTION 8 & 9: Skills & Team Composition
  // -------------------------------------------------------------
  const youCanHandleItems = (() => {
    if (formation.youHave && formation.youHave.length > 0) {
      return formation.youHave;
    }
    return ['Product direction', 'Customer research', 'Basic marketing'];
  })();

  const youMayNeedHelpItems = (() => {
    if (formation.youNeed && formation.youNeed.length > 0) {
      return formation.youNeed.map((g) => g.label);
    }
    return ['Backend development', 'Accounting setup', 'Legal review'];
  })();

  const notNeededYetItems = [
    'Full-time sales employee',
    'Customer-support team',
    'Operations manager',
  ];

  // Section 9: Highlighted expanded need (dynamically uses highest priority gap)
  const primaryExpandedNeed = formation.youNeed?.[0]?.label || 'Backend development';
  const [selectedPathway, setSelectedPathway] = useState<string>('external');

  // Handle starting mode switch
  const handleModeChange = (mode: 'solo' | 'team' | 'undecided') => {
    setStartingMode(mode);
    setIsModeExplicit(true);
    setIsEquityExplicit(true);
    if (mode === 'solo') {
      setFounderEquity(100);
    } else if (mode === 'team') {
      setFounderEquity(70);
    }
  };

  return (
    <div className="w-full min-w-0 space-y-6 text-foreground font-sans pb-16">
      {/* ========================================================
          SECTION 1 — QUIET INTRO
          ======================================================== */}
      <div className="pt-2 pb-1">
        <p className="text-body text-muted-foreground font-sans">
          {t('creator.phase3.formation.intro', 'Let’s work out how your company could be set up.')}
        </p>
      </div>

      {/* ========================================================
          SECTION 2 — YOUR SETUP SO FAR
          ======================================================== */}
      <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-2">
        <h2 className="text-card-title font-heading font-semibold text-foreground">
          {t('creator.phase3.formation.setupSoFar', 'Your setup so far')}
        </h2>
        <p className="text-body text-muted-foreground leading-relaxed">
          {t('creator.phase3.formation.setupSoFarDesc', {
            sector: sectorName.toLowerCase(),
            country: jurisdictionName,
          })}
        </p>
      </Card>

      {/* ========================================================
          SECTION 3 — HOW ARE YOU PLANNING TO START?
          ======================================================== */}
      <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-card-title font-heading font-semibold text-foreground">
            {t('creator.phase3.formation.planningStartTitle', 'How are you planning to start?')}
          </h2>
          <p className="text-label text-muted-foreground mt-0.5">
            {t('creator.phase3.formation.planningStartDesc', 'Choose what best matches your plan today. You can change this before formal company creation.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
          {/* Option 1: Just me */}
          <button
            type="button"
            onClick={() => void handleModeChange('solo')}
            className={cn(
              'group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              startingMode === 'solo'
                ? 'border-primary bg-secondary/80 ring-1 ring-primary/40 shadow-xs'
                : 'border-border/70 bg-card hover:border-primary/40 hover:bg-muted/30'
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-body font-semibold text-foreground">{t('creator.phase3.formation.modeSolo', 'Just me')}</span>
              <span
                className={cn(
                  'size-4 rounded-full flex items-center justify-center transition-colors',
                  startingMode === 'solo'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted border border-border/60'
                )}
              >
                {startingMode === 'solo' && <Check className="size-2.5 stroke-[3]" />}
              </span>
            </div>
            <p className="text-label text-muted-foreground mt-2 leading-relaxed">
              {t('creator.phase3.formation.modeSoloDesc', 'I’m starting the company on my own.')}
            </p>
          </button>

          {/* Option 2: With co-founders */}
          <button
            type="button"
            onClick={() => void handleModeChange('team')}
            className={cn(
              'group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              startingMode === 'team'
                ? 'border-primary bg-secondary/80 ring-1 ring-primary/40 shadow-xs'
                : 'border-border/70 bg-card hover:border-primary/40 hover:bg-muted/30'
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-body font-semibold text-foreground">{t('creator.phase3.formation.modeTeam', 'With co-founders')}</span>
              <span
                className={cn(
                  'size-4 rounded-full flex items-center justify-center transition-colors',
                  startingMode === 'team'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted border border-border/60'
                )}
              >
                {startingMode === 'team' && <Check className="size-2.5 stroke-[3]" />}
              </span>
            </div>
            <p className="text-label text-muted-foreground mt-2 leading-relaxed">
              {t('creator.phase3.formation.modeTeamDesc', 'One or more people will own the company with me.')}
            </p>
          </button>

          {/* Option 3: I’m not sure yet */}
          <button
            type="button"
            onClick={() => void handleModeChange('undecided')}
            className={cn(
              'group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              startingMode === 'undecided'
                ? 'border-primary bg-secondary/80 ring-1 ring-primary/40 shadow-xs'
                : 'border-border/70 bg-card hover:border-primary/40 hover:bg-muted/30'
            )}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-body font-semibold text-foreground">{t('creator.phase3.formation.modeUndecided', 'I’m not sure yet')}</span>
              <span
                className={cn(
                  'size-4 rounded-full flex items-center justify-center transition-colors',
                  startingMode === 'undecided'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted border border-border/60'
                )}
              >
                {startingMode === 'undecided' && <Check className="size-2.5 stroke-[3]" />}
              </span>
            </div>
            <p className="text-label text-muted-foreground mt-2 leading-relaxed">
              {t('creator.phase3.formation.modeUndecidedDesc', 'Help me understand what changes.')}
            </p>
          </button>
        </div>
      </Card>

      {/* ========================================================
          SECTION 4 — A STRUCTURE TO CONSIDER
          ======================================================== */}
      <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-card-title font-heading font-semibold text-foreground">
            {t('creator.phase3.formation.structureTitle', 'Your company structure')}
          </h2>
          <p className="text-label text-muted-foreground mt-0.5">
            {t('creator.phase3.formation.structureDesc', 'MBC is not choosing a legal structure for you. We’re showing an option that matches what you’ve told us so far.')}
          </p>
        </div>

        {/* Inner recommendation block */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-footnote font-semibold uppercase tracking-wider text-muted-foreground">
              {t('creator.phase3.formation.structureConsider', 'A STRUCTURE TO CONSIDER')}
            </span>
            <span className="inline-flex items-center rounded-full bg-secondary border border-primary/20 px-2.5 py-0.5 text-badge font-medium text-primary">
              {t('creator.phase3.formation.worthConsidering', 'Worth considering')}
            </span>
          </div>

          <div>
            <h3 className="text-2xl font-bold font-mono tracking-tight text-foreground">
              {displayStructureCode}
            </h3>
            <p className="text-label text-muted-foreground mt-1">
              {displayStructureCode === 'SASU'
                ? t('creator.phase3.formation.sasuDesc', 'A structure often considered by founders who start alone and want flexibility if the company grows later.')
                : displayStructureCode === 'SAS'
                ? t('creator.phase3.formation.sasDesc', 'Simplified joint-stock company designed for multiple shareholders and high growth potential.')
                : t('creator.phase3.formation.sarlDesc', 'Traditional limited liability structure suited for family ventures and stable commercial trade.')}
            </p>
          </div>

          {/* Two columns: Why it fits vs Things to think about */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-border/50">
            {/* Left: Why it may fit */}
            <div className="space-y-2.5">
              <h4 className="text-footnote font-semibold uppercase tracking-wider text-foreground">
                {t('creator.phase3.formation.whyFit', 'WHY IT MAY FIT YOUR PLAN')}
              </h4>
              <ul className="space-y-2">
                {fitReasons.map((reason, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-label text-foreground">
                    <Check className="size-3.5 text-success-strong shrink-0 stroke-[2.5]" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: Things to think about */}
            <div className="space-y-2.5">
              <h4 className="text-footnote font-semibold uppercase tracking-wider text-foreground">
                {t('creator.phase3.formation.thingsToThink', 'THINGS TO THINK ABOUT')}
              </h4>
              <ul className="space-y-2">
                {[
                  t('creator.phase3.formation.thinkPay', 'How you plan to pay yourself'),
                  t('creator.phase3.formation.thinkSocial', 'Social contributions'),
                  t('creator.phase3.formation.thinkAccounting', 'Accounting and administration'),
                  t('creator.phase3.formation.thinkOwnership', 'What happens if ownership changes later'),
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-label text-muted-foreground">
                    <span className="w-1.5 h-0.5 bg-muted-foreground/60 rounded-full shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Facts Strip (4 blocks) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
            <div className="rounded-lg bg-secondary/60 border border-primary/10 p-3 space-y-1">
              <div className="text-footnote font-medium uppercase tracking-wider text-muted-foreground">
                {t('creator.phase3.formation.factsOwners', 'OWNERS')}
              </div>
              <div className="text-label font-semibold text-foreground">
                {startingMode === 'solo'
                  ? t('creator.phase3.formation.factsOwnersSolo', '1 shareholder')
                  : t('creator.phase3.formation.factsOwnersTeam', '2+ shareholders')}
              </div>
            </div>

            <div className="rounded-lg bg-secondary/60 border border-primary/10 p-3 space-y-1">
              <div className="text-footnote font-medium uppercase tracking-wider text-muted-foreground">
                {t('creator.phase3.formation.factsManagement', 'MANAGEMENT')}
              </div>
              <div className="text-label font-semibold text-foreground">
                {currentStructureCode === 'SARL'
                  ? t('creator.phase3.formation.factsGerant', 'Led by a Gérant')
                  : t('creator.phase3.formation.factsPresident', 'Usually led by a President')}
              </div>
            </div>

            <div className="rounded-lg bg-secondary/60 border border-primary/10 p-3 space-y-1">
              <div className="text-footnote font-medium uppercase tracking-wider text-muted-foreground">
                {t('creator.phase3.formation.factsOwnershipLater', 'OWNERSHIP LATER')}
              </div>
              <div className="text-label font-semibold text-foreground leading-snug">
                {t('creator.phase3.formation.factsOwnershipLaterDesc', 'Can change if new shareholders join')}
              </div>
            </div>

            <div className="rounded-lg bg-secondary/60 border border-primary/10 p-3 space-y-1">
              <div className="text-footnote font-medium uppercase tracking-wider text-muted-foreground">
                {t('creator.phase3.formation.factsBeforeReg', 'BEFORE REGISTRATION')}
              </div>
              <div className="text-label font-semibold text-foreground leading-snug">
                {t('creator.phase3.formation.factsBeforeRegDesc', 'Professional advice may be useful')}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowOtherStructures(!showOtherStructures)}
            className="rounded-lg text-button font-medium border-border/80 h-9 px-4"
          >
            {showOtherStructures
              ? t('creator.phase3.formation.hideOptions', 'Hide options')
              : t('creator.phase3.formation.exploreOption', 'Explore this option')}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowOtherStructures(!showOtherStructures)}
            className="text-button text-primary hover:text-primary/90 hover:bg-secondary h-9 px-3"
          >
            {t('creator.phase3.formation.seeAnother', 'See another structure')}
          </Button>
        </div>

        {/* Expandable Other Structures Selector */}
        {showOtherStructures && (
          <div className="pt-3 border-t border-border/60 grid grid-cols-1 md:grid-cols-3 gap-3 animate-in fade-in-50 duration-200">
            {formation.options.map((opt) => {
              const isSelected = formation.selectedType === opt.code;
              return (
                <div
                  key={opt.code}
                  onClick={() => void onSelectType(opt.code)}
                  className={cn(
                    'cursor-pointer rounded-xl border p-4 text-left transition-all',
                    isSelected
                      ? 'border-primary bg-secondary/50 ring-1 ring-primary'
                      : 'border-border/70 bg-card hover:border-primary/40'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-foreground text-body">
                      {opt.code}
                    </span>
                    {isSelected && (
                      <span className="text-badge font-semibold text-primary">{t('creator.phase3.formation.selected', 'Selected')}</span>
                    )}
                  </div>
                  <p className="text-caption text-muted-foreground mt-1.5 leading-snug">
                    {opt.description}
                  </p>
                  <div className="mt-3 pt-2 border-t border-border/40 text-footnote space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('creator.phase3.formation.capital', 'Capital:')}</span>
                      <span className="font-mono text-foreground">{opt.capital}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('creator.phase3.formation.filing', 'Filing:')}</span>
                      <span className="font-mono text-foreground">{opt.formationTime}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ========================================================
          SECTION 5 — OWNERSHIP
          ======================================================== */}
      <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-card-title font-heading font-semibold text-foreground">
            {t('creator.phase3.formation.whoOwns', 'Who will own the company?')}
          </h2>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-label font-bold uppercase tracking-wider text-foreground">
              {t('creator.phase3.formation.you', 'YOU')}
            </span>
            <span className="text-card-title font-bold font-mono text-primary">
              {founderEquity}%
            </span>
          </div>
        </div>

        {/* Visual Ownership Bar */}
        <div className="w-full h-3 rounded-full bg-secondary overflow-hidden flex">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${founderEquity}%` }}
          />
          {founderEquity < 100 && (
            <div
              className="h-full bg-muted-foreground/30 transition-all duration-300"
              style={{ width: `${100 - founderEquity}%` }}
            />
          )}
        </div>

        <p className="text-label text-muted-foreground leading-relaxed">
          {t('creator.phase3.formation.ownershipExplain', 'Ownership means who legally owns shares in the company. It is different from who does the most day-to-day work.')}
        </p>

        <div className="flex items-center gap-3 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsAdjustingOwnership(!isAdjustingOwnership)}
            className="text-button text-primary hover:text-primary/90 hover:bg-secondary h-8 px-2.5"
          >
            {t('creator.phase3.formation.adjustOwnership', 'Adjust ownership')}
          </Button>

          {isAdjustingOwnership && (
            <div className="flex items-center gap-2 text-label animate-in fade-in-50">
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={founderEquity}
                onChange={(e) => {
                  setFounderEquity(Number(e.target.value));
                  setIsEquityExplicit(true);
                }}
                className="w-32 accent-primary cursor-pointer"
              />
              <span className="font-mono text-xs font-semibold text-foreground">
                {founderEquity}% / {100 - founderEquity}%
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ========================================================
          SECTION 6 — LEADERSHIP
          ======================================================== */}
      <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <h2 className="text-card-title font-heading font-semibold text-foreground">
          {t('creator.phase3.formation.whoLeads', 'Who will lead the company?')}
        </h2>

        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-body shrink-0">
              {userInitial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-body font-semibold text-foreground">
                  {t('creator.phase3.formation.day1Founder', 'You — Founder').split(' — ')[0]}
                </span>
                <span className="inline-flex items-center rounded bg-secondary px-2 py-0.5 text-badge font-medium text-primary">
                  {t('creator.phase3.formation.plannedRole', { role: plannedRole })}
                </span>
              </div>
              <p className="text-caption text-muted-foreground mt-1 max-w-lg leading-relaxed">
                {t('creator.phase3.formation.leadExplain', 'The company will need a legal representative. The exact role depends on the structure you eventually choose.')}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {isChangingRole ? (
              <div className="flex items-center gap-2">
                <select
                  value={plannedRole}
                  onChange={(e) => {
                    setPlannedRole(e.target.value);
                    setIsRoleExplicit(true);
                    setIsChangingRole(false);
                  }}
                  className="rounded-lg border border-border bg-card px-2.5 py-1 text-label font-medium text-foreground outline-none"
                >
                  <option value="President">{t('creator.phase3.formation.rolePresident', 'President')}</option>
                  <option value="CEO">{t('creator.phase3.formation.roleCeo', 'Chief Executive Officer')}</option>
                  <option value="Managing Director (Gérant)">{t('creator.phase3.formation.roleGerant', 'Managing Director (Gérant)')}</option>
                </select>
              </div>
            ) : (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsChangingRole(true)}
                className="text-button text-primary hover:text-primary/90 hover:bg-secondary h-8 px-2.5"
              >
                {t('creator.phase3.formation.change', 'Change')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* ========================================================
          SECTION 7 — STARTING CAPITAL
          ======================================================== */}
      <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-3">
        <div>
          <h2 className="text-card-title font-heading font-semibold text-foreground">
            {t('creator.phase3.formation.capitalPlan', 'Starting capital plan')}
          </h2>
          <p className="text-label text-muted-foreground mt-0.5">
            {t('creator.phase3.formation.capitalPlanDesc', 'This comes from your current company and financial plan.')}
          </p>
        </div>

        <div className="pt-1">
          {isEditingCapital ? (
            <div className="flex items-center gap-2 max-w-xs">
              <span className="text-stat-xl font-bold font-mono text-foreground">{currencySymbol}</span>
              <input
                type="number"
                value={capitalAmount}
                onChange={(e) => setCapitalAmount(Number(e.target.value))}
                className="w-40 rounded-xl border border-border bg-card px-3 py-1.5 text-2xl font-bold font-mono text-foreground outline-none focus:border-primary"
              />
              <Button
                size="sm"
                onClick={() => {
                  setIsEditingCapital(false);
                  setCapitalConfirmed(true);
                  setIsCapitalInteracted(true);
                }}
                className="rounded-lg h-9 px-3"
              >
                {t('creator.phase3.formation.save', 'Save')}
              </Button>
            </div>
          ) : (
            <div className="text-stat-xl font-bold font-mono text-foreground tracking-tight">
              {currencySymbol}{capitalAmount.toLocaleString('en-US')}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setCapitalConfirmed(true);
              setIsCapitalInteracted(true);
            }}
            className={cn(
              'rounded-lg text-button font-medium h-8 px-3 gap-1.5 shadow-none transition-colors',
              capitalConfirmed
                ? 'bg-secondary text-success-strong hover:bg-secondary'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <Check className="size-3.5 stroke-[2.5]" />
            <span>{t('creator.phase3.formation.looksRight', 'Looks right')}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingCapital(true)}
            className="text-button text-muted-foreground hover:text-foreground h-8 px-2"
          >
            {t('creator.phase3.formation.updateThis', 'Update this')}
          </Button>
        </div>
      </Card>

      {/* ========================================================
          SECTION 8 — WHO DO YOU ACTUALLY NEED TO GET STARTED?
          ======================================================== */}
      <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-card-title font-heading font-semibold text-foreground">
            {t('creator.phase3.formation.whoNeeded', 'Who do you actually need to get started?')}
          </h2>
          <p className="text-label text-muted-foreground mt-0.5">
            {t('creator.phase3.formation.whoNeededDesc', 'You probably don’t need a full team on day one. MBC compared your project needs with the skills you already have.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* Group 1: YOU CAN HANDLE */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-success-strong" />
                <span className="text-footnote font-bold uppercase tracking-wider text-success-strong">
                  {t('creator.phase3.formation.canHandle', 'YOU CAN HANDLE')}
                </span>
              </div>
              <ul className="space-y-2">
                {youCanHandleItems.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg bg-card border border-border/60 px-3 py-2 text-label font-medium text-foreground shadow-2xs"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-caption text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
              {t('creator.phase3.formation.canHandleDesc', 'Your current profile suggests you can cover these yourself.')}
            </p>
          </div>

          {/* Group 2: YOU MAY NEED HELP WITH */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-amber-600 dark:text-amber-400" />
                <span className="text-footnote font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  {t('creator.phase3.formation.needHelp', 'YOU MAY NEED HELP WITH')}
                </span>
              </div>
              <ul className="space-y-2">
                {youMayNeedHelpItems.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg bg-card border border-border/60 px-3 py-2 text-label font-medium text-foreground shadow-2xs"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-caption text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
              {t('creator.phase3.formation.needHelpDesc', 'These capabilities may be important before launch or company setup.')}
            </p>
          </div>

          {/* Group 3: NOT NEEDED YET */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-muted-foreground/60" />
                <span className="text-footnote font-bold uppercase tracking-wider text-muted-foreground">
                  {t('creator.phase3.formation.notNeededYet', 'NOT NEEDED YET')}
                </span>
              </div>
              <ul className="space-y-2">
                {notNeededYetItems.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg bg-card border border-border/60 px-3 py-2 text-label font-medium text-foreground shadow-2xs"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-caption text-muted-foreground leading-relaxed pt-2 border-t border-border/40">
              {t('creator.phase3.formation.notNeededYetDesc', 'These roles can probably wait until the business grows.')}
            </p>
          </div>
        </div>
      </Card>

      {/* ========================================================
          SECTION 9 — ONE EXPANDED TEAM NEED
          ======================================================== */}
      <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-footnote font-semibold uppercase tracking-wider text-muted-foreground">
            {t('creator.phase3.formation.teamNeed', 'TEAM NEED')}
          </span>
          <span className="inline-flex items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-badge font-medium text-amber-700 dark:text-amber-400">
            {t('creator.phase3.formation.neededBeforeLaunch', 'Needed before launch')}
          </span>
        </div>

        <div>
          <h3 className="text-card-title font-heading font-semibold text-foreground">
            {primaryExpandedNeed}
          </h3>
          <p className="text-label text-muted-foreground mt-1 leading-relaxed">
            {t('creator.phase3.formation.needDesc', { need: primaryExpandedNeed.toLowerCase() })}
          </p>
        </div>

        {/* Starting Option Card */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-1.5">
          <div className="text-footnote font-medium uppercase tracking-wider text-muted-foreground">
            {t('creator.phase3.formation.practicalOption', 'A practical starting option')}
          </div>
          <div className="text-body font-semibold text-foreground">
            {t('creator.phase3.formation.externalSpecialist', 'External specialist')}
          </div>
          <p className="text-label text-muted-foreground leading-relaxed">
            {t('creator.phase3.formation.practicalDesc', 'You need this capability before launch, but a full-time employee may be unnecessary at the beginning.')}
          </p>
        </div>

        {/* 3 Action Pathways */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          {[
            { id: 'learn', label: t('creator.phase3.formation.pathLearn', 'Learn later') },
            { id: 'cofounder', label: t('creator.phase3.formation.pathCofounder', 'Consider a technical co-founder') },
            { id: 'hire', label: t('creator.phase3.formation.pathHire', 'Hire when the business grows') },
          ].map((pathway) => (
            <button
              key={pathway.id}
              type="button"
              onClick={() => setSelectedPathway(pathway.id)}
              className={cn(
                'rounded-lg px-3.5 py-2 text-label font-medium border transition-all',
                selectedPathway === pathway.id
                  ? 'border-primary bg-secondary text-primary font-semibold shadow-2xs'
                  : 'border-border/70 bg-muted/30 text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {pathway.label}
            </button>
          ))}
        </div>
      </Card>

      {/* ========================================================
          SECTION 10 — PROFESSIONAL SUPPORT
          ======================================================== */}
      <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-card-title font-heading font-semibold text-foreground">
            {t('creator.phase3.formation.profSupport', 'Professional support you may use')}
          </h2>
          <p className="text-label text-muted-foreground mt-0.5">
            {t('creator.phase3.formation.profSupportDesc', 'Some support is useful without becoming part of your permanent team.')}
          </p>
        </div>

        <div className="space-y-3 pt-1">
          {/* Support 1: Chartered accountant */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-body font-semibold text-foreground">
                {t('creator.phase3.formation.accountant', 'Chartered accountant')}
              </h3>
              <p className="text-caption text-muted-foreground mt-0.5">
                {t('creator.phase3.formation.accountantDesc', 'Useful around setup, accounting and financial obligations.')}
              </p>
            </div>
            <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-footnote font-medium text-muted-foreground shrink-0 border border-border/50">
              {t('creator.phase3.formation.aroundSetup', 'Around company setup')}
            </span>
          </div>

          {/* Support 2: Legal professional */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-body font-semibold text-foreground">
                {t('creator.phase3.formation.lawyer', 'Legal professional')}
              </h3>
              <p className="text-caption text-muted-foreground mt-0.5">
                {t('creator.phase3.formation.lawyerDesc', 'Useful before finalising company documents or unusual ownership arrangements.')}
              </p>
            </div>
            <span className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-footnote font-medium text-muted-foreground shrink-0 border border-border/50">
              {t('creator.phase3.formation.beforeRegistrationIf', 'Before final registration, if needed')}
            </span>
          </div>
        </div>
      </Card>

      {/* ========================================================
          SECTION 11 — DAY 1 VS LATER
          ======================================================== */}
      <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <div>
          <h2 className="text-card-title font-heading font-semibold text-foreground">
            {t('creator.phase3.formation.startingTeam', 'Your starting team')}
          </h2>
        </div>

        <div className="rounded-xl border border-border/60 bg-muted/30 p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: DAY 1 */}
          <div className="rounded-xl bg-card border border-border/60 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary" />
              <span className="text-footnote font-bold uppercase tracking-wider text-foreground">
                {t('creator.phase3.formation.day1', 'DAY 1')}
              </span>
            </div>
            <ul className="space-y-2 text-label text-foreground">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>{t('creator.phase3.formation.day1Founder', 'You — Founder')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>
                  {t('creator.phase3.formation.day1External', 'External {{role}}', {
                    role: primaryExpandedNeed.toLowerCase().includes('develop')
                      ? t('creator.phase3.formation.roleDeveloper', 'developer')
                      : primaryExpandedNeed.toLowerCase().includes('account')
                        ? t('creator.phase3.formation.roleAccountant', 'accountant')
                        : t('creator.phase3.formation.roleSpecialist', 'specialist')
                  })}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <span>{t('creator.phase3.formation.day1Accountant', 'Accountant support')}</span>
              </li>
            </ul>
          </div>

          {/* Right: LATER */}
          <div className="rounded-xl bg-card border border-border/60 p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-muted-foreground/60" />
              <span className="text-footnote font-bold uppercase tracking-wider text-muted-foreground">
                {t('creator.phase3.formation.later', 'LATER')}
              </span>
            </div>
            <ul className="space-y-2 text-label text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                <span>{t('creator.phase3.formation.laterSales', 'Sales support')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                <span>{t('creator.phase3.formation.laterCustomer', 'Customer support')}</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-muted-foreground/60" />
                <span>{t('creator.phase3.formation.laterOps', 'Operations')}</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* ========================================================
          SECTION 12 — FINAL SETUP SUMMARY
          ======================================================== */}
      <Card className="rounded-2xl border border-border/70 bg-card p-6 shadow-xs space-y-5">
        <h2 className="text-card-title font-heading font-semibold text-foreground">
          {t('creator.phase3.formation.setupPlan', 'Your company setup plan')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sub A: COMPANY */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <span className="text-footnote font-bold uppercase tracking-wider text-muted-foreground">
              {t('creator.phase3.formation.company', 'COMPANY')}
            </span>
            <div className="space-y-2 text-label">
              <div className="flex items-center justify-between rounded bg-card border border-border/50 px-3 py-1.5">
                <span className="text-muted-foreground">{t('creator.phase3.formation.starting', 'Starting')}</span>
                <span className="font-semibold text-foreground">
                  {startingMode === 'solo'
                    ? t('creator.phase3.formation.soloFounder', 'Solo founder')
                    : startingMode === 'team'
                    ? t('creator.phase3.formation.withCofounders', 'With co-founders')
                    : t('creator.phase3.formation.flexiblePlan', 'Flexible plan')}
                </span>
              </div>
              <div className="flex items-center justify-between rounded bg-card border border-border/50 px-3 py-1.5">
                <span className="text-muted-foreground">{t('creator.phase3.formation.structureToConsider', 'Structure to consider')}</span>
                <span className="font-mono font-semibold text-foreground">
                  {displayStructureCode}
                </span>
              </div>
              <div className="flex items-center justify-between rounded bg-card border border-border/50 px-3 py-1.5">
                <span className="text-muted-foreground">{t('creator.phase3.formation.ownership', 'Ownership')}</span>
                <span className="font-semibold text-foreground">
                  {t('creator.phase3.formation.ownershipValue', { equity: founderEquity })}
                </span>
              </div>
              <div className="flex items-center justify-between rounded bg-card border border-border/50 px-3 py-1.5">
                <span className="text-muted-foreground">{t('creator.phase3.formation.plannedLeader', 'Planned leader')}</span>
                <span className="font-semibold text-foreground">
                  {t('creator.phase3.formation.day1Founder', 'You — Founder').split(' — ')[0]}
                </span>
              </div>
              <div className="flex items-center justify-between rounded bg-card border border-border/50 px-3 py-1.5">
                <span className="text-muted-foreground">{t('creator.phase3.formation.startingCapital', 'Starting capital')}</span>
                <span className="font-mono font-semibold text-foreground">
                  {currencySymbol}{capitalAmount.toLocaleString('en-US')}
                </span>
              </div>
            </div>
          </div>

          {/* Sub B: TEAM */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <span className="text-footnote font-bold uppercase tracking-wider text-muted-foreground">
              {t('creator.phase3.formation.team', 'TEAM')}
            </span>
            <div className="space-y-2 text-label">
              <div className="flex items-center justify-between rounded bg-card border border-border/50 px-3 py-1.5">
                <span className="text-muted-foreground">{t('creator.phase3.formation.canHandle', 'YOU CAN HANDLE')}</span>
                <span className="font-mono font-bold text-foreground">
                  {t('creator.phase3.formation.areasCount', { count: youCanHandleItems.length })}
                </span>
              </div>
              <div className="flex items-center justify-between rounded bg-card border border-border/50 px-3 py-1.5">
                <span className="text-muted-foreground">{t('creator.phase3.formation.needHelp', 'YOU MAY NEED HELP WITH')}</span>
                <span className="font-mono font-bold text-foreground">
                  {t('creator.phase3.formation.areasCount', { count: youMayNeedHelpItems.length })}
                </span>
              </div>
              <div className="flex items-center justify-between rounded bg-card border border-border/50 px-3 py-1.5">
                <span className="text-muted-foreground">{t('creator.phase3.formation.neededDayOne', 'Needed on day one')}</span>
                <span className="font-mono font-bold text-foreground">
                  {t('creator.phase3.formation.twoSupportNeeds', '2 support needs')}
                </span>
              </div>
              <div className="flex items-center justify-between rounded bg-card border border-border/50 px-3 py-1.5">
                <span className="text-muted-foreground">{t('creator.phase3.formation.canWait', 'Can wait')}</span>
                <span className="font-mono font-bold text-foreground">
                  {t('creator.phase3.formation.rolesCount', { count: notNeededYetItems.length })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-footnote text-muted-foreground/80 leading-relaxed pt-1">
          {t('creator.phase3.formation.disclaimer', 'This is a planning recommendation based on your current project. Final legal, tax and ownership decisions may require professional advice before company registration.')}
        </p>
      </Card>

      {/* ========================================================
          SECTION 13 — FOOTER NAVIGATION
          ======================================================== */}
      <div className="flex items-center justify-between pt-6 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isSaving}
          className="gap-2 text-button font-medium font-sans text-muted-foreground hover:text-foreground rounded-xl"
        >
          <ArrowLeft className="size-4" />
          <span>{t('creator.phase3.formation.backToCompliance', 'Legal Roadmap')}</span>
        </Button>

        <Button
          type="button"
          onClick={() =>
            onContinue({
              ...(isModeExplicit ? { mode: startingMode } : {}),
              ...(isEquityExplicit ? { founderEquity } : {}),
              ...(isRoleExplicit ? { plannedRole } : {}),
              ...(isCapitalInteracted ? { capitalAmount, capitalConfirmed } : {}),
            })
          }
          disabled={isSaving}
          className="gap-2 rounded-xl text-button font-semibold h-11 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-sans"
        >
          <span>{t('creator.phase3.formation.continueToBusinessPlan', 'Continue to Executive Business Plan')}</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

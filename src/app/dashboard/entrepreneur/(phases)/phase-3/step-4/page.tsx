'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bold,
  Underline,
  Italic,
  List,
  Quote,
  ChevronDown,
  Eye,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';
import { ProgressSidebar } from '@/components/entrepreneur/ProgressSidebar';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
import { Phase3Container, Surface } from '@/components/entrepreneur/phase3/Phase3Ui';
import { PHASE_3_STEPS } from '@/components/entrepreneur/phase3/steps';
import { cn } from '@/lib/utils';
import entrepreneurApi from '@/lib/api-entrepreneur';
import { Phase3Data } from '@/types/entrepreneur';

const STAGES = ['Idea', 'MVP', 'Revenue', 'Growth'] as const;
const BUSINESS_MODELS = ['B2B SaaS', 'B2C', 'Marketplace', 'Subscription', 'Transactional', 'Freemium', 'Other'];

const ONE_LINER_MAX = 160;

/**
 * Keyword-matched sector tags from the pitch + target market (mirrors the
 * backend's expectation of 1–3 tags). Falls back to the business model so the
 * backend's "min 1" rule is always satisfied.
 */
function generateSectorTags(text: string, businessModel: string): string[] {
  const t = text.toLowerCase();
  const tags: string[] = [];
  const add = (tag: string) => {
    if (!tags.includes(tag)) tags.push(tag);
  };
  if (/fintech|finance|payment|banking/.test(t)) add('FinTech');
  if (/saas|software|platform/.test(t)) add('SaaS');
  if (/b2b|business|enterprise/.test(t)) add('B2B');
  if (/\bai\b|machine learning|ml\b/.test(t)) add('AI');
  if (/marketplace/.test(t)) add('Marketplace');
  if (tags.length === 0 && businessModel) add(businessModel);
  if (tags.length === 0) add('Other');
  return tags.slice(0, 3);
}

function Phase3ConceptOverviewClient() {
  const router = useRouter();
  const { progress, savePhaseData, moveToNextStep, getPhaseData, applyBackendResponse, currentPhase } =
    useEntrepreneurProgress();

  const [elevatorPitch, setElevatorPitch] = useState('');
  const [problemStatement, setProblemStatement] = useState('');
  const [solution, setSolution] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [businessModel, setBusinessModel] = useState('');
  const [stage, setStage] = useState<string>('Idea');

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Hydrate any previously saved concept draft.
  useEffect(() => {
    const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
    const c = existing.conceptOverview;
    if (c) {
      setElevatorPitch(c.elevatorPitch ?? '');
      setProblemStatement(c.problemStatement ?? '');
      setSolution(c.solution ?? '');
      setTargetMarket(c.targetMarket ?? '');
      setBusinessModel(c.businessModel ?? '');
      setStage(c.stage ?? 'Idea');
    }
  }, [getPhaseData]);

  if (!progress) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" role="status" aria-live="polite">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const conceptPayload = () => ({
    elevatorPitch: elevatorPitch.trim(),
    problemStatement: problemStatement.trim(),
    solution: solution.trim(),
    targetMarket: targetMarket.trim(),
    businessModel,
    stage,
  });

  const handleSaveDraft = () => {
    const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
    savePhaseData(3, { ...existing, conceptOverview: conceptPayload(), conceptSavedAt: new Date().toISOString() });
  };

  const handleComplete = async () => {
    setValidationError('');
    if (!elevatorPitch.trim()) return setValidationError('Add an elevator pitch describing your business');
    if (elevatorPitch.trim().length > ONE_LINER_MAX)
      return setValidationError(`Elevator pitch must be ${ONE_LINER_MAX} characters or fewer`);
    if (!problemStatement.trim()) return setValidationError('Describe the problem you address');
    if (!solution.trim()) return setValidationError('Describe how your solution works');
    if (!targetMarket.trim()) return setValidationError('Add your target market');
    if (!businessModel) return setValidationError('Select a business model');
    if (!stage) return setValidationError('Select your current stage');

    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();

      // Pre-check: Verify Step 3 (KPI baseline) was completed before advancing
      const kpi = await entrepreneurApi.getKpiBaseline(companyId);
      if (!kpi) {
        setValidationError('⚠️ Complete Step 3 (KPI Baseline) first, then return to finish Phase 3');
        setIsSubmitting(false);
        return;
      }

      // Persist the concept to the backend FIRST — Phase 3 completion now
      // requires a Phase3Concept document (ValidatePhase3Async). Also keep a
      // local copy so the form rehydrates on reload.
      await entrepreneurApi.saveConcept(companyId, {
        oneLiner: elevatorPitch.trim(),
        problemStatement: problemStatement.trim(),
        solutionDescription: solution.trim(),
        stage: stage.toLowerCase(),
        businessModel,
        sectorTags: generateSectorTags(`${elevatorPitch} ${targetMarket}`, businessModel),
        keywordTags: [],
      });

      const existing: Phase3Data = getPhaseData<Phase3Data>(3) ?? {};
      savePhaseData(3, {
        ...existing,
        __companyId: companyId,
        conceptOverview: conceptPayload(),
        conceptSavedAt: new Date().toISOString(),
      });

      const advanceResponse = await entrepreneurApi.advancePhase(companyId, 3, {});
      if (advanceResponse?.currentPhase !== 4) {
        throw new Error(`Phase advancement failed - expected currentPhase=4, got ${advanceResponse?.currentPhase}`);
      }
      if (!advanceResponse?.completedPhases?.includes(3)) {
        throw new Error('Phase 3 not marked as completed in backend response');
      }
      applyBackendResponse(advanceResponse);

      savePhaseData(3, {
        ...getPhaseData<Phase3Data>(3),
        submittedAt: new Date().toISOString(),
      });
      moveToNextStep(3, 4);
      setCompleted(true);
      await new Promise((r) => setTimeout(r, 1200));
      router.push('/dashboard/entrepreneur/phase-4');
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to complete Phase 3');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusMap = {
    1: progress.completedSteps.has('3-1') ? 'completed' : progress.currentStep === 1 ? 'current' : 'pending',
    2: progress.completedSteps.has('3-2') ? 'completed' : progress.currentStep === 2 ? 'current' : 'pending',
    3: progress.completedSteps.has('3-3') ? 'completed' : progress.currentStep === 3 ? 'current' : 'pending',
    4: progress.completedSteps.has('3-4') ? 'completed' : progress.currentStep === 4 ? 'current' : 'pending',
  } as const;
  const stepIndicators = PHASE_3_STEPS.map((s) => ({
    ...s,
    status: statusMap[s.step as 1 | 2 | 3 | 4] as 'completed' | 'current' | 'pending',
  }));

  const sidebar = (
    <ProgressSidebar
      title="Verification Progress"
      steps={stepIndicators}
      overallScore={100}
      scoreLabel="OVERALL SCORE"
      scoreDescription="Explain your core concept to complete Phase 3."
    />
  );

  return (
    <EntrepreneurLayout sidebar={sidebar}>
      <Phase3Container
        crumbs={['Entrepreneur Verification', 'Concept Overview']}
        title="Concept Overview"
        subtitle="Tell investors what you're building. A clear concept improves how your marketplace listing is perceived."
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          {/* Left: concept inputs */}
          <Surface className="p-6 space-y-6">
            <RichTextArea
              id="elevator"
              label="Elevator Pitch"
              value={elevatorPitch}
              onChange={setElevatorPitch}
              placeholder="Describe your business in 2–3 sentences"
              maxLength={ONE_LINER_MAX}
            />
            <RichTextArea
              id="problem"
              label="Problem Statement"
              value={problemStatement}
              onChange={setProblemStatement}
              placeholder="Which specific pain do you address?"
            />
            <RichTextArea
              id="solution"
              label="Your Solution"
              value={solution}
              onChange={setSolution}
              placeholder="How does your product uniquely solve this problem?"
            />

            <div>
              <label htmlFor="target-market" className="block text-sm font-medium text-foreground mb-2">
                Target Market
              </label>
              <Input
                id="target-market"
                value={targetMarket}
                onChange={(e) => setTargetMarket(e.target.value)}
                placeholder="e.g. B2B SaaS companies…"
                className="h-11"
              />
            </div>

            <div>
              <label htmlFor="business-model" className="block text-sm font-medium text-foreground mb-2">
                Business Model
              </label>
              <div className="relative">
                <select
                  id="business-model"
                  value={businessModel}
                  onChange={(e) => setBusinessModel(e.target.value)}
                  className="h-11 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="" disabled>
                    Select a business model…
                  </option>
                  {BUSINESS_MODELS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden />
              </div>
            </div>

            <div>
              <span className="block text-sm font-medium text-foreground mb-2">Stage</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Company stage">
                {STAGES.map((s) => {
                  const active = stage === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setStage(s)}
                      className={cn(
                        'h-9 px-5 rounded-full text-sm font-medium border transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:bg-accent'
                      )}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          </Surface>

          {/* Right rail */}
          <div className="flex flex-col gap-4">
            {/* Investor preview */}
            <Surface className="overflow-hidden">
              <div className="p-4 border-b border-border">
                <p className="text-sm font-semibold text-foreground">How Investors will see this</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" aria-hidden /> Investor preview
                </p>
              </div>
              <div className="p-4">
                <div className="rounded-xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-border p-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your Marketplace Listing</p>
                  <p className="text-sm font-semibold text-foreground line-clamp-2">
                    {elevatorPitch.trim() || 'Your elevator pitch appears here'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {businessModel ? (
                      <span className="rounded-md bg-background border border-border px-2 py-0.5 text-xs text-muted-foreground">{businessModel}</span>
                    ) : null}
                    <span className="rounded-md bg-background border border-border px-2 py-0.5 text-xs text-muted-foreground">{stage}</span>
                  </div>
                  <div className="space-y-1.5 pt-1" aria-hidden>
                    <div className="h-2 rounded bg-muted" />
                    <div className="h-2 w-4/5 rounded bg-muted" />
                    <div className="h-2 w-3/5 rounded bg-muted" />
                  </div>
                </div>
              </div>
            </Surface>

            {/* Tips */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex gap-3">
              <HelpCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-primary mb-2">Tips for a strong concept</p>
                <ul className="space-y-1 text-[13px] text-muted-foreground list-disc pl-4">
                  <li>Focus on clarity over jargon.</li>
                  <li>Quantify the problem if possible.</li>
                  <li>Highlight your unique differentiator.</li>
                </ul>
              </div>
            </div>

            {/* Unlocks next */}
            <div className="bg-success-light border border-success-text/20 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold text-success-text">Phase 3 Complete — What unlocks next</p>
              <p className="text-[13px] text-muted-foreground">
                Finishing this step finalizes your Valuation Profile. Phase 4 will unlock access to direct investor
                matching and virtual data room setup.
              </p>
              <Button onClick={handleComplete} disabled={isSubmitting} className="w-full gap-2">
                Phase 4: Equity Structure
                <ArrowRight className="w-4 h-4" aria-hidden />
              </Button>
            </div>

            {/* Success toast */}
            {completed ? (
              <div className="bg-card border border-success-text/30 rounded-2xl p-4 flex gap-3" role="status" aria-live="polite">
                <CheckCircle2 className="w-5 h-5 text-success-text flex-shrink-0 mt-0.5" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-foreground">Phase 3 Complete — Valuation Verified</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5">Your concept overview has been saved securely.</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          {currentPhase! <= 3 && (
            <StepFooter
              backUrl="/dashboard/entrepreneur/phase-3/step-3"
              onNextClick={handleComplete}
              isLoading={isSubmitting}
              nextLabel="Complete Phase 3"
              showSaveDraft
              onSaveDraft={handleSaveDraft}
              nextValidationError={validationError}
            />
          )}
        </div>
      </Phase3Container>
    </EntrepreneurLayout>
  );
}

/* ---- Rich-text-styled textarea (toolbar is presentational) -------------- */

function RichTextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={`concept-${id}`} className="block text-sm font-medium text-foreground mb-2">
        {label}
      </label>
      <div className="rounded-md border border-input overflow-hidden focus-within:ring-2 focus-within:ring-ring">
        <div className="flex items-center gap-1 border-b border-border bg-muted/50 px-2 py-1.5" aria-hidden>
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded hover:bg-accent">
            Regular <ChevronDown className="w-3 h-3" />
          </span>
          <span className="w-px h-4 bg-border mx-1" />
          {[Bold, Underline, Italic, List, Quote].map((Icon, i) => (
            <span key={i} className="grid place-items-center size-7 rounded text-muted-foreground hover:bg-accent">
              <Icon className="w-3.5 h-3.5" />
            </span>
          ))}
        </div>
        <Textarea
          id={`concept-${id}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="min-h-[96px] resize-none border-0 rounded-none focus-visible:ring-0 bg-background"
        />
        {maxLength ? (
          <div className="px-3 pb-2 text-right text-xs text-muted-foreground tabular-nums">
            {value.length}/{maxLength}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Phase3Step4Page() {
  return (
    <RouteGuard requiredPhase={3} requiredStep={4}>
      <Phase3ConceptOverviewClient />
    </RouteGuard>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ChevronLeft, ChevronRight, FileText, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import entrepreneurApi, {
  FundingProfileResponse,
  PitchDeckResponse,
} from '@/lib/api-entrepreneur';
import { Phase5Data } from '@/types/entrepreneur';

type RoundType = 'pre_seed' | 'seed' | 'series_a';
type ShareType = 'preferred' | 'safe' | 'note';

interface AllocationRow {
  category: string;
  percent: string;
}

interface HiringRow {
  role: string;
  salary: string;
  timeline: string;
  priority: string;
}

const NARRATIVE_MIN_LENGTH = 200;
const NARRATIVE_MAX_LENGTH = 5000;

export default function Phase5Client() {
  const router = useRouter();
  const { activeCompanyId, savePhaseData, getPhaseData, applyBackendResponse, currentPhase } =
    useEntrepreneurProgress();

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [companyId, setCompanyId] = useState('');

  // Step 1: Capital Allocation
  const [allocations, setAllocations] = useState<AllocationRow[]>([
    { category: 'Product', percent: '' },
    { category: 'Sales & marketing', percent: '' },
    { category: 'Operations', percent: '' },
  ]);

  // Step 2: Resource Mapping
  const [hiring, setHiring] = useState<HiringRow[]>([
    { role: '', salary: '', timeline: '', priority: 'high' },
  ]);

  // Step 3: Equity Offer
  const [raiseAmount, setRaiseAmount] = useState('');
  const [roundType, setRoundType] = useState<RoundType>('pre_seed');
  const [preMoneyValuation, setPreMoneyValuation] = useState('');
  const [equityOfferedPercent, setEquityOfferedPercent] = useState('');
  const [shareType, setShareType] = useState<ShareType>('preferred');
  const [minimumTicket, setMinimumTicket] = useState('');

  // Step 3: Pitch + Narrative
  const [pitchDeck, setPitchDeck] = useState<PitchDeckResponse | null>(null);
  const [uploadingDeck, setUploadingDeck] = useState(false);
  const [narrative, setNarrative] = useState('');

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pitchDeckUploading, setPitchDeckUploading] = useState(false);

  // Load existing data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prog = await entrepreneurApi.getCurrentPhase(activeCompanyId || undefined);
        const id = activeCompanyId || prog.companyId || (getPhaseData<Phase5Data>(5) ?? {}).__companyId;
        if (!id || cancelled) return;
        setCompanyId(id);

        const profile: FundingProfileResponse =
          await entrepreneurApi.getFundingProfile(id);
        if (cancelled) return;

        if (profile.fundingAskAmount != null) setRaiseAmount(String(profile.fundingAskAmount));
        if (profile.fundingRoundType) setRoundType(profile.fundingRoundType as RoundType);
        if (profile.preMoneyValuation != null)
          setPreMoneyValuation(String(profile.preMoneyValuation));
        if (profile.equityOfferedPercent != null)
          setEquityOfferedPercent(String(profile.equityOfferedPercent));
        if (profile.shareType) setShareType(profile.shareType as ShareType);
        if (profile.minimumTicketEur != null) setMinimumTicket(String(profile.minimumTicketEur));

        // Pre-money valuation is authoritative from the Phase 3 valuation model —
        // it is displayed read-only, not user-entered. Prefer the backend-computed
        // finalValuation; the funding-profile value above is only a fallback.
        try {
          const fin = await entrepreneurApi.getFinancialSummary(id);
          if (!cancelled && fin?.finalValuation != null && fin.finalValuation > 0) {
            setPreMoneyValuation(String(Math.round(fin.finalValuation)));
          }
        } catch {
          /* keep the funding-profile pre-money value already set above */
        }

        if (profile.capitalAllocation?.length) {
          setAllocations(
            profile.capitalAllocation.map((c) => ({
              category: c.category,
              percent: String(c.percent),
            })),
          );
        }

        if (profile.resourceMap?.hiringPlan?.length) {
          setHiring(
            profile.resourceMap.hiringPlan.map((h) => ({
              role: h.role,
              salary: String(h.salary),
              timeline: h.timeline,
              priority: h.priority,
            })),
          );
        }

        if (profile.fundingNarrative) setNarrative(profile.fundingNarrative);
        if (profile.pitchDeckFileName) {
          const deck = await entrepreneurApi.getPitchDeck(id);
          if (!cancelled) setPitchDeck(deck);
        }
      } catch {
        // empty form is fine
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeCompanyId, getPhaseData]);

  const allocationTotal = allocations.reduce(
    (s, a) => s + (parseFloat(a.percent) || 0),
    0,
  );

  const [isSavingStep, setIsSavingStep] = useState(false);

  // Step 1 validation
  const validateStep1 = (): boolean => {
    setValidationError('');
    if (allocations.length === 0) {
      setValidationError('At least one allocation category is required');
      return false;
    }
    for (const a of allocations) {
      const p = parseFloat(a.percent);
      if (!a.category.trim() || !Number.isFinite(p) || p < 0) {
        setValidationError('Every allocation row needs a category and non-negative percent');
        return false;
      }
    }
    if (allocationTotal < 95 || allocationTotal > 105) {
      setValidationError(
        `Capital allocation must total ~100% (currently ${allocationTotal.toFixed(2)}%)`,
      );
      return false;
    }
    return true;
  };

  // Step 2 validation - Hiring plan is optional
  const validateStep2 = (): boolean => {
    setValidationError('');
    for (const h of hiring) {
      if (!h.role.trim() && !h.salary.trim() && !h.timeline.trim()) {
        continue;
      }
      if (!h.role.trim() || !h.timeline.trim()) {
        setValidationError('Hiring plan rows need a role and timeline');
        return false;
      }
      const s = parseFloat(h.salary);
      if (!Number.isFinite(s) || s <= 0) {
        setValidationError(`Hiring row '${h.role}': salary must be greater than 0`);
        return false;
      }
    }
    return true;
  };

  // Step 3 validation
  const validateStep3 = (): boolean => {
    setValidationError('');
    const raise = parseFloat(raiseAmount);
    if (!Number.isFinite(raise) || raise <= 0) {
      setValidationError('Raise amount must be greater than 0');
      return false;
    }
    // Pre-money valuation is backend-derived (Phase 3 finalValuation) and read-only,
    // so we only assert it exists — the user can't adjust it to satisfy a raise cap.
    const preMoney = parseFloat(preMoneyValuation);
    if (!Number.isFinite(preMoney) || preMoney <= 0) {
      setValidationError('Pre-money valuation unavailable — complete your Phase 3 valuation first.');
      return false;
    }
    if (shareType === 'preferred') {
      const equity = parseFloat(equityOfferedPercent);
      if (!Number.isFinite(equity) || equity <= 0 || equity > 100) {
        setValidationError('Equity offered must be between 0 and 100%');
        return false;
      }
    }
    const minTicket = minimumTicket.trim() ? parseFloat(minimumTicket) : undefined;
    if (minTicket !== undefined && (!Number.isFinite(minTicket) || minTicket < 0)) {
      setValidationError('Minimum ticket must be a non-negative number');
      return false;
    }
    if (pitchDeckUploading) {
      setValidationError('Wait for pitch deck upload to complete');
      return false;
    }
    if (!pitchDeck) {
      setValidationError('Upload your pitch deck before submitting');
      return false;
    }
    if (narrative.trim().length < NARRATIVE_MIN_LENGTH) {
      setValidationError(`Funding narrative must be at least ${NARRATIVE_MIN_LENGTH} characters`);
      return false;
    }
    if (narrative.trim().length > NARRATIVE_MAX_LENGTH) {
      setValidationError(`Funding narrative must be at most ${NARRATIVE_MAX_LENGTH} characters`);
      return false;
    }
    return true;
  };

  const handleNextStep = async () => {
    setValidationError('');
    const targetCompanyId = activeCompanyId || companyId;
    if (!targetCompanyId) {
      setValidationError('No active company found. Please refresh the page.');
      return;
    }
    if (currentStep === 1) {
      if (!validateStep1()) return;
      setIsSavingStep(true);
      try {
        const raise = parseFloat(raiseAmount) || 0;
        const preMoney = parseFloat(preMoneyValuation) || 0;
        await entrepreneurApi.saveFundingAsk(targetCompanyId, {
          raiseAmount: raise,
          roundType,
          preMoneyValuation: preMoney,
          shareType,
          capitalAllocation: allocations.map((a) => ({
            category: a.category.trim(),
            percent: parseFloat(a.percent) || 0,
            amount: raise > 0 ? (raise * (parseFloat(a.percent) || 0)) / 100 : 0,
          })),
          resourceMap: {
            hiringPlan: hiring
              .filter((h) => h.role.trim())
              .map((h) => ({
                role: h.role.trim(),
                salary: parseFloat(h.salary) || 0,
                timeline: h.timeline.trim(),
                priority: h.priority,
              })),
            serviceProviders: [],
            techTools: [],
          },
        });
        setCurrentStep(2);
      } catch (error) {
        setValidationError(error instanceof Error ? error.message : 'Failed to save capital allocation');
      } finally {
        setIsSavingStep(false);
      }
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      setIsSavingStep(true);
      try {
        const raise = parseFloat(raiseAmount) || 0;
        const preMoney = parseFloat(preMoneyValuation) || 0;
        await entrepreneurApi.saveFundingAsk(targetCompanyId, {
          raiseAmount: raise,
          roundType,
          preMoneyValuation: preMoney,
          shareType,
          capitalAllocation: allocations.map((a) => ({
            category: a.category.trim(),
            percent: parseFloat(a.percent) || 0,
            amount: raise > 0 ? (raise * (parseFloat(a.percent) || 0)) / 100 : 0,
          })),
          resourceMap: {
            hiringPlan: hiring
              .filter((h) => h.role.trim())
              .map((h) => ({
                role: h.role.trim(),
                salary: parseFloat(h.salary) || 0,
                timeline: h.timeline.trim(),
                priority: h.priority,
              })),
            serviceProviders: [],
            techTools: [],
          },
        });
        setCurrentStep(3);
      } catch (error) {
        setValidationError(error instanceof Error ? error.message : 'Failed to save resource plan');
      } finally {
        setIsSavingStep(false);
      }
    }
  };

  const handlePrevStep = () => {
    setValidationError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePitchUpload = async (file: File) => {
    setValidationError('');
    const targetCompanyId = activeCompanyId || companyId;
    if (!targetCompanyId) {
      setValidationError('No active company found. Please refresh the page.');
      return;
    }
    setPitchDeckUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploaded = await entrepreneurApi.uploadPitchDeck(targetCompanyId, fd);
      setPitchDeck(uploaded);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to upload pitch deck';
      setValidationError(msg);
    } finally {
      setPitchDeckUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;
    const targetCompanyId = activeCompanyId || companyId;
    if (!targetCompanyId) {
      setValidationError('No active company found. Please refresh the page.');
      return;
    }

    setIsSubmitting(true);
    try {
      const raise = parseFloat(raiseAmount);
      const preMoney = parseFloat(preMoneyValuation);
      const equity = parseFloat(equityOfferedPercent);
      const minTicket = minimumTicket.trim() ? parseFloat(minimumTicket) : undefined;

      // Save funding ask and narrative in parallel, then advance phase.
      // If either fails, the entire submission fails (no partial state).
      await Promise.all([
        entrepreneurApi.saveFundingAsk(targetCompanyId, {
          raiseAmount: raise,
          roundType,
          preMoneyValuation: preMoney,
          equityOfferedPercent: shareType === 'preferred' && Number.isFinite(equity) ? equity : undefined,
          shareType,
          minimumTicketEur: minTicket,
          capitalAllocation: allocations.map((a) => ({
            category: a.category.trim(),
            percent: parseFloat(a.percent) || 0,
            amount: (raise * (parseFloat(a.percent) || 0)) / 100,
          })),
          resourceMap: {
            hiringPlan: hiring
              .filter((h) => h.role.trim())
              .map((h) => ({
                role: h.role.trim(),
                salary: parseFloat(h.salary) || 0,
                timeline: h.timeline.trim(),
                priority: h.priority,
              })),
            serviceProviders: [],
            techTools: [],
          },
        }),
        entrepreneurApi.saveFundingNarrative(targetCompanyId, {
          narrative: narrative.trim(),
        }),
      ]);

      // Both save calls succeeded; now advance phase.
      const advanceResponse = await entrepreneurApi.advancePhase(targetCompanyId, 5, {});
      if (advanceResponse?.currentPhase !== 6) {
        throw new Error(
          `Phase advancement failed - expected currentPhase=6, got ${advanceResponse?.currentPhase}`,
        );
      }

      applyBackendResponse(advanceResponse);
      savePhaseData(5, {
        __companyId: targetCompanyId,
        submittedAt: new Date().toISOString(),
      });

      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur/phase-5/complete');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to submit Phase 5';
      setValidationError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateAllocation = (i: number, patch: Partial<AllocationRow>) =>
    setAllocations((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addAllocation = () =>
    setAllocations((rs) => [...rs, { category: '', percent: '' }]);
  const removeAllocation = (i: number) =>
    setAllocations((rs) => rs.filter((_, idx) => idx !== i));

  const updateHiring = (i: number, patch: Partial<HiringRow>) =>
    setHiring((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const addHiring = () =>
    setHiring((rs) => [...rs, { role: '', salary: '', timeline: '', priority: 'high' }]);
  const removeHiring = (i: number) =>
    setHiring((rs) => rs.filter((_, idx) => idx !== i));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-muted-foreground">Loading Phase 5...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          {currentStep === 1
            ? 'Capital Allocation'
            : currentStep === 2
              ? 'Resource Mapping'
              : 'Equity Offer & Pitch'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {currentStep === 1
            ? "Define how you'll allocate the capital."
            : currentStep === 2
              ? "Plan your team and hiring needs."
              : "Complete your equity offer, upload pitch deck, and add funding narrative."}
        </p>
      </div>

      {/* Step 1: Capital Allocation */}
      {currentStep === 1 && (
        <div className="bg-card border-2 border-border rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground">Capital allocation</h3>
            <Button size="sm" onClick={addAllocation} className="gap-2">
              <Plus className="w-4 h-4" /> Add category
            </Button>
          </div>
          <div className="space-y-2">
            {allocations.map((a, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-end">
                <Input
                  type="text"
                  value={a.category}
                  onChange={(e) => updateAllocation(idx, { category: e.target.value })}
                  placeholder="Category"
                  className="sm:col-span-7 h-9 bg-background border-input"
                />
                <div className="flex gap-2 sm:contents">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={a.percent}
                    onChange={(e) => updateAllocation(idx, { percent: e.target.value })}
                    placeholder="%"
                    className="flex-1 sm:col-span-4 h-9 bg-background border-input"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="sm:col-span-1"
                    onClick={() => removeAllocation(idx)}
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p
            className={`text-sm font-semibold ${
              allocationTotal >= 95 && allocationTotal <= 105
                ? 'text-success-text'
                : 'text-warning'
            }`}
          >
            Total: {allocationTotal.toFixed(2)}%
          </p>
        </div>
      )}

      {/* Step 2: Resource Mapping */}
      {currentStep === 2 && (
        <div className="bg-card border-2 border-border rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-foreground">Hiring plan</h3>
              <p className="text-xs text-muted-foreground">
                Optional hiring plan — add roles you plan to hire with this funding. Leave this section empty if the round does not include immediate hiring.
              </p>
            </div>
            <Button size="sm" onClick={addHiring} className="gap-2 shrink-0">
              <Plus className="w-4 h-4" /> Add role
            </Button>
          </div>
          <div className="space-y-2">
            {hiring.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 italic">
                No hiring planned for this funding round. Click &quot;Add role&quot; above if you wish to include planned team additions.
              </p>
            ) : (
              hiring.map((h, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:items-end">
                  <Input
                    type="text"
                    value={h.role}
                    onChange={(e) => updateHiring(idx, { role: e.target.value })}
                    placeholder="Role"
                    className="sm:col-span-3 h-9 bg-background border-input"
                  />
                  <Input
                    type="number"
                    min={0}
                    value={h.salary}
                    onChange={(e) => updateHiring(idx, { salary: e.target.value })}
                    placeholder="Salary (€)"
                    className="sm:col-span-3 h-9 bg-background border-input"
                  />
                  <Input
                    type="text"
                    value={h.timeline}
                    onChange={(e) => updateHiring(idx, { timeline: e.target.value })}
                    placeholder="Timeline"
                    className="sm:col-span-3 h-9 bg-background border-input"
                  />
                  <div className="flex gap-2 sm:contents">
                    <select
                      value={h.priority}
                      onChange={(e) => updateHiring(idx, { priority: e.target.value })}
                      aria-label={`Hiring row ${idx + 1} priority`}
                      className="flex-1 sm:col-span-2 h-9 rounded-md border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="high">high</option>
                      <option value="medium">medium</option>
                      <option value="low">low</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="sm:col-span-1"
                      onClick={() => removeHiring(idx)}
                      aria-label="Remove"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Step 3: Equity Offer & Pitch */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Funding ask */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 sm:p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Funding ask</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="p5-raise" className="block text-sm font-semibold text-foreground mb-2">
                  Raise amount (€)
                </label>
                <Input
                  id="p5-raise"
                  type="number"
                  min={0}
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(e.target.value)}
                  className="h-10 bg-background border-input"
                />
              </div>
              <div>
                <label htmlFor="p5-premoney" className="block text-sm font-semibold text-foreground mb-2">
                  Pre-money valuation (€)
                </label>
                <Input
                  id="p5-premoney"
                  type="number"
                  min={0}
                  value={preMoneyValuation}
                  readOnly
                  disabled
                  aria-readonly
                  className="h-10 bg-muted border-input text-muted-foreground cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Auto-calculated from your Phase 3 valuation.
                </p>
              </div>
              <div>
                <label htmlFor="p5-equity" className="block text-sm font-semibold text-foreground mb-2">
                  Equity offered (%)
                </label>
                {shareType === 'preferred' ? (
                  <Input
                    id="p5-equity"
                    type="number"
                    min={0}
                    max={100}
                    value={equityOfferedPercent}
                    onChange={(e) => setEquityOfferedPercent(e.target.value)}
                    className="h-10 bg-background border-input"
                  />
                ) : (
                  <>
                    <Input
                      id="p5-equity"
                      type="text"
                      value="Not applicable"
                      disabled
                      readOnly
                      aria-readonly
                      className="h-10 bg-muted border-input text-muted-foreground cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Non-equity instrument: equity conversion terms are defined during Phase 9 deal execution.
                    </p>
                  </>
                )}
              </div>
              <div>
                <label htmlFor="p5-round" className="block text-sm font-semibold text-foreground mb-2">
                  Round
                </label>
                <select
                  id="p5-round"
                  value={roundType}
                  onChange={(e) => setRoundType(e.target.value as RoundType)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="pre_seed">pre_seed</option>
                  <option value="seed">seed</option>
                  <option value="series_a">series_a</option>
                </select>
              </div>
              <div>
                <label htmlFor="p5-share" className="block text-sm font-semibold text-foreground mb-2">
                  Funding instrument
                </label>
                <select
                  id="p5-share"
                  value={shareType}
                  onChange={(e) => setShareType(e.target.value as ShareType)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="preferred">Preferred Equity</option>
                  <option value="safe">SAFE</option>
                  <option value="note">Convertible Note</option>
                </select>
              </div>
              <div>
                <label htmlFor="p5-minticket" className="block text-sm font-semibold text-foreground mb-2">
                  Minimum ticket (€)
                </label>
                <Input
                  id="p5-minticket"
                  type="number"
                  min={0}
                  value={minimumTicket}
                  onChange={(e) => setMinimumTicket(e.target.value)}
                  placeholder="Optional"
                  className="h-10 bg-background border-input"
                />
              </div>
            </div>
          </div>

          {/* Pitch deck */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 sm:p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Pitch deck</h3>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-background border-2 border-input rounded-xl p-4">
              <div className="flex items-start gap-3 flex-1">
                <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Investor pitch deck</p>
                  {pitchDeck ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {pitchDeck.fileName} · uploaded{' '}
                      {new Date(pitchDeck.uploadedAt).toLocaleString()}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">PDF, PPTX, or DOCX. Required.</p>
                  )}
                </div>
              </div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.ppt,.pptx,.doc,.docx"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handlePitchUpload(f);
                  }}
                />
                <Button
                  asChild
                  variant={pitchDeck ? 'outline' : 'default'}
                  size="sm"
                  disabled={uploadingDeck}
                  className="gap-2"
                >
                  <span>
                    <Upload className="w-4 h-4" />
                    {uploadingDeck ? 'Uploading…' : pitchDeck ? 'Replace' : 'Upload'}
                  </span>
                </Button>
              </label>
            </div>
          </div>

          {/* Funding narrative */}
          <div className="bg-card border-2 border-border rounded-2xl p-4 sm:p-6 space-y-3">
            <h3 className="text-lg font-bold text-foreground">Funding narrative</h3>
            <p className="text-xs text-muted-foreground">
              Describe your funding needs, use of capital, and traction. Minimum{' '}
              {NARRATIVE_MIN_LENGTH} characters.
            </p>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              maxLength={NARRATIVE_MAX_LENGTH}
              placeholder="Describe how the round will be used, key milestones, and what investors get…"
              aria-label="Funding narrative"
              className="w-full h-40 p-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground"
            />
            <p
              className={`text-xs font-semibold ${
                narrative.trim().length >= NARRATIVE_MIN_LENGTH
                  ? 'text-success-text'
                  : 'text-muted-foreground'
              }`}
            >
              {narrative.trim().length} / {NARRATIVE_MIN_LENGTH} characters
            </p>
          </div>
        </div>
      )}

      {validationError && (
        <div className="bg-destructive/10 border-2 border-destructive/30 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-destructive">{validationError}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-wrap gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handlePrevStep}
          disabled={currentStep === 1 || isSubmitting}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </Button>

        {currentStep < 3 ? (
          <Button onClick={handleNextStep} disabled={isSubmitting} className="gap-2 ml-auto">
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        ) : currentPhase! <= 5 ? (
          <Button onClick={handleSubmit} disabled={isSubmitting} className="gap-2 ml-auto">
            {isSubmitting ? 'Submitting…' : 'Complete Phase 5'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, FileText, Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import { StepFooter } from '@/components/entrepreneur/StepFooter';
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

export default function Phase5Client() {
  const router = useRouter();
  const { savePhaseData, moveToNextStep, getPhaseData, applyBackendResponse } =
    useEntrepreneurProgress();

  // Funding ask
  const [raiseAmount, setRaiseAmount] = useState('');
  const [roundType, setRoundType] = useState<RoundType>('pre_seed');
  const [preMoneyValuation, setPreMoneyValuation] = useState('');
  const [equityOfferedPercent, setEquityOfferedPercent] = useState('');
  const [shareType, setShareType] = useState<ShareType>('preferred');

  // Capital allocation
  const [allocations, setAllocations] = useState<AllocationRow[]>([
    { category: 'Product', percent: '' },
    { category: 'Sales & marketing', percent: '' },
    { category: 'Operations', percent: '' },
  ]);

  // Hiring plan
  const [hiring, setHiring] = useState<HiringRow[]>([
    { role: '', salary: '', timeline: '', priority: 'high' },
  ]);

  // Pitch deck + narrative
  const [pitchDeck, setPitchDeck] = useState<PitchDeckResponse | null>(null);
  const [uploadingDeck, setUploadingDeck] = useState(false);
  const [narrative, setNarrative] = useState('');

  const [validationError, setValidationError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const existing: Phase5Data = getPhaseData<Phase5Data>(5) ?? {};
        const companyId =
          existing.__companyId ?? (await entrepreneurApi.getCurrentPhase()).companyId;
        if (!companyId) return;
        const profile: FundingProfileResponse =
          await entrepreneurApi.getFundingProfile(companyId);
        if (cancelled) return;
        if (profile.fundingAskAmount != null) setRaiseAmount(String(profile.fundingAskAmount));
        if (profile.fundingRoundType) setRoundType(profile.fundingRoundType as RoundType);
        if (profile.preMoneyValuation != null)
          setPreMoneyValuation(String(profile.preMoneyValuation));
        if (profile.equityOfferedPercent != null)
          setEquityOfferedPercent(String(profile.equityOfferedPercent));
        if (profile.shareType) setShareType(profile.shareType as ShareType);
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
          const deck = await entrepreneurApi.getPitchDeck(companyId);
          if (!cancelled) setPitchDeck(deck);
        }
      } catch {
        // empty form is fine
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getPhaseData]);

  const allocationTotal = allocations.reduce(
    (s, a) => s + (parseFloat(a.percent) || 0),
    0,
  );

  async function resolveCompanyId(): Promise<string> {
    const existing: Phase5Data = getPhaseData<Phase5Data>(5) ?? {};
    if (existing.__companyId) return existing.__companyId;
    const fromServer = await entrepreneurApi.getCurrentPhase();
    if (!fromServer?.companyId) throw new Error('No company found in backend');
    return fromServer.companyId;
  }

  const handlePitchUpload = async (file: File) => {
    setValidationError('');
    setUploadingDeck(true);
    try {
      const companyId = await resolveCompanyId();
      const fd = new FormData();
      fd.append('file', file);
      const uploaded = await entrepreneurApi.uploadPitchDeck(companyId, fd);
      setPitchDeck(uploaded);
      const existing: Phase5Data = getPhaseData<Phase5Data>(5) ?? {};
      savePhaseData(5, {
        ...existing,
        __companyId: companyId,
        pitchDeckUploadedAt: uploaded.uploadedAt,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to upload pitch deck';
      setValidationError(msg);
    } finally {
      setUploadingDeck(false);
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

  const handleSubmit = async () => {
    setValidationError('');

    const raise = parseFloat(raiseAmount);
    if (!Number.isFinite(raise) || raise <= 0) {
      setValidationError('Raise amount must be greater than 0');
      return;
    }
    const preMoney = parseFloat(preMoneyValuation);
    if (!Number.isFinite(preMoney) || preMoney <= 0) {
      setValidationError('Pre-money valuation must be greater than 0');
      return;
    }
    const equity = parseFloat(equityOfferedPercent);
    if (!Number.isFinite(equity) || equity <= 0 || equity > 100) {
      setValidationError('Equity offered must be between 0 and 100');
      return;
    }
    if (allocationTotal < 95 || allocationTotal > 105) {
      setValidationError(
        `Capital allocation must total ~100% (currently ${allocationTotal.toFixed(2)}%)`,
      );
      return;
    }
    for (const a of allocations) {
      const p = parseFloat(a.percent);
      if (!a.category.trim() || !Number.isFinite(p) || p < 0) {
        setValidationError('Every allocation row needs a category and non-negative percent');
        return;
      }
    }
    if (hiring.length === 0) {
      setValidationError('At least one hiring plan entry is required');
      return;
    }
    for (const h of hiring) {
      if (!h.role.trim() || !h.timeline.trim()) {
        setValidationError('Hiring plan rows need a role and timeline');
        return;
      }
      const s = parseFloat(h.salary);
      if (!Number.isFinite(s) || s < 0) {
        setValidationError(`Hiring row '${h.role}': salary must be a non-negative number`);
        return;
      }
    }
    if (!pitchDeck) {
      setValidationError('Upload your pitch deck before submitting');
      return;
    }
    if (narrative.trim().length < NARRATIVE_MIN_LENGTH) {
      setValidationError(`Funding narrative must be at least ${NARRATIVE_MIN_LENGTH} characters`);
      return;
    }

    setIsSubmitting(true);
    try {
      const companyId = await resolveCompanyId();

      await entrepreneurApi.saveFundingAsk(companyId, {
        raiseAmount: raise,
        roundType,
        preMoneyValuation: preMoney,
        equityOfferedPercent: equity,
        shareType,
        capitalAllocation: allocations.map((a) => ({
          category: a.category.trim(),
          amount: (raise * parseFloat(a.percent)) / 100,
          percent: parseFloat(a.percent),
        })),
        resourceMap: {
          hiringPlan: hiring.map((h) => ({
            role: h.role.trim(),
            salary: parseFloat(h.salary),
            timeline: h.timeline.trim(),
            priority: h.priority,
          })),
          serviceProviders: [],
          techTools: [],
        },
      });

      await entrepreneurApi.saveFundingNarrative(companyId, {
        narrative: narrative.trim(),
      });

      const advanceResponse = await entrepreneurApi.advancePhase(companyId, 5, {});
      if (advanceResponse?.currentPhase !== 6) {
        throw new Error(
          `Phase advancement failed - expected currentPhase=6, got ${advanceResponse?.currentPhase}`,
        );
      }
      if (!advanceResponse?.completedPhases?.includes(5)) {
        throw new Error('Phase 5 not marked as completed in backend response');
      }

      applyBackendResponse(advanceResponse);

      const existing: Phase5Data = getPhaseData<Phase5Data>(5) ?? {};
      savePhaseData(5, {
        ...existing,
        __companyId: companyId,
        fundingAskSavedAt: new Date().toISOString(),
        narrativeSavedAt: new Date().toISOString(),
        submittedAt: new Date().toISOString(),
      });
      moveToNextStep(5, 1);

      await new Promise((r) => setTimeout(r, 300));
      router.push('/dashboard/entrepreneur/phase-6');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to submit Phase 5';
      setValidationError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Funding ask */}
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-neutral-1">Funding ask</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-1 mb-2">
              Raise amount (€)
            </label>
            <Input
              type="number"
              min={0}
              value={raiseAmount}
              onChange={(e) => setRaiseAmount(e.target.value)}
              className="h-10 bg-background border-neutral-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-1 mb-2">
              Pre-money valuation (€)
            </label>
            <Input
              type="number"
              min={0}
              value={preMoneyValuation}
              onChange={(e) => setPreMoneyValuation(e.target.value)}
              className="h-10 bg-background border-neutral-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-1 mb-2">
              Equity offered (%)
            </label>
            <Input
              type="number"
              min={0}
              max={100}
              value={equityOfferedPercent}
              onChange={(e) => setEquityOfferedPercent(e.target.value)}
              className="h-10 bg-background border-neutral-2"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-1 mb-2">Round</label>
            <select
              value={roundType}
              onChange={(e) => setRoundType(e.target.value as RoundType)}
              className="h-10 w-full rounded-md border border-neutral-2 bg-background px-3 text-sm"
            >
              <option value="pre_seed">pre_seed</option>
              <option value="seed">seed</option>
              <option value="series_a">series_a</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-1 mb-2">
              Share type
            </label>
            <select
              value={shareType}
              onChange={(e) => setShareType(e.target.value as ShareType)}
              className="h-10 w-full rounded-md border border-neutral-2 bg-background px-3 text-sm"
            >
              <option value="preferred">preferred</option>
              <option value="safe">safe</option>
              <option value="note">note</option>
            </select>
          </div>
        </div>
      </div>

      {/* Capital allocation */}
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-1">Capital allocation</h3>
          <Button variant="outline" size="sm" onClick={addAllocation} className="gap-2">
            <Plus className="w-4 h-4" /> Add category
          </Button>
        </div>
        <div className="space-y-2">
          {allocations.map((a, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <Input
                type="text"
                value={a.category}
                onChange={(e) => updateAllocation(idx, { category: e.target.value })}
                placeholder="Category"
                className="col-span-7 h-9 bg-background border-neutral-2"
              />
              <Input
                type="number"
                min={0}
                max={100}
                value={a.percent}
                onChange={(e) => updateAllocation(idx, { percent: e.target.value })}
                placeholder="%"
                className="col-span-4 h-9 bg-background border-neutral-2"
              />
              <Button
                variant="ghost"
                size="sm"
                className="col-span-1"
                onClick={() => removeAllocation(idx)}
                aria-label="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <p
          className={`text-sm font-semibold ${
            allocationTotal >= 95 && allocationTotal <= 105
              ? 'text-green-700'
              : 'text-amber-700'
          }`}
        >
          Total: {allocationTotal.toFixed(2)}%
        </p>
      </div>

      {/* Hiring plan */}
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-neutral-1">Hiring plan</h3>
          <Button variant="outline" size="sm" onClick={addHiring} className="gap-2">
            <Plus className="w-4 h-4" /> Add role
          </Button>
        </div>
        <div className="space-y-2">
          {hiring.map((h, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <Input
                type="text"
                value={h.role}
                onChange={(e) => updateHiring(idx, { role: e.target.value })}
                placeholder="Role"
                className="col-span-3 h-9 bg-background border-neutral-2"
              />
              <Input
                type="number"
                min={0}
                value={h.salary}
                onChange={(e) => updateHiring(idx, { salary: e.target.value })}
                placeholder="Salary (€)"
                className="col-span-3 h-9 bg-background border-neutral-2"
              />
              <Input
                type="text"
                value={h.timeline}
                onChange={(e) => updateHiring(idx, { timeline: e.target.value })}
                placeholder="Timeline"
                className="col-span-3 h-9 bg-background border-neutral-2"
              />
              <select
                value={h.priority}
                onChange={(e) => updateHiring(idx, { priority: e.target.value })}
                className="col-span-2 h-9 rounded-md border border-neutral-2 bg-background px-2 text-sm"
              >
                <option value="high">high</option>
                <option value="medium">medium</option>
                <option value="low">low</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                className="col-span-1"
                onClick={() => removeHiring(idx)}
                aria-label="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Pitch deck */}
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-neutral-1">Pitch deck</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-background border-2 border-neutral-2 rounded-xl p-4">
          <div className="flex items-start gap-3 flex-1">
            <FileText className="w-5 h-5 text-neutral-5 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-neutral-1">Investor pitch deck</p>
              {pitchDeck ? (
                <p className="text-xs text-neutral-5 mt-1">
                  {pitchDeck.fileName} · uploaded{' '}
                  {new Date(pitchDeck.uploadedAt).toLocaleString()}
                </p>
              ) : (
                <p className="text-xs text-neutral-5 mt-1">PDF, PPTX, or DOCX. Required.</p>
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
      <div className="bg-neutral-3 border-2 border-neutral-4 rounded-2xl p-6 space-y-3">
        <h3 className="text-lg font-bold text-neutral-1">Funding narrative</h3>
        <p className="text-xs text-neutral-5">
          Describe your funding needs, use of capital, and traction. Minimum{' '}
          {NARRATIVE_MIN_LENGTH} characters.
        </p>
        <textarea
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          placeholder="Describe how the round will be used, key milestones, and what investors get…"
          className="w-full h-40 p-3 border border-neutral-2 rounded-lg bg-background text-neutral-1 placeholder-neutral-5"
        />
        <p
          className={`text-xs font-semibold ${
            narrative.trim().length >= NARRATIVE_MIN_LENGTH
              ? 'text-green-700'
              : 'text-neutral-5'
          }`}
        >
          {narrative.trim().length} / {NARRATIVE_MIN_LENGTH} characters
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Submitting Phase 5 sends your funding ask, pitch deck, and narrative to compliance
          review and unlocks Phase 6. Verified investor-facing status is awarded separately after
          review.
        </p>
      </div>

      {validationError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-semibold text-red-900">{validationError}</p>
        </div>
      )}

      <StepFooter
        backUrl="/dashboard/entrepreneur/phase-4"
        onNextClick={handleSubmit}
        isLoading={isSubmitting}
        nextLabel="Submit &amp; Complete Phase 5"
        nextValidationError={validationError}
      />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Shield, Lock, CheckCircle, Plus, Trash2, Zap, ArrowLeft, ArrowRight, UserCircle2, Lightbulb, Loader2 } from 'lucide-react';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';
import entrepreneurApi from '@/lib/api-entrepreneur';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Phase2Data } from '@/types/entrepreneur';

const labelClass = 'block text-sm font-medium text-foreground uppercase tracking-wide mb-2';
const inputClass = 'h-auto bg-popover border-border rounded-lg px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground';

const NATIONALITIES = ['United States', 'Canada', 'United Kingdom', 'France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Switzerland', 'Other'];
const ROLES = ['CEO', 'CFO', 'COO', 'CMO', 'CTO', 'Founder', 'General Manager', 'Director', 'Manager', 'Shareholder'];

interface Owner {
  name: string;
  email: string;
  ownership: string;
  nationality: string;
  role?: string;
}

const emptyOwner: Owner = { name: '', email: '', ownership: '', nationality: '', role: '' };

function Phase2Step3PageContent() {
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [owners, setOwners] = useState<Owner[]>([{ ...emptyOwner }]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { progress, savePhaseData, moveToNextStep, getPhaseData } = useEntrepreneurProgress();

  // Fetch existing beneficial owners on mount
  useEffect(() => {
    const fetchOwners = async () => {
      try {
        setIsLoading(true);
        const existingData: Phase2Data = getPhaseData<Phase2Data>(2) ?? {};
        let companyId = existingData.__companyId;

        if (!companyId) {
          const phaseProgress = await entrepreneurApi.getCurrentPhase();
          companyId = phaseProgress?.companyId;
        }

        if (companyId) {
          const beneficialOwners = await entrepreneurApi.getBeneficialOwners(companyId);
          if (beneficialOwners && beneficialOwners.length > 0) {
            setOwners(
              beneficialOwners.map((owner: any) => ({
                name: owner.fullName || '',
                email: owner.email || '',
                ownership: String(owner.ownershipPercent || ''),
                nationality: owner.nationality || '',
                role: owner.role || '',
              }))
            );
          }
        }
      } catch (error) {
        console.warn('Failed to fetch beneficial owners:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (progress) {
      fetchOwners();
    }
  }, [progress, getPhaseData]);

  const updateOwner = (index: number, patch: Partial<Owner>) => {
    setOwners((prev) => prev.map((o, i) => (i === index ? { ...o, ...patch } : o)));
  };

  const handleAddShareholder = () => {
    setOwners((prev) => [...prev, { ...emptyOwner }]);
    setValidationError('');
  };

  const handleRemoveOwner = (index: number) => {
    setOwners((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const validOwners = () =>
    owners.filter((o) => o.name.trim() && o.ownership.trim() && o.nationality.trim());

  const handleSaveOwners = async (): Promise<void> => {
    const valid = validOwners();
    if (valid.length === 0) {
      throw new Error('At least one beneficial owner with Name, Ownership % and Nationality is required');
    }
    for (const o of valid) {
      const parsed = parseFloat(o.ownership);
      if (Number.isNaN(parsed) || parsed <= 0 || parsed > 100) {
        throw new Error(`Ownership for ${o.name} must be between 0 and 100`);
      }
    }

    setIsSaving(true);
    try {
      const existingData: Phase2Data = getPhaseData<Phase2Data>(2) ?? {};
      let companyId = existingData.__companyId;

      if (!companyId) {
        const phaseProgress = await entrepreneurApi.getCurrentPhase();
        companyId = phaseProgress?.companyId;
        if (!companyId) throw new Error('No company found');
      }

      await entrepreneurApi.updateBeneficialOwners(companyId, {
        owners: valid.map((o) => ({
          fullName: o.name,
          email: o.email || `${o.name.toLowerCase().replace(/\s+/g, '.')}@company.local`,
          ownershipPercent: parseFloat(o.ownership),
          nationality: o.nationality,
        })),
      });

      savePhaseData(2, { ...existingData, beneficialOwnersSaved: true });
      setValidationError('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraftClick = async () => {
    try {
      await handleSaveOwners();
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to save owners');
    }
  };

  const handleNextClick = async () => {
    setValidationError('');
    setIsValidating(true);
    try {
      await handleSaveOwners();
      moveToNextStep(2, 3);
      await new Promise((resolve) => setTimeout(resolve, 300));
      router.push('/dashboard/entrepreneur/phase-2/step-4');
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to proceed');
    } finally {
      setIsValidating(false);
    }
  };

  if (!progress || isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1072px] space-y-6">
        <div className="flex flex-col gap-8 bg-card border-2 border-background rounded-[20px] shadow-sm p-12 items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-base font-medium text-foreground">Loading ownership records...</p>
            <p className="text-sm text-muted-foreground">Fetching beneficial owners and identity checks.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1072px] space-y-6">
      {/* Main Card */}
      <div className="flex flex-col gap-8 bg-card border-2 border-background rounded-[20px] shadow-sm">
        {/* Header Section */}
        <div className="flex flex-col gap-4 border-b border-border p-6 md:flex-row md:items-end md:gap-8">
          <div className="min-w-0 flex-1 space-y-2">
            <h1 className="text-2xl sm:text-3xl font-medium text-foreground leading-tight">Ownership &amp; KYC</h1>
            <p className="text-sm text-muted-foreground">
              Identify significant owners and verify key representatives to comply with international regulations.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-[18px]">
            <div className="flex flex-col items-end gap-1 text-right">
              <p className="text-[13px] text-muted-foreground">PROGRESS</p>
              <p className="text-base font-medium text-foreground">
                {validOwners().length} Owner{validOwners().length !== 1 ? 's' : ''} Added
              </p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-full border border-border bg-secondary">
              <Users className="size-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Beneficial Ownership Section */}
        <div className="px-6 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Beneficial Ownership</h3>
              <p className="text-sm text-muted-foreground">Identify beneficial owners and complete biometric identity verification.</p>
            </div>
          </div>

          {/* Owner rows */}
          <div className="space-y-4">
            {owners.map((owner, index) => (
              <div key={index} className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <label className={labelClass}>Full Name</label>
                  <Input
                    placeholder="John Doe"
                    value={owner.name}
                    onChange={(e) => updateOwner(index, { name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Ownership (%)</label>
                  <Input
                    placeholder="20"
                    type="number"
                    min="0"
                    max="100"
                    value={owner.ownership}
                    onChange={(e) => updateOwner(index, { ownership: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Nationality</label>
                  <Select value={owner.nationality} onValueChange={(value) => updateOwner(index, { nationality: value })}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="United States" />
                    </SelectTrigger>
                    <SelectContent>
                      {NATIONALITIES.map((n) => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <label className={labelClass}>Role</label>
                  <Select value={owner.role || ''} onValueChange={(value) => updateOwner(index, { role: value })}>
                    <SelectTrigger className={inputClass}>
                      <SelectValue placeholder="CEO" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  onClick={() => handleRemoveOwner(index)}
                  aria-label="Remove owner"
                  className="flex h-[46px] w-12 flex-shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          <Button
            onClick={handleAddShareholder}
            variant="outline"
            className="gap-2 border-primary text-primary hover:bg-primary/5"
          >
            <Plus className="h-4 w-4" />
            Add Shareholder
          </Button>
        </div>

        {/* Representative KYC & Security Subgrid */}
        <div className="grid grid-cols-1 gap-6 px-6 md:grid-cols-2">
          {/* Representative KYC */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Representative KYC</h3>
              <p className="text-xs text-muted-foreground">Verify owners and conduct biometric checks for KYC.</p>
            </div>
            <div className="space-y-4 rounded-2xl border border-border bg-popover p-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-primary bg-primary/10">
                  <UserCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Primary Applicant</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {validOwners()[0]?.name || 'Company Representative'}
                  </p>
                </div>
                <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1">
                  <p className="text-xs font-semibold text-primary">NOT STARTED</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete the biometric identity verification using your mobile device or webcam.
              </p>
              <Button className="w-full gap-2">
                <Zap className="h-4 w-4" />
                Start Identity Verification
              </Button>
            </div>
          </div>

          {/* Security & Privacy */}
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Security &amp; Privacy</h3>
              <p className="text-xs text-muted-foreground">Verify ownership and complete KYC for better security.</p>
            </div>
            <div className="space-y-4 rounded-2xl border border-border bg-popover p-6">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Regular Compliance</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Your personal data is encrypted and handled by our certified KYC partner to ensure strict regulatory compliance (AML/CFT).
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-4 w-4" />
                  ISO 27001
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4" />
                  GDPR
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-4 w-4" />
                  SOC2
                </div>
              </div>
            </div>
          </div>
        </div>

        {validationError && (
          <div className="px-6">
            <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <ArrowRight className="h-4 w-4 flex-shrink-0" />
              {validationError}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t-2 border-background p-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/entrepreneur/phase-2/step-2')}
            className="border-border px-6 py-3 font-medium text-foreground hover:bg-muted"
          >
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraftClick}
              disabled={isSaving}
              className="border-primary px-6 py-3 font-medium text-primary hover:bg-primary/5"
            >
              {isSaving ? 'Saving…' : 'Save Draft'}
            </Button>
            <Button
              type="button"
              onClick={handleNextClick}
              disabled={isValidating}
              className="gap-2 px-6 py-3"
            >
              {isValidating ? 'Validating…' : 'Next'}
              {!isValidating && <ArrowRight className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="flex gap-4 rounded-2xl border border-border bg-secondary p-6">
        <Lightbulb className="h-6 w-6 flex-shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">Why need this information</p>
          <p className="text-sm text-muted-foreground">
            Beneficial ownership and identity verification are mandatory under international anti-money laundering (AML) and counter-terrorist financing (CTF) standards.
          </p>
        </div>
      </div>

      {/* Next Step Preview (locked) */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-6 opacity-60">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-semibold text-muted-foreground">
            4
          </div>
          <div>
            <p className="font-semibold text-foreground">Compliance Review &amp; Certification</p>
            <p className="text-sm text-muted-foreground">Final automated verification and certificate generation</p>
          </div>
        </div>
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}

export default function Phase2Step3Page() {
  return (
    <RouteGuard requiredPhase={2} requiredStep={3}>
      <Phase2Step3PageContent />
    </RouteGuard>
  );
}

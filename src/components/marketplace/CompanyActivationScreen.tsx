'use client';

import React, { useState, useEffect, useCallback } from 'react';
import marketplaceProjectsApi, {
  PartnershipActivation,
  UpdateCorporateFilingRequest
} from '@/lib/api-marketplace-projects';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileText,
  FileCheck,
  Users,
  Award,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Landmark,
  Layers,
  ArrowRight
} from 'lucide-react';

interface CompanyActivationScreenProps {
  dealId: string;
  currentUserId?: string;
  isCreator?: boolean;
  onActivationComplete?: (activation: PartnershipActivation) => void;
  onClose?: () => void;
}

export const CompanyActivationScreen: React.FC<CompanyActivationScreenProps> = ({
  dealId,
  currentUserId,
  isCreator = true,
  onActivationComplete,
  onClose,
}) => {
  const [activation, setActivation] = useState<PartnershipActivation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  const [companyNameInput, setCompanyNameInput] = useState<string>('');
  const [filingStatusInput, setFilingStatusInput] = useState<string>('FILING_COMPLETE');
  const [filingNotesInput, setFilingNotesInput] = useState<string>('');
  const [showFilingUpdateModal, setShowFilingUpdateModal] = useState<boolean>(false);

  const fetchActivation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketplaceProjectsApi.getDealActivation(dealId);
      setActivation(data);
      if (data.companyName && !companyNameInput) {
        setCompanyNameInput(data.companyName);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load activation details.');
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchActivation();
  }, [fetchActivation]);

  const handleStartActivation = async () => {
    try {
      setActionInProgress(true);
      setError(null);
      const updated = await marketplaceProjectsApi.startDealActivation(dealId, {
        companyName: companyNameInput.trim() || undefined
      });
      setActivation(updated);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to initialize company setup.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleCompleteActivation = async () => {
    try {
      setActionInProgress(true);
      setError(null);
      const updated = await marketplaceProjectsApi.completeDealActivation(dealId);
      setActivation(updated);
      if (onActivationComplete) {
        onActivationComplete(updated);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to activate partnership.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUpdateFilingStatus = async () => {
    try {
      setActionInProgress(true);
      setError(null);
      const updated = await marketplaceProjectsApi.updateCorporateFilingStatus(dealId, {
        filingStatus: filingStatusInput,
        notes: filingNotesInput.trim() || undefined
      });
      setActivation(updated);
      setShowFilingUpdateModal(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update filing status.');
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading && !activation) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Loading company activation state...
        </p>
      </div>
    );
  }

  if (error && !activation) {
    return (
      <div className="p-8 max-w-3xl mx-auto my-8 bg-destructive/10 border border-destructive/30 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Unable to Load Activation</h3>
        <p className="text-sm text-destructive max-w-lg mx-auto">{error}</p>
        <button
          onClick={fetchActivation}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!activation) return null;

  const isActivated = activation.status === 'PARTNERSHIP_ACTIVE';
  const isCaseA = activation.companyCase === 'CASE_A_PRE_INCORPORATION';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 text-foreground">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-card border border-border rounded-3xl p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Phase 8 — Final Activation Gate
            </div>
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
              Company &amp; Project Activation
            </h1>
            <p className="text-muted-foreground text-sm max-w-2xl">
              Apply signed electronic contracts, formally record co-founder cap table equity, link corporate legal instruments, and activate the venture workspace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={fetchActivation}
              className="p-2.5 text-muted-foreground hover:text-foreground bg-background hover:bg-muted rounded-xl border border-border transition"
              title="Refresh activation state"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {isActivated ? (
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-success-light border border-success-strong/30 text-success-strong font-bold text-sm shadow-xs">
                <CheckCircle2 className="w-5 h-5 text-success-strong" />
                PROJECT CO-FOUNDED
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-warning/10 border border-warning/30 text-warning font-semibold text-sm">
                <Clock className="w-4 h-4 text-warning" />
                {activation.status === 'READY_TO_ACTIVATE' ? 'Ready to Activate' : 'Activation Setup Pending'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Celebration Banner */}
      {isActivated && (
        <div className="bg-success-light border border-success-strong/30 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-success-light border border-success-strong/40 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Award className="w-8 h-8 text-success-strong" />
          </div>
          <h2 className="text-2xl font-black text-success-strong tracking-tight">
            Partnership Successfully Activated!
          </h2>
          <p className="text-foreground text-sm max-w-xl mx-auto leading-relaxed">
            The project has transitioned to <span className="font-bold uppercase">CO-FOUNDED</span> status. Real shareholder records, legal agreements, and corporate governance are now officially active.
          </p>
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card border border-border text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-success-strong" />
              Marketplace listing closed to other buyers
            </div>
          </div>
        </div>
      )}

      {/* Case Context & Company Workspace Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Company Setup &amp; Governance</h3>
                <p className="text-xs text-muted-foreground">
                  {isCaseA ? 'Case A: Pre-incorporation Platform Workspace' : 'Case B: Existing Operating Entity Linked'}
                </p>
              </div>
            </div>

            <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-primary/10 border-primary/20 text-primary">
              {isCaseA ? 'Case A: Formation' : 'Case B: Existing Entity'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-background border border-border rounded-2xl space-y-1.5">
              <span className="text-xs text-muted-foreground font-medium">Company Entity Name</span>
              <p className="text-sm font-bold text-foreground">
                {activation.companyName || 'Not yet established'}
              </p>
            </div>

            <div className="p-4 bg-background border border-border rounded-2xl space-y-1.5">
              <span className="text-xs text-muted-foreground font-medium">Corporate Filing Status</span>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-success-strong">
                  {activation.corporateFilingStatus}
                </p>
                {!isActivated && (
                  <button
                    onClick={() => setShowFilingUpdateModal(true)}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Update
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 bg-background border border-border rounded-2xl space-y-1.5">
              <span className="text-xs text-muted-foreground font-medium">Creator Shareholder</span>
              <p className="text-sm font-semibold text-foreground">
                {activation.creatorName} ({activation.commercialTerms.creatorRole || 'Co-founder'})
              </p>
            </div>

            <div className="p-4 bg-background border border-border rounded-2xl space-y-1.5">
              <span className="text-xs text-muted-foreground font-medium">Entrepreneur Principal</span>
              <p className="text-sm font-semibold text-foreground">
                {activation.entrepreneurName} (Founder &amp; CEO)
              </p>
            </div>
          </div>

          {/* Case A Company Name input if pending */}
          {isCaseA && activation.status === 'ACTIVATION_PENDING' && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-3">
              <label className="block text-xs font-semibold text-primary uppercase tracking-wider">
                Establish Company Name for Workspace
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  placeholder="e.g., Autonomous AI Supply Chain Inc."
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleStartActivation}
                  disabled={actionInProgress}
                  className="px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs font-bold rounded-xl transition"
                >
                  {actionInProgress ? 'Setting up...' : 'Record Company'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Invariant Verification Checklist */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <ShieldCheck className="w-5 h-5 text-success-strong" />
            <h3 className="text-base font-bold text-foreground">Activation Invariants</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success-strong shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Commercial Terms Accepted</p>
                <p className="text-muted-foreground text-[11px]">Revision #{activation.appliedOfferRevisionNumber} terms locked</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success-strong shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Roles Bilaterally Confirmed</p>
                <p className="text-muted-foreground text-[11px]">Agreement V{activation.appliedRoleAgreementVersion}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success-strong shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Cap Table Approved</p>
                <p className="text-muted-foreground text-[11px]">100% Deal Cap Table V{activation.appliedCapTableVersion}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success-strong shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Human Legal Review Complete</p>
                <p className="text-muted-foreground text-[11px]">Legal Package V{activation.appliedLegalPackageVersion}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success-strong shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Dual-Party Agreement Signed</p>
                <p className="text-muted-foreground text-[11px] font-mono truncate max-w-[200px]">
                  {activation.signedManifestHash || 'Manifest executed'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              {activation.companyId ? (
                <CheckCircle2 className="w-4 h-4 text-success-strong shrink-0 mt-0.5" />
              ) : (
                <Clock className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-semibold text-foreground">Company &amp; Shareholder Record</p>
                <p className="text-muted-foreground text-[11px]">
                  {activation.companyId ? 'Workspace linked' : 'Pending initialization'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Before / After Ownership Comparison Table */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Before &amp; After Ownership Comparison</h3>
              <p className="text-xs text-muted-foreground">
                Official canonical cap table transition applied upon activation.
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Total Shares: <span className="font-bold text-foreground">{activation.ownershipComparison.totalShares.toLocaleString()}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="py-3 px-4">Stakeholder</th>
                <th className="py-3 px-4">Role Title</th>
                <th className="py-3 px-4">Pre-Deal Equity</th>
                <th className="py-3 px-4">Post-Deal Signed Equity</th>
                <th className="py-3 px-4">Signed Shares</th>
                <th className="py-3 px-4">Vesting / Cliff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activation.ownershipComparison.entries.map((entry, idx) => (
                <tr key={idx} className="hover:bg-muted/30 transition">
                  <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                    {entry.displayName}
                    {entry.isCreator && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-success-light text-success-strong border border-success-strong/30">
                        Creator
                      </span>
                    )}
                    {entry.isFounder && (
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-primary/10 text-primary border border-primary/20">
                        Founder
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground text-xs">{entry.roleTitle}</td>
                  <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">
                    {entry.previousEquityPercent}% ({entry.previousShares.toLocaleString()} sh.)
                  </td>
                  <td className="py-3.5 px-4 font-bold text-success-strong font-mono text-sm">
                    {entry.signedEquityPercent}%
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-foreground">
                    {entry.signedShares.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">
                    {entry.vestingMonths > 0 ? (
                      <span className="text-foreground">
                        {entry.vestingMonths} mo. ({entry.cliffMonths} mo. cliff)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </td>
                </tr>
              ))}

              {activation.ownershipComparison.esopPoolPercent > 0 && (
                <tr className="hover:bg-muted/30 transition bg-muted/20">
                  <td className="py-3.5 px-4 font-medium text-foreground">ESOP Option Pool</td>
                  <td className="py-3.5 px-4 text-muted-foreground text-xs">Employee Incentive Pool</td>
                  <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">0%</td>
                  <td className="py-3.5 px-4 font-semibold text-foreground font-mono text-sm">
                    {activation.ownershipComparison.esopPoolPercent}%
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-foreground">
                    {Math.round(activation.ownershipComparison.totalShares * (activation.ownershipComparison.esopPoolPercent / 100)).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">Standard 48 mo.</td>
                </tr>
              )}

              {activation.ownershipComparison.investorReservePercent > 0 && (
                <tr className="hover:bg-muted/30 transition bg-muted/20">
                  <td className="py-3.5 px-4 font-medium text-foreground">Investor Reserve Pool</td>
                  <td className="py-3.5 px-4 text-muted-foreground text-xs">Future Financing Reserve</td>
                  <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">0%</td>
                  <td className="py-3.5 px-4 font-semibold text-foreground font-mono text-sm">
                    {activation.ownershipComparison.investorReservePercent}%
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-foreground">
                    {Math.round(activation.ownershipComparison.totalShares * (activation.ownershipComparison.investorReservePercent / 100)).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-muted-foreground">N/A</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 bg-background border border-border rounded-xl text-xs text-muted-foreground flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <span>
            {activation.ownershipComparison.notice} — Records reflect agreed platform equity ownership. External statutory registration and tax declarations are managed in accordance with applicable local company law.
          </span>
        </div>
      </div>

      {/* Linked Legal Instruments Card */}
      <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <FileCheck className="w-5 h-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">Linked Corporate Documents</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {activation.linkedDocuments.length > 0 ? (
            activation.linkedDocuments.map((doc, idx) => (
              <div key={idx} className="p-4 bg-background border border-border rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-foreground">{doc.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground font-mono truncate">
                  SHA-256: {doc.documentHash}
                </p>
                <div className="text-[10px] text-success-strong font-medium">
                  ✓ Linked to company workspace
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground col-span-3">
              Documents will be linked upon initializing company setup.
            </p>
          )}
        </div>
      </div>

      {/* Blockers or Error banner if any */}
      {activation.blockers.length > 0 && !isActivated && (
        <div className="p-5 bg-warning/10 border border-warning/30 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-warning text-sm font-bold">
            <AlertCircle className="w-4 h-4" />
            Activation Blockers Remaining:
          </div>
          <ul className="list-disc list-inside text-xs text-warning space-y-1">
            {activation.blockers.map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          {isActivated ? (
            <span className="text-success-strong font-medium">
              ✓ Partnership is active. Venture workspace is available.
            </span>
          ) : activation.canActivate ? (
            <span className="text-foreground">
              All preconditions satisfied. Ready to activate partnership.
            </span>
          ) : (
            <span className="text-muted-foreground">
              Complete setup steps to enable partnership activation.
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onClose && (
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-background hover:bg-muted text-foreground border border-border text-sm font-semibold transition"
            >
              Close
            </button>
          )}

          {activation.status === 'ACTIVATION_PENDING' && (
            <button
              onClick={handleStartActivation}
              disabled={actionInProgress}
              className="flex-1 sm:flex-initial px-6 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-bold text-sm transition shadow-sm"
            >
              {actionInProgress ? 'Initializing...' : 'Initialize Company Setup'}
            </button>
          )}

          {!isActivated && (
            <button
              onClick={handleCompleteActivation}
              disabled={!activation.canActivate || actionInProgress}
              className={`flex-1 sm:flex-initial px-8 py-3.5 rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm ${
                activation.canActivate && !actionInProgress
                  ? 'bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer'
                  : 'bg-muted text-muted-foreground border border-border cursor-not-allowed'
              }`}
            >
              {actionInProgress ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Activating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Activate Partnership
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Corporate Filing Modal */}
      {showFilingUpdateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-foreground">
            <h4 className="text-lg font-bold text-foreground">Update Corporate Filing Status</h4>
            <p className="text-xs text-muted-foreground">
              Record external statutory registration status or verified filing certificate.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Status</label>
                <select
                  value={filingStatusInput}
                  onChange={(e) => setFilingStatusInput(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="NOT_REQUIRED">NOT_REQUIRED (Internal Workspace Only)</option>
                  <option value="EXTERNAL_FILING_PENDING">EXTERNAL_FILING_PENDING (Blocker until verified)</option>
                  <option value="FILING_COMPLETE">FILING_COMPLETE (Statutory Filing Verified)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes / Filing Reference</label>
                <textarea
                  value={filingNotesInput}
                  onChange={(e) => setFilingNotesInput(e.target.value)}
                  placeholder="Optional reference notes..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button
                onClick={() => setShowFilingUpdateModal(false)}
                className="px-4 py-2 bg-background hover:bg-muted text-foreground text-xs font-semibold rounded-xl border border-border"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateFilingStatus}
                disabled={actionInProgress}
                className="px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyActivationScreen;


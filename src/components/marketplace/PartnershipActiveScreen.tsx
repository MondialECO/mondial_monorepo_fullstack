'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import marketplaceProjectsApi, {
  PartnershipActiveDetails,
  PartnershipMilestone,
  CreatePartnershipMilestoneRequest
} from '@/lib/api-marketplace-projects';
import {
  Sparkles,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  MessageSquare,
  ExternalLink,
  ShieldCheck,
  FileText,
  FileCheck,
  Award,
  AlertCircle,
  Plus,
  Calendar,
  Layers,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';

interface PartnershipActiveScreenProps {
  dealId: string;
  currentUserId?: string;
  isCreator?: boolean;
  onClose?: () => void;
}

export const PartnershipActiveScreen: React.FC<PartnershipActiveScreenProps> = ({
  dealId,
  currentUserId,
  isCreator = true,
  onClose,
}) => {
  const [details, setDetails] = useState<PartnershipActiveDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState<boolean>(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState<string>('');
  const [newMilestoneDesc, setNewMilestoneDesc] = useState<string>('');
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState<string>('');
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);

  const fetchDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await marketplaceProjectsApi.getPartnershipActiveDetails(dealId);
      setDetails(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load active partnership details.');
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleCreateMilestone = async () => {
    if (!newMilestoneTitle.trim()) return;
    try {
      setActionInProgress(true);
      const req: CreatePartnershipMilestoneRequest = {
        title: newMilestoneTitle.trim(),
        description: newMilestoneDesc.trim() || undefined,
        dueDate: newMilestoneDueDate ? new Date(newMilestoneDueDate).toISOString() : undefined
      };
      await marketplaceProjectsApi.createPartnershipMilestone(dealId, req);
      setNewMilestoneTitle('');
      setNewMilestoneDesc('');
      setNewMilestoneDueDate('');
      setShowAddMilestoneModal(false);
      await fetchDetails();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create milestone.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId: string, status: string) => {
    try {
      setActionInProgress(true);
      await marketplaceProjectsApi.updatePartnershipMilestone(dealId, milestoneId, { status });
      await fetchDetails();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update milestone.');
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading && !details) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Loading active partnership workspace...
        </p>
      </div>
    );
  }

  if (error && !details) {
    return (
      <div className="p-8 max-w-3xl mx-auto my-8 bg-destructive/10 border border-destructive/30 rounded-2xl text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
        <h3 className="text-xl font-bold text-foreground">Unable to Load Partnership</h3>
        <p className="text-sm text-destructive max-w-lg mx-auto">{error}</p>
        <button
          onClick={fetchDetails}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!details) return null;

  const partner = isCreator ? details.entrepreneur : details.creator;
  const userSummary = isCreator ? details.creator : details.entrepreneur;
  const userRole = isCreator ? details.creatorRoleDetails : details.entrepreneurRoleDetails;
  const partnerRole = isCreator ? details.entrepreneurRoleDetails : details.creatorRoleDetails;

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-8 pb-16 text-foreground">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-card border border-border rounded-3xl p-8 shadow-sm">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Phase 9 — Active Co-founder Venture
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
                <span>🎉 Partnership Active</span>
              </h1>
              <p className="text-muted-foreground text-sm max-w-2xl">
                The transaction closing journey is complete. Your bilateral partnership is active and company governance is in place.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchDetails}
                className="p-2.5 text-muted-foreground hover:text-foreground bg-background hover:bg-muted rounded-xl border border-border transition"
                title="Refresh state"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-success-light border border-success-strong/30 text-success-strong font-bold text-sm shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-success-strong" />
                CO-FOUNDED
              </div>
            </div>
          </div>

          {/* Deal Lifecycle Stage Completion Bar */}
          <div className="bg-muted/40 border border-border rounded-2xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1 text-success-strong">Offer <CheckCircle2 className="w-3.5 h-3.5" /></span>
              <span className="text-muted-foreground/50">→</span>
              <span className="flex items-center gap-1 text-success-strong">Roles <CheckCircle2 className="w-3.5 h-3.5" /></span>
              <span className="text-muted-foreground/50">→</span>
              <span className="flex items-center gap-1 text-success-strong">Equity <CheckCircle2 className="w-3.5 h-3.5" /></span>
              <span className="text-muted-foreground/50">→</span>
              <span className="flex items-center gap-1 text-success-strong">Legal <CheckCircle2 className="w-3.5 h-3.5" /></span>
              <span className="text-muted-foreground/50">→</span>
              <span className="flex items-center gap-1 text-success-strong">Sign <CheckCircle2 className="w-3.5 h-3.5" /></span>
              <span className="text-muted-foreground/50">→</span>
              <span className="flex items-center gap-1 text-success-strong">Activate <CheckCircle2 className="w-3.5 h-3.5" /></span>
              <span className="text-muted-foreground/50">→</span>
              <span className="flex items-center gap-1 text-success-strong font-bold bg-success-light px-2.5 py-1 rounded-lg border border-success-strong/30">
                Active <Sparkles className="w-3 h-3 text-success-strong" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overview 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Equity Card */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-2 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Your Equity</span>
            <TrendingUp className="w-4 h-4 text-success-strong" />
          </div>
          <p className="text-3xl font-black text-success-strong font-mono tracking-tight">
            {details.equity.currentOwnershipPercent}%
          </p>
          <p className="text-xs text-muted-foreground">
            {details.equity.sharesOwned.toLocaleString()} {details.equity.shareClass}
          </p>
        </div>

        {/* Your Role Card */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Your Role</span>
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground truncate">
            {userRole.roleTitle}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {userRole.timeCommitment}
          </p>
        </div>

        {/* Partner Card */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Partner</span>
            <Users className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground truncate">
            {partner.displayName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {partner.roleTitle} ({partner.equityPercent}%)
          </p>
        </div>

        {/* Company Card */}
        <div className="p-5 bg-card border border-border rounded-2xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Company</span>
            <Building2 className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground truncate">
            {details.company.companyName}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {details.company.legalStructure} • {details.company.jurisdiction}
          </p>
        </div>
      </div>

      {/* Cap Table Integrity Mismatch Alert if needed */}
      {details.capTableIntegrityStatus === 'OWNERSHIP_RECONCILIATION_REQUIRED' && (
        <div className="p-5 bg-warning/10 border border-warning/30 rounded-2xl space-y-2 text-warning text-xs">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-warning" />
            Cap Table Reconciliation Notice
          </div>
          <p>
            An ownership mismatch was detected between the platform deal activation record and current entity cap table. Displaying authenticated activated deal terms while governance sync executes.
          </p>
        </div>
      )}

      {/* Section 1: My Equity & Vesting Details */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">My Equity</h2>
              <p className="text-xs text-muted-foreground">
                Official equity holding recorded in {details.company.companyName}.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-success-light text-success-strong border border-success-strong/30">
            {details.equity.shareholderStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-background border border-border rounded-2xl space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Ownership Percentage</span>
            <p className="text-2xl font-extrabold text-success-strong font-mono">
              {details.equity.currentOwnershipPercent}%
            </p>
          </div>

          <div className="p-4 bg-background border border-border rounded-2xl space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Shares Granted</span>
            <p className="text-2xl font-extrabold text-foreground font-mono">
              {details.equity.sharesOwned.toLocaleString()}
            </p>
            <span className="text-[11px] text-muted-foreground">of {details.equity.totalShares.toLocaleString()} total shares</span>
          </div>

          <div className="p-4 bg-background border border-border rounded-2xl space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Share Class &amp; Voting</span>
            <p className="text-sm font-bold text-foreground">
              {details.equity.shareClass}
            </p>
            <span className="text-[11px] text-muted-foreground">{details.equity.votingRights}</span>
          </div>
        </div>

        {/* Vesting Schedule */}
        <div className="p-5 bg-background border border-border rounded-2xl space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground uppercase tracking-wider">Vesting Schedule</span>
            <span className="text-muted-foreground">
              {details.equity.vestingEnabled
                ? `${details.equity.vestingMonths} mo. total • ${details.equity.cliffMonths} mo. cliff`
                : 'No vesting restriction'}
            </span>
          </div>

          {details.equity.vestingEnabled ? (
            <div className="space-y-2">
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${details.equity.currentOwnershipPercent > 0 ? (details.equity.vestedPercent / details.equity.currentOwnershipPercent) * 100 : 0}%`
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground font-mono pt-1">
                <span>
                  Vested: <strong className="text-success-strong">{details.equity.vestedPercent}%</strong> ({details.equity.vestedShares.toLocaleString()} sh.)
                </span>
                <span>
                  Unvested: <strong className="text-foreground">{details.equity.unvestedPercent}%</strong> ({details.equity.unvestedShares.toLocaleString()} sh.)
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground italic pt-1">
                {details.equity.vestingStatusNotice}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Shares are fully vested and held without restrictions.
            </p>
          )}
        </div>
      </div>

      {/* Section 2 & 3: Roles & Responsibilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Your Role & Responsibilities */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Your Role: {userRole.roleTitle}</h3>
              <p className="text-xs text-muted-foreground">{userRole.timeCommitment}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
              Confirmed Responsibilities:
            </span>
            <ul className="space-y-2">
              {userRole.responsibilities.map((resp: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Partner Role & Responsibilities */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 border-b border-border pb-3">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Partner: {partner.displayName}</h3>
              <p className="text-xs text-muted-foreground">{partnerRole.roleTitle} • {partnerRole.timeCommitment}</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">
              Confirmed Responsibilities:
            </span>
            <ul className="space-y-2">
              {partnerRole.responsibilities.map((resp: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2 text-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Section 4: Shared Venture Milestones */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Venture Milestones</h3>
              <p className="text-xs text-muted-foreground">
                Shared goals and deliverables for the co-founded project.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddMilestoneModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Milestone
          </button>
        </div>

        <div className="space-y-3">
          {details.milestones.length > 0 ? (
            details.milestones.map((ms) => (
              <div
                key={ms.id}
                className="p-4 bg-background border border-border rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-foreground">{ms.title}</h4>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      ms.status === 'COMPLETED'
                        ? 'bg-success-light text-success-strong border-success-strong/30'
                        : ms.status === 'IN_PROGRESS'
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {ms.status.replace('_', ' ')}
                    </span>
                  </div>
                  {ms.description && (
                    <p className="text-xs text-muted-foreground max-w-xl">{ms.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-1">
                    <span>Created by {ms.createdByName}</span>
                    {ms.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Due: {new Date(ms.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {ms.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleUpdateMilestoneStatus(ms.id, 'COMPLETED')}
                      disabled={actionInProgress}
                      className="px-3 py-1.5 rounded-xl bg-success-light hover:bg-success-light/80 border border-success-strong/40 text-success-strong text-xs font-semibold transition"
                    >
                      Mark Complete
                    </button>
                  )}
                  {ms.status === 'NOT_STARTED' && (
                    <button
                      onClick={() => handleUpdateMilestoneStatus(ms.id, 'IN_PROGRESS')}
                      disabled={actionInProgress}
                      className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-semibold transition"
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No milestones created yet. Add a shared deliverable to coordinate work.
            </p>
          )}
        </div>
      </div>

      {/* Section 5: Signed Documents Area */}
      <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-3 border-b border-border pb-3">
          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Signed Legal Instruments</h3>
            <p className="text-xs text-muted-foreground">
              Cryptographically verified documents linked to this company workspace.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {details.documents.map((doc, idx) => (
            <div key={idx} className="p-4 bg-background border border-border rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">{doc.title}</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono truncate">
                SHA-256: {doc.documentHash}
              </p>
              <div className="text-[10px] text-success-strong font-medium">
                ✓ Signed &amp; Linked
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTAs / Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground">
          <span className="text-success-strong font-medium">
            ✓ Venture is active. All agreements executed and legally binding.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {onClose && (
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-background hover:bg-muted text-foreground border border-border text-sm font-semibold transition"
            >
              Close
            </button>
          )}

          <Link
            href="/dashboard/chat"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-background hover:bg-muted border border-border text-foreground font-bold text-sm transition"
          >
            <MessageSquare className="w-4 h-4 text-primary" />
            Message Co-founder
          </Link>

          <Link
            href={details.workspaceUrl}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition shadow-sm"
          >
            <span>Open Project Workspace</span>
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Add Milestone Modal */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-foreground">
            <h4 className="text-lg font-bold text-foreground">Create Venture Milestone</h4>
            <p className="text-xs text-muted-foreground">
              Set a shared deliverable or checkpoint for your venture.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Title</label>
                <input
                  type="text"
                  value={newMilestoneTitle}
                  onChange={(e) => setNewMilestoneTitle(e.target.value)}
                  placeholder="e.g., MVP Alpha Launch"
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Description</label>
                <textarea
                  value={newMilestoneDesc}
                  onChange={(e) => setNewMilestoneDesc(e.target.value)}
                  placeholder="Details and success criteria..."
                  rows={3}
                  className="w-full bg-background border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Target Due Date</label>
                <input
                  type="date"
                  value={newMilestoneDueDate}
                  onChange={(e) => setNewMilestoneDueDate(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <button
                onClick={() => setShowAddMilestoneModal(false)}
                className="px-4 py-2 bg-background hover:bg-muted text-foreground text-xs font-semibold rounded-xl border border-border"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMilestone}
                disabled={actionInProgress || !newMilestoneTitle.trim()}
                className="px-5 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground text-xs font-bold rounded-xl"
              >
                {actionInProgress ? 'Creating...' : 'Create Milestone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartnershipActiveScreen;


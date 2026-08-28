import React, { useState } from "react";
import {
  DealCapTableDraft,
  DealCapTableEntry,
  UpdateCapTableDraftRequest,
  RequestCapTableChangesRequest,
} from "@/lib/api-marketplace-projects";
import { DealStageHeader } from "./DealStageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PieChart,
  Lock,
  CheckCircle2,
  AlertTriangle,
  FileEdit,
  RotateCcw,
  Building2,
  Info,
  Users,
  Shield,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Percent,
} from "lucide-react";

interface CapTableDraftScreenProps {
  dealId: string;
  draft: DealCapTableDraft;
  currentUserId?: string;
  isCreator?: boolean;
  onApprove: () => Promise<void>;
  onUpdate: (req: UpdateCapTableDraftRequest) => Promise<void>;
  onRequestChanges: (req: RequestCapTableChangesRequest) => Promise<void>;
  onProceedToLegalReview?: () => void;
  className?: string;
}

export const CapTableDraftScreen: React.FC<CapTableDraftScreenProps> = ({
  dealId,
  draft,
  currentUserId,
  isCreator = false,
  onApprove,
  onUpdate,
  onRequestChanges,
  onProceedToLegalReview,
  className = "",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [changeFeedback, setChangeFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable form state
  const [totalShares, setTotalShares] = useState(draft.totalShares || 10_000_000);
  const [entries, setEntries] = useState<DealCapTableEntry[]>(
    draft.entries.map((e) => ({ ...e }))
  );
  const [esopPoolPercent, setEsopPoolPercent] = useState(draft.esopPoolPercent || 0);
  const [investorReservePercent, setInvestorReservePercent] = useState(
    draft.investorReservePercent || 0
  );
  const [notes, setNotes] = useState(draft.notes || "");

  // Computed state
  const userConfirmedCurrent = isCreator
    ? draft.creatorConfirmedVersion === draft.version
    : draft.entrepreneurConfirmedVersion === draft.version;

  const counterpartyConfirmedCurrent = isCreator
    ? draft.entrepreneurConfirmedVersion === draft.version
    : draft.creatorConfirmedVersion === draft.version;

  const isFullyApproved =
    draft.status === "APPROVED" ||
    (draft.creatorConfirmedVersion === draft.version &&
      draft.entrepreneurConfirmedVersion === draft.version);

  // Calculate current user's equity ownership
  const currentUserEntry = isCreator
    ? draft.entries.find((e) => e.isCreator || e.stakeholderType === "creator")
    : draft.entries.find((e) => e.isFounder || e.stakeholderType === "founder");
  const myOwnershipPct = currentUserEntry ? currentUserEntry.equityPercent : 0;

  // Calculate total in edit mode
  const currentTotalAllocated = entries.reduce((s, e) => s + (Number(e.equityPercent) || 0), 0);
  const isTotal100 = Math.abs(currentTotalAllocated - 100.0) <= 0.01;

  const handleEntryPercentChange = (index: number, newPercent: number) => {
    setEntries((prev) => {
      const copy = [...prev];
      if (copy[index].isLocked) return prev; // Cannot edit locked creator
      copy[index].equityPercent = newPercent;
      copy[index].sharesGranted = Math.round(totalShares * (newPercent / 100.0));
      return copy;
    });
  };

  const handleEntryFieldChange = (index: number, field: keyof DealCapTableEntry, val: any) => {
    setEntries((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleAddCustomEntry = () => {
    setEntries((prev) => [
      ...prev,
      {
        id: `entry_${Date.now()}`,
        displayName: "Advisor / Key Contributor",
        roleTitle: "Strategic Advisor",
        stakeholderType: "advisor",
        shareClass: "common",
        hasVotingRights: true,
        equityPercent: 0,
        sharesGranted: 0,
        vestingMonths: 24,
        cliffMonths: 6,
        isCreator: false,
        isFounder: false,
        isEsop: false,
        isInvestorReserve: false,
        isLocked: false,
      },
    ]);
  };

  const handleRemoveEntry = (index: number) => {
    if (entries[index].isLocked || entries[index].isCreator) return;
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveUpdate = async () => {
    setErrorMsg(null);
    if (!isTotal100) {
      setErrorMsg(`Total ownership allocation must equal 100% (currently ${currentTotalAllocated.toFixed(1)}%).`);
      return;
    }

    // Verify creator equity remains locked
    const creatorRow = entries.find((e) => e.isCreator || e.stakeholderType === "creator");
    if (!creatorRow || Math.abs(creatorRow.equityPercent - draft.commercialTerms.equityPercentage) > 0.001) {
      setErrorMsg(`Creator equity is locked at ${draft.commercialTerms.equityPercentage}% and cannot be modified.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onUpdate({
        totalShares,
        entries,
        esopPoolPercent,
        investorReservePercent,
        notes,
      });
      setIsEditing(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update cap table draft.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onApprove();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to approve cap table draft.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!changeFeedback.trim()) return;
    setErrorMsg(null);
    setIsSubmitting(true);
    try {
      await onRequestChanges({ feedback: changeFeedback });
      setIsRequestingChanges(false);
      setChangeFeedback("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to request changes.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-6 max-w-6xl mx-auto text-foreground ${className}`}>
      {/* Pipeline Stage Header */}
      <DealStageHeader
        currentStage={isFullyApproved ? "LEGAL_REVIEW_PENDING" : "CAP_TABLE_PENDING"}
      />

      {/* Main Header & Overview Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                <PieChart className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                Equity &amp; Ownership Structure
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
                Version {draft.version}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Co-founder equity distribution and cap table architecture for{" "}
              <span className="text-foreground font-medium">{draft.projectName}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* "You Own X%" Badge */}
            <div className="px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-2">
              <Percent className="w-4 h-4 text-primary" />
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                  You Own
                </div>
                <div className="text-base font-bold text-primary">
                  {myOwnershipPct}%
                </div>
              </div>
            </div>

            {/* Approval Status Badge */}
            {isFullyApproved ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-success-light border border-success-strong/30 text-success-strong shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-success-strong" />
                Fully Approved
              </span>
            ) : draft.status === "CHANGES_REQUESTED" ? (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-warning/10 border border-warning/30 text-warning">
                <RotateCcw className="w-4 h-4 text-warning" />
                Changes Requested
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary/10 border border-primary/20 text-primary">
                <Info className="w-4 h-4 text-primary" />
                Awaiting Approval
              </span>
            )}
          </div>
        </div>

        {/* Locked Commercial Terms from Accepted Offer */}
        <div className="mt-5 p-4 rounded-xl bg-background border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5 text-warning" />
              Accepted Commercial Terms (Locked)
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              Accepted Rev #{draft.commercialTerms.acceptedRevisionNumber}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground block text-[11px]">Creator Equity</span>
              <span className="text-base font-bold text-success-strong">
                {draft.commercialTerms.equityPercentage}%
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground block text-[11px]">Creator Vesting</span>
              <span className="text-sm font-semibold text-foreground">
                {draft.commercialTerms.vestingEnabled
                  ? `${draft.commercialTerms.vestingMonths} mo (${draft.commercialTerms.cliffMonths} mo cliff)`
                  : "Immediate"}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground block text-[11px]">Cash Component</span>
              <span className="text-sm font-semibold text-foreground">
                {draft.commercialTerms.cashComponent && draft.commercialTerms.cashComponent > 0
                  ? `$${draft.commercialTerms.cashComponent.toLocaleString()}`
                  : "None"}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border">
              <span className="text-muted-foreground block text-[11px]">Assigned Role</span>
              <span className="text-sm font-semibold text-primary truncate block">
                {draft.commercialTerms.creatorRole || "Co-founder"}
              </span>
            </div>
          </div>
        </div>

        {/* Company Status Context & Dilution Notices */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Company Context */}
          <div className="p-3 rounded-xl bg-background border border-border flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground block mb-0.5">
                {draft.companyContext.hasExistingCompany
                  ? `Existing Company Detected (${draft.companyContext.companyName || "Incorporated Entity"})`
                  : "Company Not Yet Incorporated"}
              </span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {draft.companyContext.hasExistingCompany
                  ? "This deal cap table represents the agreed post-closing ownership structure. The actual company cap table will be reconciled in Phase 6."
                  : "The approved cap table draft will serve as the legal blueprint for company formation upon signing."}
              </p>
            </div>
          </div>

          {/* Dilution Notice */}
          <div className="p-3 rounded-xl bg-background border border-border flex items-start gap-2.5">
            <TrendingUp className="w-4 h-4 text-success-strong shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground block mb-0.5">
                Dilution Notice
              </span>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Future investment or share issuance may dilute your ownership percentage proportionally unless anti-dilution provisions apply.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation Progress & Total Summary Bar */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold text-muted-foreground tracking-wider">
              Total Equity Allocation
            </span>
            {isTotal100 ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-strong">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Fully Allocated
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
                <AlertTriangle className="w-3.5 h-3.5" /> {currentTotalAllocated.toFixed(1)}% ({Math.abs(100 - currentTotalAllocated).toFixed(1)}% {currentTotalAllocated < 100 ? "unallocated" : "over-allocated"})
              </span>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Total Authorized Shares:{" "}
            <span className="font-mono text-foreground font-semibold">
              {totalShares.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Visual Allocation Breakdown Bar */}
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden flex border border-border">
          {(isEditing ? entries : draft.entries).map((entry, idx) => {
            const pct = entry.equityPercent || 0;
            if (pct <= 0) return null;
            const colors = [
              "bg-primary",
              "bg-warning",
              "bg-success-strong",
              "bg-chart-3",
              "bg-chart-1",
            ];
            const color = colors[idx % colors.length];
            return (
              <div
                key={entry.id || idx}
                style={{ width: `${Math.min(pct, 100)}%` }}
                className={`${color} h-full transition-all duration-300 relative group`}
                title={`${entry.displayName}: ${pct}%`}
              />
            );
          })}
        </div>

        <div className="flex flex-wrap gap-4 mt-3 pt-2 text-xs border-t border-border">
          {(isEditing ? entries : draft.entries).map((entry, idx) => {
            const colors = [
              "bg-primary",
              "bg-warning",
              "bg-success-strong",
              "bg-chart-3",
              "bg-chart-1",
            ];
            const dotColor = colors[idx % colors.length];
            return (
              <div key={entry.id || idx} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
                <span className="text-foreground font-medium">{entry.displayName}:</span>
                <span className="text-muted-foreground font-mono font-semibold">{entry.equityPercent}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cap Table Details Table / Cards */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/20">
          <div>
            <h3 className="text-base font-bold text-foreground">Shareholder Allocation Schedule</h3>
            <p className="text-xs text-muted-foreground">
              Approved distribution of shares, voting rights, and vesting parameters
            </p>
          </div>

          {!isEditing && !isFullyApproved && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(true)}
              className="h-8 gap-1.5 text-xs border-border hover:bg-muted text-foreground"
            >
              <FileEdit className="w-3.5 h-3.5 text-primary" />
              Edit Allocation
            </Button>
          )}
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground uppercase tracking-wider text-[11px] border-b border-border">
              <tr>
                <th className="py-3 px-4">Stakeholder / Role</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Share Class</th>
                <th className="py-3 px-3">Voting</th>
                <th className="py-3 px-3 text-right">Ownership %</th>
                <th className="py-3 px-3 text-right">Shares Granted</th>
                <th className="py-3 px-4">Vesting Schedule</th>
                {isEditing && <th className="py-3 px-3 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(isEditing ? entries : draft.entries).map((entry, idx) => {
                const isLocked = entry.isLocked || entry.isCreator;
                return (
                  <tr
                    key={entry.id || idx}
                    className={`hover:bg-muted/30 transition-colors ${
                      isLocked ? "bg-warning/5" : ""
                    }`}
                  >
                    {/* Stakeholder Name & Role */}
                    <td className="py-3.5 px-4">
                      {isEditing && !isLocked ? (
                        <div className="space-y-1">
                          <Input
                            value={entry.displayName}
                            onChange={(e) =>
                              handleEntryFieldChange(idx, "displayName", e.target.value)
                            }
                            className="h-7 text-xs bg-background border-border text-foreground focus:ring-1 focus:ring-primary"
                            placeholder="Name / Pool"
                          />
                          <Input
                            value={entry.roleTitle}
                            onChange={(e) =>
                              handleEntryFieldChange(idx, "roleTitle", e.target.value)
                            }
                            className="h-6 text-[11px] bg-background border-border text-muted-foreground focus:ring-1 focus:ring-primary"
                            placeholder="Role / Title"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-foreground">
                            {entry.displayName}
                            {isLocked && (
                              <span
                                title="Locked from accepted commercial offer"
                                className="p-0.5 rounded bg-warning/10 text-warning"
                              >
                                <Lock className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground">{entry.roleTitle}</span>
                        </div>
                      )}
                    </td>

                    {/* Stakeholder Type */}
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground capitalize">
                        {entry.stakeholderType.replace("_", " ")}
                      </span>
                    </td>

                    {/* Share Class */}
                    <td className="py-3.5 px-3">
                      {isEditing && !isLocked ? (
                        <select
                          value={entry.shareClass}
                          onChange={(e) =>
                            handleEntryFieldChange(idx, "shareClass", e.target.value)
                          }
                          className="h-7 px-2 text-xs bg-background border border-border rounded text-foreground focus:ring-1 focus:ring-primary"
                        >
                          <option value="common">Common</option>
                          <option value="preferred">Preferred</option>
                          <option value="safe">SAFE</option>
                          <option value="note">Convertible Note</option>
                        </select>
                      ) : (
                        <span className="capitalize font-mono text-foreground">
                          {entry.shareClass}
                        </span>
                      )}
                    </td>

                    {/* Voting Rights */}
                    <td className="py-3.5 px-3">
                      {isEditing && !isLocked ? (
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={entry.hasVotingRights}
                            onChange={(e) =>
                              handleEntryFieldChange(idx, "hasVotingRights", e.target.checked)
                            }
                            className="rounded border-border bg-background text-primary"
                          />
                          <span className="text-foreground text-[11px]">
                            {entry.hasVotingRights ? "Yes" : "No"}
                          </span>
                        </label>
                      ) : (
                        <span
                          className={`font-semibold ${
                            entry.hasVotingRights ? "text-success-strong" : "text-muted-foreground"
                          }`}
                        >
                          {entry.hasVotingRights ? "Voting" : "Non-voting"}
                        </span>
                      )}
                    </td>

                    {/* Ownership % */}
                    <td className="py-3.5 px-3 text-right">
                      {isEditing && !isLocked ? (
                        <div className="flex items-center justify-end gap-1">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            value={entry.equityPercent}
                            onChange={(e) =>
                              handleEntryPercentChange(idx, parseFloat(e.target.value) || 0)
                            }
                            className="h-7 w-20 text-xs text-right font-mono font-bold bg-background border-border text-primary focus:ring-1 focus:ring-primary"
                          />
                          <span className="text-muted-foreground font-bold">%</span>
                        </div>
                      ) : (
                        <span
                          className={`font-mono text-sm font-bold ${
                            isLocked ? "text-success-strong" : "text-primary"
                          }`}
                        >
                          {entry.equityPercent}%
                        </span>
                      )}
                    </td>

                    {/* Shares Granted */}
                    <td className="py-3.5 px-3 text-right font-mono text-foreground">
                      {entry.sharesGranted.toLocaleString()}
                    </td>

                    {/* Vesting Schedule */}
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {entry.vestingMonths > 0 ? (
                        <span>
                          {entry.vestingMonths} mo ({entry.cliffMonths} mo cliff)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">None / Immediate</span>
                      )}
                    </td>

                    {/* Actions (in Edit Mode) */}
                    {isEditing && (
                      <td className="py-3.5 px-3 text-center">
                        {!isLocked && !entry.isFounder && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveEntry(idx)}
                            className="h-6 px-2 text-[11px] text-destructive hover:bg-destructive/10"
                          >
                            Remove
                          </Button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Edit Mode Add Row & Save Actions */}
        {isEditing && (
          <div className="p-4 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddCustomEntry}
              className="h-8 gap-1.5 text-xs border-dashed border-border hover:bg-muted text-foreground"
            >
              + Add Contributor / Reserve
            </Button>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEntries(draft.entries.map((e) => ({ ...e })));
                  setIsEditing(false);
                }}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!isTotal100 || isSubmitting}
                onClick={handleSaveUpdate}
                className="h-8 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save &amp; Propose V{draft.version + 1}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Confirmation & Status Actions Card */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">Bilateral Cap Table Approval</h4>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                Creator:{" "}
                {draft.creatorConfirmedVersion === draft.version ? (
                  <span className="text-success-strong font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Approved V{draft.version}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Pending</span>
                )}
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1.5">
                Entrepreneur:{" "}
                {draft.entrepreneurConfirmedVersion === draft.version ? (
                  <span className="text-success-strong font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Approved V{draft.version}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Pending</span>
                )}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {isFullyApproved ? (
              <Button
                size="sm"
                onClick={onProceedToLegalReview}
                className="w-full sm:w-auto h-9 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
              >
                Continue to Legal Review
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => setIsRequestingChanges(true)}
                  className="h-9 text-xs border-border hover:bg-muted text-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Request Changes
                </Button>

                <Button
                  size="sm"
                  disabled={userConfirmedCurrent || !draft.isFullyAllocated || isSubmitting}
                  onClick={handleApprove}
                  className={`h-9 text-xs font-semibold gap-1.5 ${
                    userConfirmedCurrent
                      ? "bg-muted text-muted-foreground border border-border"
                      : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {userConfirmedCurrent
                    ? `Version ${draft.version} Approved by You`
                    : `Approve Ownership Structure (V${draft.version})`}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Request Changes Modal Form */}
      {isRequestingChanges && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-foreground">
            <div className="flex items-center gap-2 text-warning">
              <RotateCcw className="w-5 h-5" />
              <h3 className="text-base font-bold text-foreground">Request Cap Table Changes</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Provide feedback for updating the proposed ownership allocations. Note: Creator equity terms are locked and cannot be modified without commercial renegotiation.
            </p>

            <textarea
              rows={3}
              value={changeFeedback}
              onChange={(e) => setChangeFeedback(e.target.value)}
              placeholder="E.g., Increase employee pool from 5% to 8%..."
              className="w-full rounded-xl bg-background border border-border p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsRequestingChanges(false)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!changeFeedback.trim() || isSubmitting}
                onClick={handleRequestChanges}
                className="h-8 text-xs font-semibold bg-destructive hover:bg-destructive/90 text-primary-foreground"
              >
                Submit Feedback
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


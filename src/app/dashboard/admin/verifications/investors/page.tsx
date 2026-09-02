"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  FileCheck2,
  ShieldAlert
} from "lucide-react";
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminTable,
  AdminStatusBadge,
  AdminErrorState,
} from "@/components/admin/shared";

interface InvestorFinanceVerificationItem {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  declaredCapitalAmount?: number;
  declaredCapitalCurrency?: string;
  minTicketSize?: number;
  maxTicketSize?: number;
  preferredStages?: string[];
  preferredSectors?: string[];
  status: string; // 'pending' | 'verified' | 'needs_update' | 'rejected'
  rejectionReason?: string;
  notes?: string;
  documentCount?: number;
  submittedAt?: string;
  updatedAt?: string;
}

export default function AdminInvestorFinanceVerificationPage() {
  const [verifications, setVerifications] = useState<InvestorFinanceVerificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<InvestorFinanceVerificationItem | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Decision state
  const [decisionAction, setDecisionAction] = useState<"verify" | "needs_update" | "reject" | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  const fetchVerifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get("/admin/investor-finance-verifications");
      if (Array.isArray(res.data)) {
        setVerifications(res.data);
      } else if (res.data && Array.isArray(res.data.items)) {
        setVerifications(res.data.items);
      } else {
        setVerifications([]);
      }
    } catch (err: unknown) {
      console.error("Error loading investor finance verifications:", err);
      setError("Failed to load investor finance verifications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const handleDecisionSubmit = async () => {
    if (!selectedItem || !decisionAction) return;

    if ((decisionAction === "reject" || decisionAction === "needs_update") && !decisionReason.trim()) {
      setActionError("A reason is mandatory when requesting updates or rejecting.");
      return;
    }

    setIsSubmittingDecision(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      await api.post(`/admin/investor-finance-verifications/${selectedItem.id}/decision`, {
        action: decisionAction,
        reason: decisionReason.trim(),
      });

      const actionVerb = decisionAction === "verify" ? "verified" : decisionAction === "needs_update" ? "marked for updates" : "rejected";
      setActionSuccess(`Investor finance submission ${actionVerb} successfully.`);
      setIsReviewModalOpen(false);
      setDecisionAction(null);
      setDecisionReason("");
      setSelectedItem(null);
      await fetchVerifications();
    } catch (err: any) {
      if (err.response?.status === 409 || err.response?.status === 404) {
        setActionError("This submission has already been processed by another administrator.");
        await fetchVerifications();
      } else {
        setActionError(err.response?.data?.message || err.response?.data?.error || "Failed to submit decision.");
      }
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const filteredItems = verifications.filter((item) => {
    // Status Filter
    if (statusFilter !== "all" && item.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    // Search
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      (item.userName && item.userName.toLowerCase().includes(s)) ||
      (item.userEmail && item.userEmail.toLowerCase().includes(s)) ||
      (item.userId && item.userId.toLowerCase().includes(s)) ||
      (item.declaredCapitalCurrency && item.declaredCapitalCurrency.toLowerCase().includes(s))
    );
  });

  const pendingCount = verifications.filter((v) => v.status === "pending").length;

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Shared Admin Page Header */}
      <AdminPageHeader
        title="Investor Finance Verification Queue"
        description="Validate declared investor capital capacities, ticket limits, and proof-of-funds documentation."
        badge="FINANCE"
        icon={TrendingUp}
        backHref="/dashboard/admin/verifications"
        backLabel="Back to Verification Hub"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchVerifications}
            disabled={isLoading}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} /> Refresh Queue
          </Button>
        }
      />

      {/* Shared Error Alert */}
      {error && (
        <AdminErrorState
          title="Failed to load investor queue"
          message={error}
          onRetry={fetchVerifications}
        />
      )}

      {/* Alerts */}
      {actionSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-sm rounded-lg border border-emerald-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {actionSuccess}
          </span>
          <button onClick={() => setActionSuccess(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {actionError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-sm rounded-lg border border-rose-200 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-600" />
            {actionError}
          </span>
          <button onClick={() => setActionError(null)} className="text-xs hover:underline">Dismiss</button>
        </div>
      )}

      {/* Shared Filter Bar */}
      <AdminFilterBar
        searchValue={search}
        onSearchChange={(val) => setSearch(val)}
        searchPlaceholder="Filter by investor name, email, or user ID..."
        hasActiveFilters={Boolean(search.trim() || statusFilter !== "all")}
        onClearFilters={() => {
          setSearch("");
          setStatusFilter("all");
        }}
        filters={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 text-xs sm:text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Submission States</option>
            <option value="pending">Pending Review</option>
            <option value="verified">Verified</option>
            <option value="needs_update">Needs Update</option>
            <option value="rejected">Rejected</option>
          </select>
        }
      />

      {/* Shared Submissions Table */}
      <AdminTable
        title="Investor Submissions"
        description="Declared capital proofs and accreditation requests."
        badge={
          <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold bg-card border-emerald-300">
            Pending: <span className="ml-1 text-foreground font-bold">{pendingCount}</span>
          </Badge>
        }
        loading={isLoading}
        loadingRowsCount={5}
        empty={filteredItems.length === 0}
        emptyTitle="No investor finance verifications are awaiting review."
        emptyDescription="There are no verification requests matching your filter or awaiting review."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium border-b border-border">
              <tr>
                <th scope="col" className="px-6 py-3.5">Investor</th>
                <th scope="col" className="px-4 py-3.5">Declared Capacity</th>
                <th scope="col" className="px-4 py-3.5">Ticket Range</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-4 py-3.5">Last Updated</th>
                <th scope="col" className="px-6 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-muted/40 transition">
                  {/* Investor */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-center text-sm shrink-0">
                        {(item.userName || item.userEmail || "I").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground truncate max-w-xs">
                          {item.userName || "Investor Applicant"}
                        </div>
                        <div className="text-xs text-muted-foreground truncate max-w-xs">
                          {item.userEmail || item.userId}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Declared Capacity */}
                  <td className="px-4 py-4 font-medium text-foreground">
                    {item.declaredCapitalAmount != null
                      ? `${item.declaredCapitalCurrency || "$"}${item.declaredCapitalAmount.toLocaleString()}`
                      : "—"}
                  </td>

                  {/* Ticket Range */}
                  <td className="px-4 py-4 text-xs text-muted-foreground">
                    {item.minTicketSize != null || item.maxTicketSize != null
                      ? `${item.minTicketSize?.toLocaleString() || "0"} – ${item.maxTicketSize?.toLocaleString() || "Max"}`
                      : "Flexible"}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <AdminStatusBadge status={item.status} size="sm" />
                  </td>

                  {/* Last Updated */}
                  <td className="px-4 py-4 text-xs text-muted-foreground whitespace-nowrap">
                    {item.updatedAt
                      ? new Date(item.updatedAt).toLocaleDateString()
                      : item.submittedAt
                      ? new Date(item.submittedAt).toLocaleDateString()
                      : "—"}
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4 text-right">
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedItem(item);
                        setDecisionAction(null);
                        setDecisionReason("");
                        setIsReviewModalOpen(true);
                      }}
                      className="text-xs h-8 px-3"
                    >
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminTable>

      {/* INVESTOR FINANCE REVIEW MODAL */}
      <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Investor Finance Review — {selectedItem?.userName || selectedItem?.userEmail}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Evaluate declared capital and accreditation documents before issuing a decision.
            </DialogDescription>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-4 py-2 text-xs">
              {/* Financial Parameters Summary */}
              <div className="p-3 bg-muted/40 rounded-lg space-y-2 border border-border">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investor Name:</span>
                  <span className="font-semibold text-foreground">{selectedItem.userName || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-semibold text-foreground">{selectedItem.userEmail || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Declared Capital:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {selectedItem.declaredCapitalCurrency || "$"}{selectedItem.declaredCapitalAmount?.toLocaleString() || "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ticket Range:</span>
                  <span className="font-semibold text-foreground">
                    Min: {selectedItem.minTicketSize?.toLocaleString() || "—"} | Max: {selectedItem.maxTicketSize?.toLocaleString() || "—"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border/50">
                  <span className="text-muted-foreground">Unified Profile:</span>
                  <Link
                    href={`/dashboard/admin/users/${selectedItem.userId}`}
                    target="_blank"
                    className="text-primary hover:underline inline-flex items-center gap-1 font-semibold"
                  >
                    Inspect User Account <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Sectors & Stages */}
              <div className="space-y-1.5">
                <span className="font-semibold text-foreground uppercase tracking-wider text-[11px]">Investment Scope</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedItem.preferredSectors && selectedItem.preferredSectors.length > 0 ? (
                    selectedItem.preferredSectors.map((sec) => (
                      <Badge key={sec} variant="secondary" className="text-[10px]">{sec}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">All Sectors</span>
                  )}
                </div>
              </div>

              {/* Previous Rejection / Notes if any */}
              {selectedItem.rejectionReason && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded border border-rose-200 text-rose-800 dark:text-rose-300">
                  <span className="font-semibold">Previous Reason: </span>
                  {selectedItem.rejectionReason}
                </div>
              )}

              {/* Decision Input Form */}
              {decisionAction ? (
                <div className="space-y-2 p-3 bg-muted/50 border rounded-lg">
                  <label className="font-semibold text-foreground flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    {decisionAction === "verify"
                      ? "Approval Notes (Optional):"
                      : decisionAction === "needs_update"
                      ? "Requested Updates (Mandatory):"
                      : "Rejection Reason (Mandatory):"}
                  </label>
                  <Textarea
                    placeholder={
                      decisionAction === "verify"
                        ? "Optional administrative note..."
                        : "Specify missing documents, proof of funds clarification, or remediation steps..."
                    }
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    className="text-xs bg-background"
                    rows={3}
                  />
                </div>
              ) : null}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {decisionAction ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDecisionAction(null)}
                  disabled={isSubmittingDecision}
                >
                  Back
                </Button>
                <Button
                  variant={decisionAction === "verify" ? "default" : decisionAction === "needs_update" ? "outline" : "destructive"}
                  size="sm"
                  onClick={handleDecisionSubmit}
                  disabled={
                    isSubmittingDecision ||
                    ((decisionAction === "needs_update" || decisionAction === "reject") && !decisionReason.trim())
                  }
                  className={decisionAction === "verify" ? "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" : ""}
                >
                  {isSubmittingDecision
                    ? "Submitting..."
                    : decisionAction === "verify"
                    ? "Confirm Verification"
                    : decisionAction === "needs_update"
                    ? "Send Update Request"
                    : "Confirm Rejection"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsReviewModalOpen(false)}
                  disabled={isSubmittingDecision}
                >
                  Close
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDecisionAction("needs_update")}
                  disabled={isSubmittingDecision}
                  className="text-amber-600 border-amber-300 hover:bg-amber-50"
                >
                  Needs Update...
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDecisionAction("reject")}
                  disabled={isSubmittingDecision}
                >
                  Reject...
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setDecisionAction("verify")}
                  disabled={isSubmittingDecision}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                >
                  Verify
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

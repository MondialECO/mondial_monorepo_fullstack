'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';
import { UserRole } from '@/lib/roles';
import { useSuperAdminIdentifiers } from '@/lib/audit-privilege';
import {
  getAdminPrivacyRequests,
  getAdminPrivacyRequestById,
  movePrivacyRequestUnderReview,
  completePrivacyRequest,
  rejectPrivacyRequest,
} from '@/lib/api-admin-security';
import { PrivacyRequest } from '@/types/admin-security-compliance';
import {
  FileText,
  Shield,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Download,
  Trash2,
  Lock,
  User,
  ArrowRight,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminTable,
  AdminPagination,
  AdminStatusBadge,
  AdminErrorState,
} from '@/components/admin/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AdminPrivacyRequestsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPERADMIN || user?.roles?.includes(UserRole.SUPERADMIN);
  const { isSuperAdminIdentifier } = useSuperAdminIdentifiers();

  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Decision Modal State
  const [activeRequest, setActiveRequest] = useState<PrivacyRequest | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [exportUrl, setExportUrl] = useState<string>('');
  const [submittingDecision, setSubmittingDecision] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminPrivacyRequests({
        page,
        pageSize,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        requestType: selectedType === 'all' ? undefined : selectedType,
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
      });

      setRequests(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load privacy requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, selectedStatus, selectedType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchRequests();
  };

  const openReviewModal = async (req: PrivacyRequest) => {
    try {
      setActiveRequest(req);
      setActionNotes(req.adminNotes || '');
      setRejectionReason('');
      setExportUrl(req.exportDownloadUrl || '');
      setActionError(null);
      setLoadingDetail(true);

      // Fetch fresh detail with latest dependency check
      const detail = await getAdminPrivacyRequestById(req.id);
      setActiveRequest(detail);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to fetch request details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleMoveUnderReview = async () => {
    if (!activeRequest) return;
    try {
      setSubmittingDecision(true);
      setActionError(null);
      const updated = await movePrivacyRequestUnderReview(activeRequest.id, {
        adminNotes: actionNotes.trim() ? actionNotes.trim() : undefined,
        version: activeRequest.version,
      });
      setActiveRequest(updated);
      setActionSuccess(`Request ${activeRequest.id} moved to UnderReview.`);
      fetchRequests();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to move request under review.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleComplete = async () => {
    if (!activeRequest) return;
    try {
      setSubmittingDecision(true);
      setActionError(null);
      const updated = await completePrivacyRequest(activeRequest.id, {
        adminNotes: actionNotes.trim() ? actionNotes.trim() : undefined,
        exportDownloadUrl: exportUrl.trim() ? exportUrl.trim() : undefined,
        version: activeRequest.version,
      });
      setActiveRequest(updated);
      setActionSuccess(`Request ${activeRequest.id} marked as Completed.`);
      fetchRequests();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to complete privacy request.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const handleReject = async () => {
    if (!activeRequest) return;
    if (!rejectionReason.trim()) {
      setActionError('Rejection reason is required.');
      return;
    }
    try {
      setSubmittingDecision(true);
      setActionError(null);
      const updated = await rejectPrivacyRequest(activeRequest.id, {
        reason: rejectionReason.trim(),
        adminNotes: actionNotes.trim() ? actionNotes.trim() : undefined,
        version: activeRequest.version,
      });
      setActiveRequest(updated);
      setActionSuccess(`Request ${activeRequest.id} marked as Rejected.`);
      fetchRequests();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to reject privacy request.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // RBAC Filter: Normal Admin cannot see SuperAdmin privacy requests
  const visibleRequests = requests.filter((req) => {
    if (isSuperAdmin) return true;
    if (isSuperAdminIdentifier(req.userEmail)) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Shared Admin Header */}
      <AdminPageHeader
        title="Privacy & Data Governance Queue"
        description="Manage user GDPR/privacy requests, data export generations, and account deletion pre-condition verifications."
        badge="PRIVACY & GDPR"
        icon={FileText}
        backHref="/dashboard/admin/security"
        backLabel="Back to Security Overview"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRequests}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Queue
          </Button>
        }
      />

      {actionSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{actionSuccess}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setActionSuccess(null)}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Shared Error State */}
      {error && (
        <AdminErrorState
          title="Failed to load privacy requests"
          message={error}
          onRetry={fetchRequests}
        />
      )}

      {/* Shared Filters Bar */}
      <AdminFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        searchPlaceholder="Search by user email or name..."
        hasActiveFilters={Boolean(searchQuery.trim() || selectedStatus !== 'all' || selectedType !== 'all')}
        onClearFilters={() => {
          setSearchQuery('');
          setSelectedStatus('all');
          setSelectedType('all');
          setPage(1);
        }}
        filters={
          <div className="flex flex-wrap items-center gap-2.5">
            <Select value={selectedStatus} onValueChange={(val) => { setSelectedStatus(val); setPage(1); }}>
              <SelectTrigger className="w-[160px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="UnderReview">Under Review</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={(val) => { setSelectedType(val); setPage(1); }}>
              <SelectTrigger className="w-[180px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="All Request Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="DataAccess">Data Access</SelectItem>
                <SelectItem value="DataExport">Data Export</SelectItem>
                <SelectItem value="Correction">Correction</SelectItem>
                <SelectItem value="AccountDeletion">Account Deletion</SelectItem>
                <SelectItem value="OtherPrivacyRequest">Other Request</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Shared Requests Table */}
      <AdminTable
        title="Privacy Requests Queue"
        description="Formal data subject requests under GDPR & global privacy frameworks."
        badge={
          <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold bg-card border-border/80">
            Total: <span className="ml-1 text-foreground font-bold">{totalCount}</span>
          </Badge>
        }
        loading={loading}
        loadingRowsCount={5}
        empty={visibleRequests.length === 0}
        emptyTitle="No privacy requests found"
        emptyDescription="No privacy requests matching the current filters."
        pagination={
          totalPages > 1 || totalCount > 0 ? (
            <AdminPagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
            />
          ) : undefined
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20 text-muted-foreground">
                <th className="py-3.5 px-4 font-medium">Request Type</th>
                <th className="py-3.5 px-4 font-medium">User Email</th>
                <th className="py-3.5 px-4 font-medium">User Name</th>
                <th className="py-3.5 px-4 font-medium">Status</th>
                <th className="py-3.5 px-4 font-medium">Submitted</th>
                <th className="py-3.5 px-4 font-medium">Updated</th>
                <th className="py-3.5 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {visibleRequests.map((req) => (
                <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      {req.requestType === 'AccountDeletion' ? (
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      ) : req.requestType === 'DataExport' ? (
                        <Download className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span>{req.requestType}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-foreground font-mono">
                    {req.userEmail}
                  </td>
                  <td className="py-3.5 px-4 text-muted-foreground">
                    {req.userDisplayName || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <AdminStatusBadge status={req.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(req.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(req.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReviewModal(req)}
                      className="h-7 px-2.5 text-xs flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" /> Inspect & Decide
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminTable>

      {/* Review & Decision Dialog */}
      <Dialog open={!!activeRequest} onOpenChange={(open) => !open && setActiveRequest(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Review Privacy Request: {activeRequest?.requestType}
            </DialogTitle>
            <DialogDescription>
              User: <strong className="text-foreground">{activeRequest?.userEmail}</strong> &bull; Request ID: {activeRequest?.id}
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="py-12 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Refreshing request and dependency scan...
            </div>
          ) : activeRequest && (
            <div className="space-y-5 text-xs">
              {actionError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Status & Timing Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/20 border border-border/40 rounded-xl">
                <div>
                  <div className="text-muted-foreground">Current Status</div>
                  <div className="mt-1"><AdminStatusBadge status={activeRequest.status} size="sm" /></div>
                </div>
                <div>
                  <div className="text-muted-foreground">Submitted At</div>
                  <div className="font-mono text-foreground mt-1">{new Date(activeRequest.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Reviewed By</div>
                  <div className="font-medium text-foreground mt-1">{activeRequest.reviewedBy || 'Pending'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Record Version</div>
                  <div className="font-mono text-foreground mt-1">v{activeRequest.version}</div>
                </div>
              </div>

              {/* User Request Details */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                  User Details / Request Notes
                </label>
                <div className="p-3 bg-background border border-border/50 rounded-xl text-foreground whitespace-pre-wrap">
                  {activeRequest.details || <span className="text-muted-foreground italic">No details provided by user.</span>}
                </div>
              </div>

              {/* Deletion Dependency Check */}
              {activeRequest.requestType === 'AccountDeletion' && activeRequest.dependencyCheck && (
                <div className="space-y-2">
                  <label className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                    Commercial & Legal Dependency Scan
                  </label>
                  <div className={`p-4 rounded-xl border ${
                    activeRequest.dependencyCheck.canSafelyDelete
                      ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-500/5 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  }`}>
                    <div className="font-semibold flex items-center gap-2 mb-2">
                      {activeRequest.dependencyCheck.canSafelyDelete ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>All pre-conditions satisfied. Safe for account deletion or anonymization.</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          <span>Active commitments found. Hard deletion blocked until resolved:</span>
                        </>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-muted-foreground my-2">
                      <div className="p-2 bg-background/50 rounded-lg border border-border/30">
                        <div className="text-[10px]">Active Engagements</div>
                        <div className="font-semibold text-foreground">{activeRequest.dependencyCheck.activeEngagementsCount}</div>
                      </div>
                      <div className="p-2 bg-background/50 rounded-lg border border-border/30">
                        <div className="text-[10px]">Open Disputes</div>
                        <div className="font-semibold text-foreground">{activeRequest.dependencyCheck.openDisputesCount}</div>
                      </div>
                      <div className="p-2 bg-background/50 rounded-lg border border-border/30">
                        <div className="text-[10px]">Pending Payouts</div>
                        <div className="font-semibold text-foreground">{activeRequest.dependencyCheck.pendingPayoutsCount}</div>
                      </div>
                      <div className="p-2 bg-background/50 rounded-lg border border-border/30">
                        <div className="text-[10px]">Financial Txns</div>
                        <div className="font-semibold text-foreground">{activeRequest.dependencyCheck.transactionCount}</div>
                      </div>
                    </div>

                    {activeRequest.dependencyCheck.blockers.length > 0 && (
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-muted-foreground pl-1 mt-2">
                        {activeRequest.dependencyCheck.blockers.map((b, i) => (
                          <li key={i}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Data Export URL Input if DataExport */}
              {activeRequest.requestType === 'DataExport' && activeRequest.status !== 'Completed' && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                    Export Download Package URL (Optional)
                  </label>
                  <Input
                    placeholder="/api/privacy/export/..."
                    value={exportUrl}
                    onChange={(e) => setExportUrl(e.target.value)}
                    className="text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Leave blank to auto-generate protected system download endpoint.
                  </p>
                </div>
              )}

              {/* Admin Internal Notes */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                  Admin Internal Decision Notes
                </label>
                <Textarea
                  placeholder="Record rationale, compliance review outcome, or verification steps..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              {/* Rejection Reason (only when rejecting) */}
              {activeRequest.status !== 'Completed' && activeRequest.status !== 'Rejected' && (
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider text-rose-500">
                    Rejection Reason (Required only if Rejecting)
                  </label>
                  <Input
                    placeholder="e.g., Active commercial commitments block deletion / Identity mismatch..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="text-xs"
                  />
                </div>
              )}

              {/* Decision Action Buttons */}
              <div className="pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {activeRequest.status === 'Open' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleMoveUnderReview}
                      disabled={submittingDecision}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      Mark Under Review
                    </Button>
                  )}
                </div>

                {activeRequest.status !== 'Completed' && activeRequest.status !== 'Rejected' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleReject}
                      disabled={submittingDecision}
                      className="text-xs flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject Request
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleComplete}
                      disabled={submittingDecision}
                      className="text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Complete & Apply Decision
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

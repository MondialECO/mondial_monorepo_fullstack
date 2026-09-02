'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldBan,
  X
} from 'lucide-react';
import {
  AdminReportItem,
  AdminReportDetail,
  ReportStatus,
  ReportCategory,
  ReportTargetType,
} from '@/types/admin-reports';
import {
  getAdminReports,
  getAdminReportDetail,
  markReportUnderReview,
  dismissReport,
  resolveReport,
} from '@/lib/api-admin-reports';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AdminPageHeader,
  AdminPagination,
  AdminStatusBadge,
  AdminTable,
} from '@/components/admin/shared';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');

  // Selected for investigation
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportDetail, setReportDetail] = useState<AdminReportDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Resolution dialog
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveAction, setResolveAction] = useState<'none' | 'hide' | 'dismiss'>('none');
  const [resolveNotes, setResolveNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await getAdminReports({
        page,
        pageSize: 15,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        targetType: targetTypeFilter || undefined,
      });
      setReports(res.items || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, statusFilter, categoryFilter, targetTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReports();
  };

  const handleOpenDetail = async (id: string) => {
    setSelectedReportId(id);
    setReportDetail(null);
    try {
      setDetailLoading(true);
      const detail = await getAdminReportDetail(id);
      setReportDetail(detail);
    } catch (err) {
      console.error('Failed to fetch report detail', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleMarkUnderReview = async () => {
    if (!selectedReportId) return;
    try {
      setActionLoading(true);
      await markReportUnderReview(selectedReportId);
      const detail = await getAdminReportDetail(selectedReportId);
      setReportDetail(detail);
      fetchReports();
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (!selectedReportId) return;
    try {
      setActionLoading(true);
      await dismissReport(selectedReportId, { notes: 'Dismissed by moderator' });
      const detail = await getAdminReportDetail(selectedReportId);
      setReportDetail(detail);
      fetchReports();
    } catch (err) {
      console.error('Failed to dismiss report', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveSubmit = async () => {
    if (!selectedReportId) return;
    try {
      setActionLoading(true);
      setActionError(null);
      await resolveReport(selectedReportId, {
        resolutionAction: resolveAction,
        notes: resolveNotes.trim() || undefined,
      });
      setIsResolveModalOpen(false);
      const detail = await getAdminReportDetail(selectedReportId);
      setReportDetail(detail);
      fetchReports();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to resolve report.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <AdminPageHeader
        icon={ShieldAlert}
        title="Reports & Content Abuse"
        description="Investigate user-submitted reports, moderate policy-violating items, and resolve trust & safety escalations."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchReports()}
            disabled={loading}
            className="text-xs h-8 gap-1.5 bg-background"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        }
      />

      {/* Filters Bar */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description, target ID, reporter..."
                className="h-9 text-xs sm:text-sm pl-9 bg-background"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Statuses</option>
                <option value="Open">Open</option>
                <option value="UnderReview">Under Review</option>
                <option value="Resolved">Resolved</option>
                <option value="Dismissed">Dismissed</option>
              </select>
            </div>

            <div>
              <select
                value={targetTypeFilter}
                onChange={(e) => { setTargetTypeFilter(e.target.value); setPage(1); }}
                className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Target Types</option>
                <option value="ServiceListing">Service Listings</option>
                <option value="CreatorOffer">Creator Offers</option>
                <option value="Review">Reviews</option>
                <option value="UserProfile">User Profiles</option>
              </select>
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Categories</option>
                <option value="Spam">Spam</option>
                <option value="MisleadingContent">Misleading Content</option>
                <option value="HarassmentOrAbuse">Harassment or Abuse</option>
                <option value="InappropriateContent">Inappropriate Content</option>
                <option value="FraudOrScamConcern">Fraud or Scam Concern</option>
                <option value="Impersonation">Impersonation</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <AdminTable
        title="Reports Queue"
        description={`Showing ${reports.length} reports on current page`}
        loading={loading}
        empty={reports.length === 0}
        emptyTitle="No reports found"
        emptyDescription="No content abuse reports match your current filter parameters."
        pagination={
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={15}
            onPageChange={setPage}
            disabled={loading}
          />
        }
      >
        <table className="w-full text-left text-xs border-collapse">
          <thead className="border-b border-border/50 bg-muted/30 text-muted-foreground uppercase font-medium">
            <tr>
              <th className="px-5 py-3.5">Report ID / Target</th>
              <th className="px-4 py-3.5">Type</th>
              <th className="px-4 py-3.5">Category</th>
              <th className="px-4 py-3.5">Reporter</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Submitted</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="font-semibold text-foreground truncate max-w-xs font-syne" title={report.targetSummary}>
                    {report.targetSummary || report.targetId}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono">
                    ID: {report.id}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="rounded bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-foreground">
                    {report.targetType}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-medium text-foreground">{report.category}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="text-foreground">{report.reporterName}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{report.reporterEmail}</div>
                </td>
                <td className="px-4 py-3.5">
                  <AdminStatusBadge status={report.status} size="sm" />
                </td>
                <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  {new Date(report.createdAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenDetail(report.id)}
                    className="h-7 px-2.5 text-xs gap-1 bg-background hover:bg-muted"
                  >
                    <Eye className="size-3 text-muted-foreground" /> Inspect
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>

      {/* Investigation Drawer / Modal */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
          <div className="h-full w-full max-w-2xl bg-card border-l border-border p-6 shadow-2xl overflow-y-auto flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground font-syne">Report Investigation</h2>
                  <p className="text-xs text-muted-foreground font-mono">ID: {selectedReportId}</p>
                </div>
                <button
                  onClick={() => setSelectedReportId(null)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>

              {detailLoading ? (
                <div className="py-20 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2 text-primary" />
                  Loading report payload...
                </div>
              ) : reportDetail ? (
                <div className="space-y-5 text-xs">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-muted-foreground">Status:</span>
                      <AdminStatusBadge status={reportDetail.status} />
                    </div>
                    <div className="text-muted-foreground font-mono text-[11px]">
                      {new Date(reportDetail.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Target Content Overview */}
                  <div className="rounded-xl border border-border/60 p-4 bg-card space-y-2">
                    <h4 className="font-bold text-foreground font-syne">Target Item Information</h4>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="col-span-2 font-medium text-foreground">{reportDetail.targetType}</span>
                      <span className="text-muted-foreground">Target ID:</span>
                      <span className="col-span-2 font-mono text-muted-foreground">{reportDetail.targetId}</span>
                      <span className="text-muted-foreground">Category:</span>
                      <span className="col-span-2 font-medium text-foreground">{reportDetail.category}</span>
                    </div>

                    {reportDetail.targetData && (
                      <div className="mt-3 pt-3 border-t border-border/40">
                        <span className="text-muted-foreground block mb-1">Target Summary:</span>
                        <p className="p-3 bg-muted/40 rounded-lg text-foreground font-medium">
                          {reportDetail.targetData.title || reportDetail.targetData.name || reportDetail.targetData.summary || 'Item Available'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Reporter & Explanation */}
                  <div className="rounded-xl border border-border/60 p-4 bg-card space-y-2">
                    <h4 className="font-bold text-foreground font-syne">Reporter Claim & Description</h4>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <span className="text-muted-foreground">Reporter:</span>
                      <span className="col-span-2 text-foreground font-medium">{reportDetail.reporterName} ({reportDetail.reporterEmail})</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-border/40">
                      <span className="text-muted-foreground block mb-1">Reason / Statement:</span>
                      <p className="p-3 bg-muted/30 rounded-lg text-foreground leading-relaxed">
                        {reportDetail.description || 'No description provided by reporter.'}
                      </p>
                    </div>
                  </div>

                  {/* Resolution Info if already resolved */}
                  {reportDetail.resolution && (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-1">
                      <h4 className="font-bold text-emerald-600 dark:text-emerald-400 font-syne">Resolution Record</h4>
                      <p className="text-foreground">{reportDetail.resolution}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Action Buttons Footer */}
            {reportDetail && (
              <div className="border-t border-border/40 pt-4 mt-6 flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedReportId(null)}
                  className="text-xs"
                >
                  Close
                </Button>

                <div className="flex items-center gap-2">
                  {reportDetail.status === 'Open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkUnderReview}
                      disabled={actionLoading}
                      className="text-xs"
                    >
                      Mark Under Review
                    </Button>
                  )}

                  {reportDetail.status !== 'Resolved' && reportDetail.status !== 'Dismissed' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDismiss}
                        disabled={actionLoading}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Dismiss
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setIsResolveModalOpen(true)}
                        disabled={actionLoading}
                        className="text-xs"
                      >
                        Take Action / Resolve
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Resolution Action Dialog */}
      {isResolveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl space-y-4">
            <div className="border-b border-border/40 pb-3">
              <h3 className="font-bold text-foreground font-syne text-base">Resolve Report</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Select administrative action and log resolution rationale.</p>
            </div>

            {actionError && (
              <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg border border-destructive/20">
                {actionError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1.5">Action to Take:</label>
                <select
                  value={resolveAction}
                  onChange={(e) => setResolveAction(e.target.value as any)}
                  className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="none">No Content Removal (Resolve Claim)</option>
                  <option value="hide">Hide Target Content Immediately</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1.5">Resolution Notes (Mandatory for audit trail):</label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Enter moderation justification and policy references..."
                  rows={4}
                  className="w-full rounded-lg border border-input bg-background p-3 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
              <Button variant="outline" size="sm" onClick={() => setIsResolveModalOpen(false)} disabled={actionLoading} className="text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={handleResolveSubmit} disabled={actionLoading || !resolveNotes.trim()} className="text-xs">
                {actionLoading ? 'Executing...' : 'Confirm Resolution'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

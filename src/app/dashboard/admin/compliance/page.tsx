'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';
import { UserRole } from '@/lib/roles';
import { useSuperAdminIdentifiers } from '@/lib/audit-privilege';
import {
  getAdminComplianceCases,
  getAdminComplianceCaseById,
  createComplianceCase,
  addComplianceCaseNote,
  updateComplianceCaseStatus,
} from '@/lib/api-admin-security';
import { ComplianceCase } from '@/types/admin-security-compliance';
import {
  Scale,
  Shield,
  RefreshCw,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  History,
  Lock,
  ExternalLink,
  User,
  AlertCircle,
  CheckCircle,
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

export default function AdminComplianceCasesPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPERADMIN || user?.roles?.includes(UserRole.SUPERADMIN);
  const { isSuperAdminIdentifier } = useSuperAdminIdentifiers();

  const [cases, setCases] = useState<ComplianceCase[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Create Case Modal
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createTargetUser, setCreateTargetUser] = useState<string>('');
  const [createCaseType, setCreateCaseType] = useState<string>('AccountReview');
  const [createPriority, setCreatePriority] = useState<string>('Normal');
  const [createSummary, setCreateSummary] = useState<string>('');
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false);

  // Case Detail Drawer / Modal
  const [activeCase, setActiveCase] = useState<ComplianceCase | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [newNoteContent, setNewNoteContent] = useState<string>('');
  const [submittingNote, setSubmittingNote] = useState<boolean>(false);
  const [statusResolution, setStatusResolution] = useState<string>('');
  const [submittingStatus, setSubmittingStatus] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminComplianceCases({
        page,
        pageSize,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        priority: selectedPriority === 'all' ? undefined : selectedPriority,
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
      });

      setCases(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load compliance cases.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, selectedStatus, selectedPriority]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCases();
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTargetUser.trim() || !createSummary.trim()) {
      setActionError('Target user and summary are required.');
      return;
    }

    try {
      setSubmittingCreate(true);
      setActionError(null);
      await createComplianceCase({
        targetUserId: createTargetUser.trim(),
        caseType: createCaseType,
        priority: createPriority,
        summary: createSummary.trim(),
      });

      setIsCreateOpen(false);
      setCreateTargetUser('');
      setCreateSummary('');
      setActionSuccess('Compliance case opened successfully.');
      fetchCases();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to create compliance case.');
    } finally {
      setSubmittingCreate(false);
    }
  };

  const openCaseDetail = async (c: ComplianceCase) => {
    try {
      setActiveCase(c);
      setNewNoteContent('');
      setStatusResolution('');
      setActionError(null);
      setLoadingDetail(true);

      const detail = await getAdminComplianceCaseById(c.id);
      setActiveCase(detail);
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to load case details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCase || !newNoteContent.trim()) return;

    try {
      setSubmittingNote(true);
      setActionError(null);
      const updated = await addComplianceCaseNote(activeCase.id, {
        content: newNoteContent.trim(),
      });
      setActiveCase(updated);
      setNewNoteContent('');
      setActionSuccess('Note appended to compliance audit log.');
      fetchCases();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to add audit note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!activeCase) return;

    try {
      setSubmittingStatus(true);
      setActionError(null);
      const updated = await updateComplianceCaseStatus(activeCase.id, {
        status: newStatus,
        resolution: statusResolution.trim() || undefined,
        version: activeCase.version,
      });
      setActiveCase(updated);
      setStatusResolution('');
      setActionSuccess(`Case status updated to ${newStatus}.`);
      fetchCases();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Failed to update case status.');
    } finally {
      setSubmittingStatus(false);
    }
  };

  // Filter out SuperAdmin targets for normal Admin
  const visibleCases = cases.filter((c) => {
    if (isSuperAdmin) return true;
    if (isSuperAdminIdentifier(c.targetUserEmail)) return false;
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return <Badge variant="destructive" className="animate-pulse">Critical</Badge>;
      case 'High':
        return <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20">High</Badge>;
      case 'Normal':
        return <Badge variant="secondary">Normal</Badge>;
      case 'Low':
        return <Badge variant="outline" className="text-muted-foreground">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Shared Admin Header */}
      <AdminPageHeader
        title="Compliance & High-Risk Cases"
        description="Investigate high-risk accounts, dispute spikes, chargebacks, append internal audit notes, and track resolution timelines."
        badge="SECURITY & TRUST"
        icon={Scale}
        backHref="/dashboard/admin/security"
        backLabel="Back to Security Overview"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchCases}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Open Compliance Case
            </Button>
          </div>
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
          title="Failed to load compliance cases"
          message={error}
          onRetry={fetchCases}
        />
      )}

      {/* Shared Filters Bar */}
      <AdminFilterBar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearch}
        searchPlaceholder="Search target user email or case summary..."
        hasActiveFilters={Boolean(searchQuery.trim() || selectedStatus !== 'all' || selectedPriority !== 'all')}
        onClearFilters={() => {
          setSearchQuery('');
          setSelectedStatus('all');
          setSelectedPriority('all');
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
                <SelectItem value="ActionTaken">Action Taken</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Dismissed">Dismissed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedPriority} onValueChange={(val) => { setSelectedPriority(val); setPage(1); }}>
              <SelectTrigger className="w-[160px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Shared Cases Table */}
      <AdminTable
        title="Compliance Cases Directory"
        description="Active investigations and supervisory records."
        badge={
          <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold bg-card border-border/80">
            Total: <span className="ml-1 text-foreground font-bold">{totalCount}</span>
          </Badge>
        }
        loading={loading}
        loadingRowsCount={5}
        empty={visibleCases.length === 0}
        emptyTitle="No compliance cases found"
        emptyDescription="No compliance cases found matching the filter criteria."
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
                <th className="py-3.5 px-4 font-medium">Priority</th>
                <th className="py-3.5 px-4 font-medium">Case Type</th>
                <th className="py-3.5 px-4 font-medium">Target User</th>
                <th className="py-3.5 px-4 font-medium">Summary</th>
                <th className="py-3.5 px-4 font-medium">Status</th>
                <th className="py-3.5 px-4 font-medium">Updated</th>
                <th className="py-3.5 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {visibleCases.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getPriorityBadge(c.priority)}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-foreground whitespace-nowrap">
                    {c.caseType}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-mono text-foreground">{c.targetUserEmail}</div>
                    <div className="text-[10px] text-muted-foreground">{c.targetUserDisplayName || '—'}</div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-muted-foreground" title={c.summary}>
                    {c.summary}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <AdminStatusBadge status={c.status} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCaseDetail(c)}
                      className="h-7 px-2.5 text-xs flex items-center gap-1 ml-auto"
                    >
                      <Eye className="w-3.5 h-3.5" /> Case Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminTable>

      {/* Create Compliance Case Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateCase}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Open New Compliance Case
              </DialogTitle>
              <DialogDescription>
                Initiate a formal compliance or high-risk account investigation.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Target User ID or Email</label>
                <Input
                  placeholder="Enter User ID or email..."
                  value={createTargetUser}
                  onChange={(e) => setCreateTargetUser(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Case Type</label>
                  <Select value={createCaseType} onValueChange={setCreateCaseType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AccountReview">Account Review</SelectItem>
                      <SelectItem value="SecurityReview">Security Review</SelectItem>
                      <SelectItem value="DisputeSpike">Dispute Spike</SelectItem>
                      <SelectItem value="FraudRisk">Fraud Risk</SelectItem>
                      <SelectItem value="TermsViolation">Terms Violation</SelectItem>
                      <SelectItem value="IdentityMismatch">Identity Mismatch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-foreground">Priority</label>
                  <Select value={createPriority} onValueChange={setCreatePriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Investigation Summary</label>
                <Textarea
                  placeholder="Describe reason for opening case, factual signals observed, or relevant transaction IDs..."
                  value={createSummary}
                  onChange={(e) => setCreateSummary(e.target.value)}
                  rows={3}
                  required
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)} disabled={submittingCreate}>
                Cancel
              </Button>
              <Button type="submit" disabled={submittingCreate} className="flex items-center gap-2">
                {submittingCreate ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Case
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Case Details & Investigation Modal */}
      <Dialog open={!!activeCase} onOpenChange={(open) => !open && setActiveCase(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-primary" /> Case: {activeCase?.caseType} ({activeCase?.priority})
            </DialogTitle>
            <DialogDescription>
              Target User: <strong className="text-foreground">{activeCase?.targetUserEmail}</strong> &bull; ID: {activeCase?.id}
            </DialogDescription>
          </DialogHeader>

          {loadingDetail ? (
            <div className="py-12 text-center text-muted-foreground text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading case investigation details...
            </div>
          ) : activeCase && (
            <div className="space-y-6 text-xs">
              {actionError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Status Header Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/20 border border-border/40 rounded-xl">
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="mt-1"><AdminStatusBadge status={activeCase.status} size="sm" /></div>
                </div>
                <div>
                  <div className="text-muted-foreground">Priority</div>
                  <div className="mt-1">{getPriorityBadge(activeCase.priority)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Assigned Admin</div>
                  <div className="font-medium text-foreground mt-1">{activeCase.assignedAdminEmail || 'Unassigned'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Opened</div>
                  <div className="font-mono text-foreground mt-1">{new Date(activeCase.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                  Case Summary
                </label>
                <div className="p-3 bg-background border border-border/50 rounded-xl text-foreground whitespace-pre-wrap">
                  {activeCase.summary}
                </div>
              </div>

              {/* Factual Signals */}
              {activeCase.factualSignals && activeCase.factualSignals.length > 0 && (
                <div className="space-y-2">
                  <label className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                    Factual Risk & Platform Signals
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {activeCase.factualSignals.map((sig, i) => (
                      <div key={i} className="p-2.5 bg-muted/20 border border-border/40 rounded-lg flex items-center gap-2 text-muted-foreground">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span>{sig}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Internal Notes Thread */}
              <div className="space-y-3">
                <label className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" /> Internal Admin Notes ({activeCase.notes?.length || 0})
                </label>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeCase.notes && activeCase.notes.length > 0 ? (
                    activeCase.notes.map((note) => (
                      <div key={note.id} className="p-3 bg-muted/30 border border-border/30 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="font-semibold text-foreground">{note.authorEmail} ({note.authorRole})</span>
                          <span className="font-mono">{new Date(note.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-foreground whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground italic text-center py-4">No internal notes added yet.</p>
                  )}
                </div>

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <Input
                    placeholder="Type internal case note / evidence reference..."
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="text-xs"
                  />
                  <Button type="submit" size="sm" disabled={submittingNote || !newNoteContent.trim()}>
                    Add Note
                  </Button>
                </form>
              </div>

              {/* Case Timeline */}
              {activeCase.timeline && activeCase.timeline.length > 0 && (
                <div className="space-y-2">
                  <label className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-primary" /> Chronological Timeline
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {activeCase.timeline.map((evt) => (
                      <div key={evt.id} className="text-[11px] flex items-center justify-between p-2 bg-background/50 border border-border/30 rounded-lg">
                        <span className="font-medium text-foreground">{evt.description}</span>
                        <span className="font-mono text-muted-foreground text-[10px]">{new Date(evt.timestamp).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Transition Controls */}
              <div className="pt-4 border-t border-border/40 space-y-3">
                <label className="font-semibold text-muted-foreground uppercase text-[11px] tracking-wider">
                  Update Investigation Status
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    placeholder="Resolution summary or dismissal rationale (required for Resolve/Dismiss)..."
                    value={statusResolution}
                    onChange={(e) => setStatusResolution(e.target.value)}
                    className="text-xs flex-1"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleUpdateStatus('UnderReview')}
                      disabled={submittingStatus || activeCase.status === 'UnderReview'}
                      className="text-xs"
                    >
                      Under Review
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUpdateStatus('ActionTaken')}
                      disabled={submittingStatus}
                      className="text-xs text-purple-600 dark:text-purple-400"
                    >
                      Action Taken
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleUpdateStatus('Resolved')}
                      disabled={submittingStatus}
                      className="text-xs bg-emerald-600 hover:bg-emerald-700"
                    >
                      Resolve Case
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdateStatus('Dismissed')}
                      disabled={submittingStatus}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

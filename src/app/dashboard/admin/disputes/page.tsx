'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Gavel,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  User,
  ShieldCheck,
  RotateCcw,
  DollarSign,
  X
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminStatusBadge,
  AdminEmptyState,
  AdminErrorState,
} from '@/components/admin/shared';
import {
  fetchAdminDisputes,
  fetchAdminDisputeDetail,
  resolveAdminDispute,
} from '@/lib/api-admin-commerce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/lib/toast';

export default function AdminDisputesPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

  // Resolution modal state
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionOutcome, setResolutionOutcome] = useState<'ReleaseToProvider' | 'RefundToClient'>('ReleaseToProvider');
  const [resolutionReason, setResolutionReason] = useState('');

  const { data: disputes, isLoading, error } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: fetchAdminDisputes,
  });

  const { data: detail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['admin-dispute-detail', selectedMilestoneId],
    queryFn: () => (selectedMilestoneId ? fetchAdminDisputeDetail(selectedMilestoneId) : null),
    enabled: !!selectedMilestoneId,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ milestoneId, outcome, reason }: { milestoneId: string; outcome: string; reason: string }) =>
      resolveAdminDispute(milestoneId, outcome, reason),
    onSuccess: () => {
      toast.success('Dispute resolved successfully');
      setIsResolveModalOpen(false);
      setResolutionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-disputes'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dispute-detail', selectedMilestoneId] });
      queryClient.invalidateQueries({ queryKey: ['admin-commerce-metrics'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to resolve dispute');
    },
  });

  const formatCurrency = (val: number, cur = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
    }).format(val || 0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredDisputes = disputes?.filter((d) => {
    if (filter === 'open') return d.status === 'Disputed';
    if (filter === 'resolved') return d.status !== 'Disputed';
    return true;
  });

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Shared Admin Page Header */}
      <AdminPageHeader
        title="Dispute Resolution Mediation Hub"
        description="Arbitrate contested milestone deliverables, evaluate revision logs, and release or refund escrow funds."
        badge="MEDIATION"
        icon={Gavel}
        backHref="/dashboard/admin/commerce"
        backLabel="Back to Commerce Hub"
      />

      {/* Shared Error Alert */}
      {error && (
        <AdminErrorState
          title="Failed to load disputes"
          message="Unable to reach the server to fetch contested escrow milestones."
        />
      )}

      {/* Shared Filters Bar */}
      <AdminFilterBar
        hasActiveFilters={filter !== 'all'}
        onClearFilters={() => setFilter('all')}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="text-xs h-8"
            >
              All Disputes ({disputes?.length ?? 0})
            </Button>
            <Button
              variant={filter === 'open' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('open')}
              className={`text-xs h-8 ${filter === 'open' ? 'bg-amber-600 hover:bg-amber-700' : ''}`}
            >
              Open Action Required ({disputes?.filter((d) => d.status === 'Disputed').length ?? 0})
            </Button>
            <Button
              variant={filter === 'resolved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('resolved')}
              className="text-xs h-8"
            >
              Resolved Archive ({disputes?.filter((d) => d.status !== 'Disputed').length ?? 0})
            </Button>
          </div>
        }
      />

      {/* Main Grid: Left is Queue, Right is Inspector */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Disputes List */}
        <div className={`space-y-3 ${selectedMilestoneId ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          {isLoading ? (
            <div className="flex h-64 items-center justify-center rounded-xl border border-border bg-card">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : !filteredDisputes?.length ? (
            <AdminEmptyState
              title="No disputes in this queue"
              description="All milestone escrows in this view are currently in good standing or resolved."
            />
          ) : (
            filteredDisputes.map((item) => {
              const isSelected = item.milestoneId === selectedMilestoneId;
              const isOpen = item.status === 'Disputed';

              return (
                <div
                  key={item.milestoneId}
                  onClick={() => setSelectedMilestoneId(item.milestoneId)}
                  className={`cursor-pointer rounded-xl border p-4 shadow-sm transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : isOpen
                      ? 'border-amber-500/30 bg-card hover:border-amber-500/60'
                      : 'border-border bg-card hover:border-border/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{item.milestoneTitle}</span>
                        <AdminStatusBadge status={isOpen ? "disputed" : (item.outcome || item.status)} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        Engagement: {item.engagementTitle}
                      </p>
                    </div>
                    <span className="font-semibold text-foreground text-sm">
                      {formatCurrency(item.amount, item.currency)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>Client: <strong className="text-foreground">{item.clientName}</strong></span>
                      <span>Provider: <strong className="text-foreground">{item.providerName}</strong></span>
                    </div>
                    <span>{formatDate(item.disputeOpenedAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Dispute Inspector */}
        {selectedMilestoneId && (
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
              {isLoadingDetail ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="size-8 animate-spin text-primary" />
                </div>
              ) : !detail ? (
                <p className="text-muted-foreground text-center">Unable to load dispute details.</p>
              ) : (
                <>
                  {/* Header info */}
                  <div className="flex items-start justify-between border-b border-border pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-foreground">{detail.milestone.title}</h2>
                        <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                          {detail.milestone.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Escrow Amount: <strong className="text-foreground">{formatCurrency(detail.milestone.amount, detail.milestone.currency)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {detail.milestone.status === 'Disputed' && (
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => setIsResolveModalOpen(true)}
                        >
                          <Gavel className="size-4 mr-1.5" /> Resolve Dispute
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedMilestoneId(null)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Completion Criteria & Scope */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Milestone Scope & Criteria</h4>
                    <div className="rounded-lg bg-muted/40 p-3.5 text-sm text-foreground">
                      <p className="text-muted-foreground mb-1">{detail.milestone.description}</p>
                      {detail.milestone.completionCriteria && (
                        <p className="font-mono text-xs text-foreground bg-background p-2 rounded border border-border">
                          Criteria: {detail.milestone.completionCriteria}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Engagement link */}
                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-muted/20">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase font-semibold">Associated Workroom</span>
                      <p className="text-sm font-medium text-foreground">{detail.engagement.title}</p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/admin/engagements/${detail.engagement.id}`}>
                        Open Workroom <ExternalLink className="size-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>

                  {/* Deliverables Submitted */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Deliverables Submitted ({detail.deliverables.length})
                    </h4>
                    {!detail.deliverables.length ? (
                      <p className="text-xs text-muted-foreground italic">No formal deliverables were attached.</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.deliverables.map((d) => (
                          <div key={d.id} className="p-3 rounded-lg border border-border text-sm flex items-center justify-between">
                            <div>
                              <p className="font-medium text-foreground">{d.title} (v{d.version})</p>
                              <p className="text-xs text-muted-foreground">{d.description}</p>
                            </div>
                            <Badge variant="outline">{d.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Revision History */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Revision Log ({detail.revisionHistory.length})
                    </h4>
                    {!detail.revisionHistory.length ? (
                      <p className="text-xs text-muted-foreground italic">No revisions requested prior to dispute.</p>
                    ) : (
                      <div className="space-y-2">
                        {detail.revisionHistory.map((r) => (
                          <div key={r.id} className="p-3 rounded-lg border border-border/80 text-xs space-y-1">
                            <div className="flex justify-between font-medium">
                              <span>By: {r.requestedBy}</span>
                              <Badge variant="secondary" className="text-[10px]">{r.scopeClassification}</Badge>
                            </div>
                            <p className="text-muted-foreground">{r.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Resolution Dialog */}
      <Dialog open={isResolveModalOpen} onOpenChange={setIsResolveModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Gavel className="size-5 text-amber-600" />
              Arbitrate Milestone Dispute
            </DialogTitle>
            <DialogDescription>
              Select an authoritative ruling. This action will immediately adjust escrow funds and update engagement completion status.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ruling Decision
              </label>
              <Select
                value={resolutionOutcome}
                onValueChange={(val) => setResolutionOutcome(val as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ReleaseToProvider">
                    Release Funds to Provider (Mark Milestone Approved)
                  </SelectItem>
                  <SelectItem value="RefundToClient">
                    Refund Funds to Client (Return Escrow Deposit)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Mediation Ruling Rationale (Required)
              </label>
              <Textarea
                placeholder="Document the contractual basis, evidence evaluated, and reason for this ruling..."
                value={resolutionReason}
                onChange={(e) => setResolutionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResolveModalOpen(false)}
              disabled={resolveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                if (!resolutionReason.trim()) {
                  toast.error('Please enter a mediation ruling rationale.');
                  return;
                }
                if (selectedMilestoneId) {
                  resolveMutation.mutate({
                    milestoneId: selectedMilestoneId,
                    outcome: resolutionOutcome,
                    reason: resolutionReason.trim(),
                  });
                }
              }}
              disabled={resolveMutation.isPending}
            >
              {resolveMutation.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" /> Executing Ruling...
                </>
              ) : (
                'Execute Authoritative Ruling'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

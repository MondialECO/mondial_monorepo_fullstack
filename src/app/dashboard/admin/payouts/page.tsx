'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Wallet,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Loader2,
  Building,
  User,
  CreditCard,
  FileCheck
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminTable,
  AdminStatusBadge,
  AdminErrorState,
} from '@/components/admin/shared';
import {
  fetchAdminPayoutRequests,
  approveAdminPayout,
  completeAdminPayout,
  rejectAdminPayout,
  AdminPayoutRequestDto,
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

export default function AdminPayoutsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayout, setSelectedPayout] = useState<AdminPayoutRequestDto | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'complete' | 'reject' | null>(null);

  // Form fields
  const [notes, setNotes] = useState('');
  const [txRef, setTxRef] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const { data: payouts, isLoading, error } = useQuery({
    queryKey: ['admin-payouts', statusFilter],
    queryFn: () => fetchAdminPayoutRequests(statusFilter === 'all' ? undefined : statusFilter),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => approveAdminPayout(id, notes),
    onSuccess: () => {
      toast.success('Payout request approved.');
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-commerce-metrics'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to approve payout');
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, txRef, notes }: { id: string; txRef?: string; notes?: string }) =>
      completeAdminPayout(id, txRef, notes),
    onSuccess: () => {
      toast.success('Payout marked as completed.');
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-commerce-metrics'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to complete payout');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectAdminPayout(id, reason),
    onSuccess: () => {
      toast.success('Payout request rejected.');
      closeDialog();
      queryClient.invalidateQueries({ queryKey: ['admin-payouts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-commerce-metrics'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to reject payout');
    },
  });

  const closeDialog = () => {
    setActionType(null);
    setSelectedPayout(null);
    setNotes('');
    setTxRef('');
    setRejectReason('');
  };

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (st: string) => {
    switch (st.toLowerCase()) {
      case 'completed':
      case 'paid':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Paid / Completed</Badge>;
      case 'approved':
      case 'processing':
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">{st}</Badge>;
      case 'rejected':
      case 'cancelled':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">{st}</Badge>;
      case 'pending':
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Pending Review</Badge>;
      default:
        return <Badge variant="secondary">{st}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Shared Admin Page Header */}
      <AdminPageHeader
        title="Payout & Withdrawal Requests"
        description="Manage provider earnings withdrawals, bank wire authorizations, and execution status."
        badge="COMMERCE"
        icon={Wallet}
        backHref="/dashboard/admin/commerce"
        backLabel="Back to Commerce Hub"
      />

      {/* Shared Error Alert */}
      {error && (
        <AdminErrorState
          title="Failed to load payout requests"
          message="Unable to reach the server to fetch withdrawal queues."
        />
      )}

      {/* Shared Filter Bar */}
      <AdminFilterBar
        hasActiveFilters={statusFilter !== 'all'}
        onClearFilters={() => setStatusFilter('all')}
        filters={
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val)}
          >
            <SelectTrigger className="w-[180px] h-9 text-xs sm:text-sm">
              <SelectValue placeholder="All Payouts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payouts</SelectItem>
              <SelectItem value="Pending">Pending Review</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Shared Payouts Table */}
      <AdminTable
        title="Withdrawal Queue"
        description="Bank transfers and wallet withdrawals awaiting execution."
        badge={
          payouts !== undefined ? (
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold bg-card border-border/80">
              Total: <span className="ml-1 text-foreground font-bold">{payouts.length}</span>
            </Badge>
          ) : undefined
        }
        loading={isLoading}
        loadingRowsCount={5}
        empty={!payouts?.length}
        emptyTitle="No payout requests found"
        emptyDescription="No withdrawal requests found for the selected filter."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Provider</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Method / Destination</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Requested At</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(payouts || []).map((p: AdminPayoutRequestDto) => (
                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-foreground">{p.providerName}</div>
                    <div className="text-xs text-muted-foreground">{p.providerEmail}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">ID: {p.id}</div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-semibold text-foreground">
                      {formatCurrency(p.netAmount, p.currency)}
                    </div>
                    {p.feeAmount > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        Fee: {formatCurrency(p.feeAmount, p.currency)}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4 text-xs">
                    <div className="font-medium text-foreground flex items-center gap-1.5">
                      <Building className="size-3.5 text-muted-foreground" />
                      {p.payoutMethod || 'Bank Wire'}
                    </div>
                    {p.destinationDetails && (
                      <div className="text-muted-foreground truncate max-w-[200px] mt-0.5">
                        {p.destinationDetails}
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <AdminStatusBadge status={p.status} size="sm" />
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(p.requestedAt)}
                  </td>

                  <td className="px-5 py-4 text-right whitespace-nowrap space-x-1.5">
                    {p.status.toLowerCase() === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                          onClick={() => {
                            setSelectedPayout(p);
                            setActionType('approve');
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            setSelectedPayout(p);
                            setActionType('reject');
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {(p.status.toLowerCase() === 'approved' || p.status.toLowerCase() === 'processing') && (
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => {
                          setSelectedPayout(p);
                          setActionType('complete');
                        }}
                      >
                        <CheckCircle2 className="size-3.5 mr-1" /> Mark Paid
                      </Button>
                    )}

                    {p.status.toLowerCase() === 'completed' && (
                      <span className="text-xs text-emerald-600 font-medium flex items-center justify-end gap-1">
                        <CheckCircle2 className="size-3.5" /> Fulfilled
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminTable>

      {/* Action Modals */}
      {/* Approve Dialog */}
      <Dialog open={actionType === 'approve'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Payout Request</DialogTitle>
            <DialogDescription>
              Authorize withdrawal of {selectedPayout ? formatCurrency(selectedPayout.netAmount, selectedPayout.currency) : ''} for {selectedPayout?.providerName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admin Notes (Optional)</label>
            <Textarea
              placeholder="e.g. Bank details verified against KYC records..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => selectedPayout && approveMutation.mutate({ id: selectedPayout.id, notes })}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete / Mark Paid Dialog */}
      <Dialog open={actionType === 'complete'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Payout Execution</DialogTitle>
            <DialogDescription>
              Confirm that funds have been disbursed via banking wire / Stripe transfer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Transaction Reference / Wire ID
              </label>
              <Input
                placeholder="e.g. WT-994827104 or ch_3Nk..."
                value={txRef}
                onChange={(e) => setTxRef(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Execution Notes (Optional)
              </label>
              <Textarea
                placeholder="Disbursement confirmed with treasury..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => selectedPayout && completeMutation.mutate({ id: selectedPayout.id, txRef, notes })}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Mark Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionType === 'reject'} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Reject Payout Request</DialogTitle>
            <DialogDescription>
              The requested amount will be restored to the provider wallet balance.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Reason for Rejection (Required)
            </label>
            <Textarea
              placeholder="e.g. Invalid IBAN provided, please update banking information..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!rejectReason.trim()) {
                  toast.error('Please provide a rejection reason.');
                  return;
                }
                if (selectedPayout) {
                  rejectMutation.mutate({ id: selectedPayout.id, reason: rejectReason.trim() });
                }
              }}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Reject Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

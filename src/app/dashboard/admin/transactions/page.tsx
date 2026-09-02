'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Receipt,
  AlertTriangle,
  Loader2,
  Lock,
  ExternalLink
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminTable,
  AdminPagination,
  AdminStatusBadge,
  AdminErrorState,
} from '@/components/admin/shared';
import { fetchAdminTransactions } from '@/lib/api-admin-commerce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminTransactionsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-transactions', page, search, type, status],
    queryFn: () =>
      fetchAdminTransactions({
        page,
        pageSize: 20,
        search: search.trim() || undefined,
        transactionType: type === 'all' ? undefined : type,
        paymentStatus: status === 'all' ? undefined : status,
      }),
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Shared Header */}
      <AdminPageHeader
        title="Financial Transactions Ledger"
        description="Immutable read-only ledger of platform escrow deposits, milestone releases, commissions, and refunds."
        badge="AUDIT-GRADE"
        icon={Receipt}
        backHref="/dashboard/admin/commerce"
        backLabel="Back to Commerce Hub"
      />

      {/* Shared Error Alert */}
      {error && (
        <AdminErrorState
          title="Failed to load transaction ledger"
          message="Unable to reach the server to fetch financial transaction records."
          onRetry={() => refetch()}
        />
      )}

      {/* Shared Filter Toolbar */}
      <AdminFilterBar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search transaction ID, parties, idempotency key..."
        hasActiveFilters={Boolean(search.trim() || type !== 'all' || status !== 'all')}
        onClearFilters={() => {
          setSearch('');
          setType('all');
          setStatus('all');
          setPage(1);
        }}
        filters={
          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={type}
              onValueChange={(val) => {
                setType(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="EscrowDeposit">Escrow Deposit</SelectItem>
                <SelectItem value="MilestoneRelease">Milestone Release</SelectItem>
                <SelectItem value="MilestoneRefund">Milestone Refund</SelectItem>
                <SelectItem value="PlatformFee">Platform Fee</SelectItem>
                <SelectItem value="Payout">Payout</SelectItem>
                <SelectItem value="DisputeResolution">Dispute Resolution</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[160px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Succeeded">Succeeded</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Shared Ledger Table */}
      <AdminTable
        title="Audit-Grade Immutable Log"
        description="Chronological ledger of platform financial operations."
        badge={
          data?.totalCount !== undefined ? (
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold bg-card border-border/80">
              Total: <span className="ml-1 text-foreground font-bold">{data.totalCount}</span>
            </Badge>
          ) : undefined
        }
        loading={isLoading}
        loadingRowsCount={6}
        empty={!data?.items?.length}
        emptyTitle="No transactions recorded"
        emptyDescription="No transaction records match the active filter criteria."
        pagination={
          data && (data.totalPages > 1 || data.totalCount > 0) ? (
            <AdminPagination
              currentPage={data.page || page}
              totalPages={data.totalPages || 1}
              totalCount={data.totalCount}
              pageSize={data.pageSize || 20}
              onPageChange={setPage}
            />
          ) : undefined
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Transaction ID</th>
                <th className="px-5 py-3.5">Type & Status</th>
                <th className="px-5 py-3.5">Parties</th>
                <th className="px-5 py-3.5">Gross</th>
                <th className="px-5 py-3.5">Commission</th>
                <th className="px-5 py-3.5">Net</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.items?.map((tx) => (
                <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 max-w-[200px]">
                    <span className="font-mono text-xs text-foreground block truncate">
                      {tx.id}
                    </span>
                    {tx.idempotencyKey && (
                      <span className="font-mono text-[10px] text-muted-foreground block truncate">
                        Key: {tx.idempotencyKey}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-medium text-foreground text-xs">{tx.transactionType}</div>
                    <div className="mt-1">
                      <AdminStatusBadge status={tx.paymentStatus} size="sm" />
                    </div>
                  </td>

                  <td className="px-5 py-4 text-xs">
                    <div>Client: <strong className="text-foreground">{tx.clientName}</strong></div>
                    <div>Provider: <strong className="text-foreground">{tx.providerName}</strong></div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap font-medium text-foreground">
                    {formatCurrency(tx.grossAmount, tx.currency)}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-muted-foreground text-xs">
                    {formatCurrency(tx.commissionAmount, tx.currency)}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap font-semibold text-foreground">
                    {formatCurrency(tx.netAmount, tx.currency)}
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap text-xs text-muted-foreground">
                    {formatDate(tx.createdAt)}
                  </td>

                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    {tx.engagementId ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/admin/engagements/${tx.engagementId}`}>
                          Inspect <ExternalLink className="size-3.5 ml-1" />
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminTable>
    </div>
  );
}

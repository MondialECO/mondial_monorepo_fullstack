'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ShieldCheck,
  ArrowRight,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminTable,
  AdminPagination,
  AdminStatusBadge,
  AdminErrorState,
} from '@/components/admin/shared';
import { fetchAdminEscrows, AdminEscrowMilestoneItem } from '@/lib/api-admin-commerce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminEscrowsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-escrows', page, search, status],
    queryFn: () =>
      fetchAdminEscrows({
        page,
        pageSize: 15,
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
      }),
  });

  const formatCurrency = (amount: number, currency = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Shared Admin Header */}
      <AdminPageHeader
        title="Escrow & Milestone Monitoring"
        description="Track funded milestones, held escrow balances, and release readiness across all engagements."
        badge="COMMERCE"
        icon={ShieldCheck}
        backHref="/dashboard/admin/commerce"
        backLabel="Back to Commerce Hub"
      />

      {/* Shared Error State */}
      {error && (
        <AdminErrorState
          title="Failed to load escrow milestones"
          message="Unable to reach the server to fetch active escrow funds."
          onRetry={() => refetch()}
        />
      )}

      {/* Shared Filter Bar */}
      <AdminFilterBar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search by milestone title, client, or provider..."
        hasActiveFilters={Boolean(search.trim() || status !== 'all')}
        onClearFilters={() => {
          setSearch('');
          setStatus('all');
          setPage(1);
        }}
        filters={
          <div className="w-full sm:w-48">
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs sm:text-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Funded">Funded (In Escrow)</SelectItem>
                <SelectItem value="Disputed">Disputed</SelectItem>
                <SelectItem value="Released">Released</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Shared Escrows Table */}
      <AdminTable
        title="Escrow Milestone Allocations"
        description="Active held deposits and completed milestone disbursements."
        badge={
          data?.totalCount !== undefined ? (
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold bg-card border-border/80">
              Total: <span className="ml-1 text-foreground font-bold">{data.totalCount}</span>
            </Badge>
          ) : undefined
        }
        loading={isLoading}
        loadingRowsCount={5}
        empty={!data?.items || data.items.length === 0}
        emptyTitle="No escrow milestones found"
        emptyDescription="No escrow milestone records match the active criteria."
        pagination={
          data && (data.totalPages > 1 || data.totalCount > 0) ? (
            <AdminPagination
              currentPage={data.page || page}
              totalPages={data.totalPages || 1}
              totalCount={data.totalCount}
              pageSize={data.pageSize || 15}
              onPageChange={setPage}
            />
          ) : undefined
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs font-semibold uppercase text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Milestone & Engagement</th>
                <th className="px-5 py-3.5">Client / Provider</th>
                <th className="px-5 py-3.5">Escrow Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Funded Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.items?.map((item) => (
                <tr key={item.milestoneId} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-foreground">{item.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Briefcase className="size-3" />
                      ID: {item.engagementId}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-sm font-medium text-foreground">{item.clientName}</div>
                    <div className="text-xs text-muted-foreground">{item.providerName}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="font-semibold text-foreground">
                      {formatCurrency(item.amount, item.currency)}
                    </div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <AdminStatusBadge
                      status={item.hasDispute ? "disputed" : item.status}
                      size="sm"
                    />
                  </td>
                  <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">
                    {item.fundedAt ? new Date(item.fundedAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {item.hasDispute && (
                        <Button asChild size="sm" variant="destructive" className="h-8 text-xs">
                          <Link href="/dashboard/admin/disputes">
                            Mediate Dispute
                          </Link>
                        </Button>
                      )}
                      <Button asChild size="sm" variant="outline" className="h-8 text-xs flex items-center gap-1">
                        <Link href={`/dashboard/admin/engagements/${item.engagementId}`}>
                          View Engagement
                          <ArrowRight className="size-3.5 ml-1" />
                        </Link>
                      </Button>
                    </div>
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

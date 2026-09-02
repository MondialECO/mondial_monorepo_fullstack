'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Briefcase,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  ExternalLink,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { fetchAdminEngagements } from '@/lib/api-admin-commerce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AdminPageHeader,
  AdminFilterBar,
  AdminTable,
  AdminPagination,
  AdminStatusBadge,
  AdminErrorState,
} from '@/components/admin/shared';

export default function AdminEngagementsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [hasDispute, setHasDispute] = useState<string>('all');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-engagements', page, search, status, hasDispute],
    queryFn: () =>
      fetchAdminEngagements({
        page,
        pageSize: 15,
        search: search.trim() || undefined,
        status: status === 'all' ? undefined : status,
        hasDispute: hasDispute === 'all' ? undefined : hasDispute === 'true',
      }),
  });

  const formatCurrency = (val: number, cur = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Shared Header */}
      <AdminPageHeader
        title="Engagements Directory"
        description="Audit workroom contracts, milestone completion, escrow allocations, and linked accounts."
        badge="COMMERCE"
        icon={Briefcase}
        backHref="/dashboard/admin/commerce"
        backLabel="Back to Commerce Hub"
      />

      {/* Shared Error Alert */}
      {error && (
        <AdminErrorState
          title="Failed to load engagements"
          message="Unable to reach the server to fetch contract records."
          onRetry={() => refetch()}
        />
      )}

      {/* Shared Filters Bar */}
      <AdminFilterBar
        searchValue={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search by contract ID, project title..."
        hasActiveFilters={Boolean(search.trim() || status !== 'all' || hasDispute !== 'all')}
        onClearFilters={() => {
          setSearch('');
          setStatus('all');
          setHasDispute('all');
          setPage(1);
        }}
        filters={
          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="ReadyToStart">Ready to Start</SelectItem>
                <SelectItem value="MilestoneReview">Milestone Review</SelectItem>
                <SelectItem value="RevisionInProgress">Revision In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={hasDispute}
              onValueChange={(val) => {
                setHasDispute(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[150px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Dispute State" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Disputes</SelectItem>
                <SelectItem value="true">Has Dispute</SelectItem>
                <SelectItem value="false">No Dispute</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Shared Engagements Table */}
      <AdminTable
        title="Active Engagements"
        description="Contracts, escrow allocations, and delivery tracking."
        badge={
          data?.totalCount !== undefined ? (
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold bg-card border-border/80">
              Total: <span className="ml-1 text-foreground font-bold">{data.totalCount}</span>
            </Badge>
          ) : undefined
        }
        loading={isLoading}
        loadingRowsCount={5}
        empty={!data?.items?.length}
        emptyTitle="No engagements found"
        emptyDescription="Try adjusting your search query or filter selection."
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
            <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Engagement</th>
                <th className="px-5 py-3.5">Client</th>
                <th className="px-5 py-3.5">Provider</th>
                <th className="px-5 py-3.5">Value</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Progress</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.items?.map((eng) => (
                <tr key={eng.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 max-w-[240px]">
                    <div className="flex items-start gap-2">
                      <div>
                        <Link
                          href={`/dashboard/admin/engagements/${eng.id}`}
                          className="font-medium text-foreground hover:underline line-clamp-1"
                        >
                          {eng.title}
                        </Link>
                        <span className="font-mono text-xs text-muted-foreground block truncate">
                          {eng.id}
                        </span>
                      </div>
                    </div>
                    {eng.hasDispute && (
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        <ShieldAlert className="size-3" />
                        Dispute Open
                      </div>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <Link
                      href={`/dashboard/admin/users/${eng.clientId}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {eng.clientName}
                    </Link>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">{eng.clientEmail}</div>
                  </td>

                  <td className="px-5 py-4">
                    <Link
                      href={`/dashboard/admin/users/${eng.providerId}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      {eng.providerName}
                    </Link>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">{eng.providerEmail}</div>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="font-semibold text-foreground">
                      {formatCurrency(eng.contractValue, eng.currency)}
                    </span>
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <AdminStatusBadge status={eng.status} size="sm" />
                  </td>

                  <td className="px-5 py-4 whitespace-nowrap">
                    <div className="w-28 space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{Math.round(eng.completionPercentage)}%</span>
                        <span>{eng.milestonesCount} ms</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(eng.completionPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right whitespace-nowrap">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/admin/engagements/${eng.id}`}>
                        Inspect <ChevronRight className="ml-1 size-3.5" />
                      </Link>
                    </Button>
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

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bell,
  RefreshCw,
  CheckCircle2,
  Filter,
  Radio,
  Mail,
  Send,
  Eye,
  EyeOff,
} from 'lucide-react';
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
  AdminStatCard,
  AdminTable,
  AdminPagination,
  AdminStatusBadge,
  AdminErrorState,
} from '@/components/admin/shared';
import { NotificationStats, PagedNotificationLogs } from '@/types/admin-system';
import { getNotificationStats, getNotificationLogs } from '@/lib/api-admin-system';

export default function AdminNotificationsOperationsPage() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [logs, setLogs] = useState<PagedNotificationLogs | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchData = async (targetPage = page, currentType = typeFilter) => {
    try {
      setLoading(true);
      const [s, l] = await Promise.all([
        getNotificationStats(),
        getNotificationLogs({
          page: targetPage,
          pageSize: 20,
          type: currentType === 'all' ? undefined : (currentType || undefined),
        }),
      ]);
      setStats(s);
      setLogs(l);
    } catch (err: any) {
      console.error('Failed to load notification operations data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page, typeFilter);
  }, [page, typeFilter]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Shared Admin Header */}
      <AdminPageHeader
        title="Notification Operations & Dispatchers"
        description="System-level supervisory logs for in-app events, SignalR real-time broadcasts, and background email dispatchers."
        badge="OPERATIONS"
        icon={Bell}
        backHref="/dashboard/admin/system"
        backLabel="Back to System Operations"
        actions={
          <Button
            onClick={() => fetchData(page, typeFilter)}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Stats Counters */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <AdminStatCard
          label="Total In-App Stored"
          value={stats?.totalInApp ?? 0}
          icon={Bell}
        />
        <AdminStatCard
          label="Unread"
          value={stats?.unreadInApp ?? 0}
          icon={EyeOff}
          variant="warning"
        />
        <AdminStatCard
          label="Read"
          value={stats?.readInApp ?? 0}
          icon={Eye}
          variant="success"
        />
        <AdminStatCard
          label="Dispatched Today"
          value={stats?.createdToday ?? 0}
          icon={Send}
          variant="primary"
        />
      </div>

      {/* Dispatch Channels */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" /> Delivery Channels Status
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats?.channels?.map((ch) => (
            <div key={ch.channel} className="rounded-lg border border-border/70 bg-accent/20 p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground">{ch.channel}</span>
                <AdminStatusBadge status={ch.status || 'healthy'} size="sm" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{ch.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter & Notification Logs Table */}
      <AdminTable
        title="System Notification Metadata Log"
        description="Private payloads redacted to protect user confidentiality."
        badge={
          logs?.totalCount !== undefined ? (
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold bg-card border-border/80">
              Total: <span className="ml-1 text-foreground font-bold">{logs.totalCount}</span>
            </Badge>
          ) : undefined
        }
        headerActions={
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select
              value={typeFilter}
              onValueChange={(val) => {
                setTypeFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="All Notification Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Notification Types</SelectItem>
                <SelectItem value="System">System</SelectItem>
                <SelectItem value="Security">Security</SelectItem>
                <SelectItem value="Message">Message</SelectItem>
                <SelectItem value="Investment">Investment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
        loading={loading}
        loadingRowsCount={5}
        empty={!logs?.items || logs.items.length === 0}
        emptyTitle="No Notifications Found"
        emptyDescription="No notification log entries matching current criteria."
        pagination={
          logs && (logs.totalPages > 1 || logs.totalCount > 0) ? (
            <AdminPagination
              currentPage={logs.page || page}
              totalPages={logs.totalPages || 1}
              totalCount={logs.totalCount}
              pageSize={20}
              onPageChange={setPage}
            />
          ) : undefined
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3">ID</th>
                <th className="p-3">Recipient User ID</th>
                <th className="p-3">Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Status</th>
                <th className="p-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs?.items?.map((n) => (
                <tr key={n.id} className="hover:bg-muted/20">
                  <td className="p-3 font-mono text-xs text-muted-foreground">{n.id}</td>
                  <td className="p-3 font-mono text-xs text-foreground">
                    <Link
                      href={`/dashboard/admin/users/${n.userId}`}
                      className="text-primary hover:underline"
                    >
                      {n.userId}
                    </Link>
                  </td>
                  <td className="p-3 font-medium text-xs text-foreground max-w-xs truncate">
                    {n.title}
                  </td>
                  <td className="p-3 text-xs">
                    <span className="rounded bg-accent px-2 py-0.5 text-xs font-medium text-foreground">
                      {n.type || 'System'}
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    <AdminStatusBadge
                      status={n.isRead ? "completed" : "pending"}
                      variant={n.isRead ? "success" : "warning"}
                      size="sm"
                    />
                  </td>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(n.createdAt).toLocaleString()}
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

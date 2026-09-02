'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Eye,
  Calendar,
  Lock,
  X
} from 'lucide-react';
import { AdminAuditLogItem } from '@/types/admin-audit';
import { getAdminAuditLogs } from '@/lib/api-admin-audit';
import { useAuth } from '@/app/_providers/AuthProvider';
import { isSuperAdmin } from '@/lib/roles';
import {
  useSuperAdminIdentifiers,
  filterVisibleAuditLogs,
  isPrivilegedAuditActor,
} from '@/lib/audit-privilege';
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

export default function AdminAuditLogPage() {
  const { user: currentUser } = useAuth();
  const canSeePrivileged = isSuperAdmin(currentUser);
  const { superAdminIdentifiers } = useSuperAdminIdentifiers(!canSeePrivileged);

  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [actorFilter, setActorFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [successFilter, setSuccessFilter] = useState<string>('');

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogItem | null>(null);

  // Role switch safety: clear selected log on auth changes
  useEffect(() => {
    setSelectedLog(null);
  }, [currentUser?.id, canSeePrivileged]);

  // Dynamic frontend filtering: hides SuperAdmin events from Normal Admin
  const visibleLogs = useMemo(() => {
    return filterVisibleAuditLogs(logs, canSeePrivileged, superAdminIdentifiers);
  }, [logs, canSeePrivileged, superAdminIdentifiers]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getAdminAuditLogs({
        page,
        pageSize: 20,
        search: search.trim() || undefined,
        action: actionFilter.trim() || undefined,
        actor: actorFilter.trim() || undefined,
        targetType: targetTypeFilter || undefined,
        success: successFilter === 'true' ? true : successFilter === 'false' ? false : undefined,
      });
      setLogs(res.items || []);
      setTotalCount(res.totalCount || 0);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, targetTypeFilter, successFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <AdminPageHeader
        icon={FileText}
        title="Admin Audit Trail & Governance Log"
        description="Immutable, append-only security log tracing administrative decisions, moderation actions, and user escalations."
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs px-2.5 py-1 flex items-center gap-1.5">
              <Lock className="size-3.5" /> Sensitive Data Redacted
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs()}
              disabled={loading}
              className="text-xs h-8 gap-1.5 bg-background"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search action, actor, target ID..."
                className="h-9 text-xs sm:text-sm pl-9 bg-background"
              />
            </div>

            <div>
              <Input
                type="text"
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                placeholder="Filter by actor email..."
                className="h-9 text-xs sm:text-sm bg-background"
              />
            </div>

            <div>
              <select
                value={targetTypeFilter}
                onChange={(e) => { setTargetTypeFilter(e.target.value); setPage(1); }}
                className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Target Types</option>
                <option value="ServiceListing">ServiceListing</option>
                <option value="CreatorOffer">CreatorOffer</option>
                <option value="Review">Review</option>
                <option value="UserProfile">UserProfile</option>
                <option value="ContentReport">ContentReport</option>
              </select>
            </div>

            <div>
              <select
                value={successFilter}
                onChange={(e) => { setSuccessFilter(e.target.value); setPage(1); }}
                className="w-full h-9 px-3 text-xs bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Statuses</option>
                <option value="true">Success</option>
                <option value="false">Failure</option>
              </select>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <AdminTable
        title="Audit Event Records"
        description={
          <span>
            Showing <strong className="font-bold text-foreground">{visibleLogs.length}</strong> events on current page
          </span>
        }
        loading={loading}
        empty={visibleLogs.length === 0}
        emptyTitle="No audit records found"
        emptyDescription="No audit records found matching criteria."
        pagination={
          <AdminPagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={20}
            onPageChange={setPage}
            disabled={loading}
          />
        }
      >
        <table className="w-full text-left text-xs border-collapse">
          <thead className="border-b border-border/50 bg-muted/30 text-muted-foreground uppercase font-medium">
            <tr>
              <th className="px-5 py-3.5">Timestamp</th>
              <th className="px-4 py-3.5">Action</th>
              <th className="px-4 py-3.5">Actor</th>
              <th className="px-4 py-3.5">Target</th>
              <th className="px-4 py-3.5">Result</th>
              <th className="px-4 py-3.5">IP / Correlation</th>
              <th className="px-5 py-3.5 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {visibleLogs.map((log) => (
              <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-foreground font-mono text-xs">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-foreground text-xs">{log.actor}</span>
                </td>
                <td className="px-4 py-3.5 text-xs">
                  {log.targetType ? (
                    <div>
                      <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                        {log.targetType}
                      </span>
                      {log.targetId && (
                        <span className="ml-1 font-mono text-[10px] text-muted-foreground truncate max-w-[120px] inline-block align-bottom">
                          {log.targetId}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <AdminStatusBadge status={log.success ? "Success" : "Failed"} size="sm" />
                </td>
                <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">
                  {log.ipAddress || '—'}
                </td>
                <td className="px-5 py-3.5 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLog(log)}
                    className="h-7 px-2 text-xs gap-1 bg-background hover:bg-muted"
                  >
                    <Eye className="size-3 text-muted-foreground" /> View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </AdminTable>

      {/* Audit Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/40 pb-3 mb-4">
              <h3 className="font-bold text-foreground font-syne text-base">Audit Event Payload #{selectedLog.id}</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground font-medium">Action:</span>
                <span className="col-span-2 font-mono font-semibold text-foreground">{selectedLog.action}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground font-medium">Actor:</span>
                <span className="col-span-2 text-foreground">{selectedLog.actor}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground font-medium">Timestamp:</span>
                <span className="col-span-2 font-mono text-muted-foreground">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground font-medium">Result:</span>
                <span className="col-span-2">
                  <AdminStatusBadge status={selectedLog.success ? "Success" : "Failed"} size="sm" />
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground font-medium">IP Address:</span>
                <span className="col-span-2 font-mono text-muted-foreground">{selectedLog.ipAddress || '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-muted-foreground font-medium">Correlation ID:</span>
                <span className="col-span-2 font-mono text-muted-foreground break-all">{selectedLog.correlationId || '—'}</span>
              </div>

              {selectedLog.details && (
                <div className="mt-4 pt-3 border-t border-border/40">
                  <span className="text-muted-foreground font-medium block mb-1">Payload Details (Redacted):</span>
                  <pre className="p-3 bg-muted/40 rounded-lg font-mono text-[11px] overflow-x-auto text-foreground max-h-48 border border-border/40">
                    {typeof selectedLog.details === 'string'
                      ? selectedLog.details
                      : JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setSelectedLog(null)} className="text-xs">
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

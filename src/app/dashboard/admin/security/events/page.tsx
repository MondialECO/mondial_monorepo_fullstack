'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';
import { UserRole } from '@/lib/roles';
import { useSuperAdminIdentifiers } from '@/lib/audit-privilege';
import { getAdminSecurityEvents, revokeUserSessions } from '@/lib/api-admin-security';
import { AdminAuditLogItem } from '@/types/admin-audit';
import {
  Activity,
  Shield,
  RefreshCw,
  Eye,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function AdminSecurityEventsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPERADMIN || user?.roles?.includes(UserRole.SUPERADMIN);
  const { isSuperAdminIdentifier } = useSuperAdminIdentifiers();

  const [events, setEvents] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchActor, setSearchActor] = useState<string>('');

  // Safe Details Modal
  const [viewEvent, setViewEvent] = useState<AdminAuditLogItem | null>(null);

  // Revoke Session Action
  const [revokingUser, setRevokingUser] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminSecurityEvents({
        page,
        pageSize,
        type: selectedType === 'all' ? undefined : selectedType,
        actorEmail: searchActor.trim() ? searchActor.trim() : undefined,
      });

      setEvents(data.items || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.totalCount || 0);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load security events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [page, selectedType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleRevokeByEmail = async (email: string) => {
    if (!email) return;
    try {
      setRevokingUser(email);
      await revokeUserSessions(email);
      setActionSuccess(`Sessions for ${email} revoked.`);
      fetchEvents();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to revoke session.');
    } finally {
      setRevokingUser(null);
    }
  };

  // Filter out SuperAdmin security events for normal admins
  const visibleEvents = events.filter((evt) => {
    if (isSuperAdmin) return true;
    const role = evt.actorRole || evt.details?.role || evt.details?.actorRole;
    if (role === 'SuperAdmin') return false;
    const actorStr = evt.actorEmail || evt.actor;
    if (isSuperAdminIdentifier(actorStr)) return false;
    return true;
  });

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Shared Admin Header */}
      <AdminPageHeader
        title="Security Events & Audit Logs"
        description="Append-only security audit trail of authentication events, lockouts, session updates, and privilege changes."
        badge="SECURITY"
        icon={Activity}
        backHref="/dashboard/admin/security"
        backLabel="Back to Security Overview"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
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
          title="Failed to load security events"
          message={error}
          onRetry={fetchEvents}
        />
      )}

      {/* Shared Filters Bar */}
      <AdminFilterBar
        searchValue={searchActor}
        onSearchChange={setSearchActor}
        onSearchSubmit={handleSearch}
        searchPlaceholder="Filter by actor email or details..."
        hasActiveFilters={Boolean(searchActor.trim() || selectedType !== 'all')}
        onClearFilters={() => {
          setSearchActor('');
          setSelectedType('all');
          setPage(1);
        }}
        filters={
          <Select value={selectedType} onValueChange={(val) => { setSelectedType(val); setPage(1); }}>
            <SelectTrigger className="w-[190px] h-9 text-xs sm:text-sm">
              <SelectValue placeholder="All Event Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Event Types</SelectItem>
              <SelectItem value="auth_failed">Auth Failure</SelectItem>
              <SelectItem value="account_locked">Account Locked</SelectItem>
              <SelectItem value="session_revoked">Session Revoked</SelectItem>
              <SelectItem value="user_suspended">User Suspended</SelectItem>
              <SelectItem value="user_restored">User Restored</SelectItem>
              <SelectItem value="privacy_request_submitted">Privacy Request</SelectItem>
              <SelectItem value="compliance_case_created">Compliance Case</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Shared Events Table */}
      <AdminTable
        title="Security Events Log"
        description="Tamper-evident audit trail."
        badge={
          <Badge variant="outline" className="text-xs px-2.5 py-0.5 font-semibold bg-card border-border/80">
            Total: <span className="ml-1 text-foreground font-bold">{totalCount}</span>
          </Badge>
        }
        loading={loading}
        loadingRowsCount={5}
        empty={visibleEvents.length === 0}
        emptyTitle="No security events found"
        emptyDescription="No security events found matching current criteria."
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
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Action</th>
                <th className="py-3 px-4 font-medium">Actor</th>
                <th className="py-3 px-4 font-medium">Role</th>
                <th className="py-3 px-4 font-medium">IP Address</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {visibleEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(evt.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-foreground">
                    {evt.action}
                  </td>
                  <td className="py-3.5 px-4 text-foreground font-medium">
                    {evt.actorEmail || evt.actor || 'System / Anonymous'}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="outline" className="text-[10px]">
                      {evt.actorRole || evt.details?.role || evt.details?.actorRole || 'System'}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-muted-foreground">
                    {evt.ipAddress || '—'}
                  </td>
                  <td className="py-3.5 px-4">
                    <AdminStatusBadge
                      status={evt.success ? 'success' : 'failed'}
                      variant={evt.success ? 'success' : 'danger'}
                      size="sm"
                    />
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewEvent(evt)}
                      className="h-7 px-2 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" /> Safe View
                    </Button>
                    {(evt.actorEmail || evt.actor) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevokeByEmail(evt.actorEmail || evt.actor)}
                        disabled={revokingUser === (evt.actorEmail || evt.actor)}
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                      >
                        <KeyRound className="w-3 h-3 mr-1" /> Revoke
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminTable>

      {/* Safe Event Details Modal */}
      <Dialog open={!!viewEvent} onOpenChange={(open) => !open && setViewEvent(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Security Event Details
            </DialogTitle>
            <DialogDescription>
              Sanitized event metadata (raw authentication secrets and credential payloads are masked).
            </DialogDescription>
          </DialogHeader>

          {viewEvent && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/20 border border-border/40 rounded-xl">
                <div>
                  <div className="text-muted-foreground">Event Action</div>
                  <div className="font-semibold text-foreground mt-0.5">{viewEvent.action}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Timestamp</div>
                  <div className="font-mono text-foreground mt-0.5">{new Date(viewEvent.timestamp).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Actor Email</div>
                  <div className="font-medium text-foreground mt-0.5">{viewEvent.actorEmail || 'System'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">IP Address</div>
                  <div className="font-mono text-foreground mt-0.5">{viewEvent.ipAddress || 'Not recorded'}</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-muted-foreground mb-1.5 uppercase text-[11px] tracking-wider">
                  Event Metadata
                </h4>
                <div className="p-3 bg-muted/30 border border-border/30 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48">
                  {viewEvent.details ? (
                    typeof viewEvent.details === 'string' ? (
                      viewEvent.details
                    ) : (
                      JSON.stringify(viewEvent.details, null, 2)
                    )
                  ) : (
                    <span className="text-muted-foreground italic">No extra metadata payload.</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

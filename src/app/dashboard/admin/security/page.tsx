'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';
import { UserRole } from '@/lib/roles';
import { useSuperAdminIdentifiers } from '@/lib/audit-privilege';
import {
  getAdminSecuritySummary,
  getUserSecurityReview,
  revokeUserSessions,
} from '@/lib/api-admin-security';
import { AdminSecuritySummary, UserSecurityReview } from '@/types/admin-security-compliance';
import { AdminAuditLogItem } from '@/types/admin-audit';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  UserX,
  FileText,
  Scale,
  RefreshCw,
  Search,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  KeyRound,
  Shield,
  Activity,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
  AdminErrorState,
} from '@/components/admin/shared';

export default function AdminSecurityOverviewPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPERADMIN || user?.roles?.includes(UserRole.SUPERADMIN);
  const { isSuperAdminIdentifier } = useSuperAdminIdentifiers();

  const [summary, setSummary] = useState<AdminSecuritySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // User Security Review State
  const [searchUserId, setSearchUserId] = useState<string>('');
  const [searchingUser, setSearchingUser] = useState<boolean>(false);
  const [userReview, setUserReview] = useState<UserSecurityReview | null>(null);
  const [userReviewError, setUserReviewError] = useState<string | null>(null);

  // Revoke Session Modal
  const [revokeTarget, setRevokeTarget] = useState<UserSecurityReview | null>(null);
  const [revoking, setRevoking] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminSecuritySummary();
      setSummary(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load security overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUserId.trim()) return;

    try {
      setSearchingUser(true);
      setUserReviewError(null);
      setUserReview(null);
      const data = await getUserSecurityReview(searchUserId.trim());

      // If normal admin and target is superadmin, protect privacy
      if (!isSuperAdmin && data.roles?.includes('SuperAdmin')) {
        setUserReviewError('Access restricted: Insufficient privilege to inspect SuperAdmin account.');
        return;
      }

      setUserReview(data);
    } catch (err: any) {
      setUserReviewError(err?.response?.data?.message || 'User not found or lookup failed.');
    } finally {
      setSearchingUser(false);
    }
  };

  const handleRevokeSession = async () => {
    if (!revokeTarget) return;
    try {
      setRevoking(true);
      await revokeUserSessions(revokeTarget.userId);
      setActionSuccess(`All active sessions for ${revokeTarget.email} have been revoked.`);
      setRevokeTarget(null);
      // Refresh search result if active
      if (userReview?.userId === revokeTarget.userId) {
        const refreshed = await getUserSecurityReview(revokeTarget.userId);
        setUserReview(refreshed);
      }
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to revoke user sessions.');
    } finally {
      setRevoking(false);
    }
  };

  // Filter out SuperAdmin security events for normal admins
  const visibleRecentEvents = (summary?.recentSecurityEvents || []).filter((evt) => {
    if (isSuperAdmin) return true;
    const role = evt.actorRole || evt.details?.role || evt.details?.actorRole;
    if (role === 'SuperAdmin') return false;
    const actorStr = evt.actorEmail || evt.actor;
    if (isSuperAdminIdentifier(actorStr)) return false;
    return true;
  });

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <AdminPageHeader
        icon={Shield}
        title="Security & Compliance Overview"
        description="Real-time security signals, session revocation, compliance monitoring, and privacy posture."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSummary}
              disabled={loading}
              className="text-xs h-8 gap-1.5 bg-background"
            >
              <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link href="/dashboard/admin/security/events">
              <Button size="sm" className="text-xs h-8 gap-1.5">
                <Activity className="size-3.5" />
                Security Events Log
              </Button>
            </Link>
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

      {error && <AdminErrorState message={error} onRetry={fetchSummary} />}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <AdminStatCard
          label="Failed Logins (24h)"
          value={summary?.failedLoginsTodayCount ?? 0}
          icon={KeyRound}
          variant={Number(summary?.failedLoginsTodayCount ?? 0) > 0 ? "amber" : "green"}
          loading={loading}
          subtitle="Authentication failure events"
        />

        <AdminStatCard
          label="Locked / Suspended"
          value={summary?.lockedAccountsCount ?? 0}
          icon={UserX}
          variant={Number(summary?.lockedAccountsCount ?? 0) > 0 ? "red" : "gray"}
          loading={loading}
          subtitle="Accounts currently restricted"
        />

        <AdminStatCard
          label="Privacy Requests"
          value={summary?.openPrivacyRequestsCount ?? 0}
          icon={FileText}
          variant="blue"
          loading={loading}
          subtitle="Pending subject rights requests"
        />

        <AdminStatCard
          label="Compliance Cases"
          value={summary?.openComplianceCasesCount ?? 0}
          icon={Scale}
          variant={Number(summary?.openComplianceCasesCount ?? 0) > 0 ? "amber" : "green"}
          loading={loading}
          subtitle="Open compliance investigations"
        />
      </div>

      {/* Section 1: User Security Review Tool */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold font-syne flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Account Security Review & Session Reset
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Inspect authentication signals, lockout state, deletion dependencies, and revoke active sessions.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <form onSubmit={handleSearchUser} className="flex gap-2 max-w-xl">
            <Input
              placeholder="Enter User ID or User Email to review security status..."
              value={searchUserId}
              onChange={(e) => setSearchUserId(e.target.value)}
              className="h-9 text-xs sm:text-sm bg-background"
            />
            <Button type="submit" size="sm" disabled={searchingUser} className="h-9 text-xs gap-1.5 flex-shrink-0">
              <Search className="size-3.5" />
              {searchingUser ? 'Inspecting...' : 'Inspect User'}
            </Button>
          </form>

          {userReviewError && (
            <div className="bg-destructive/10 text-destructive text-xs p-3 rounded-lg border border-destructive/20">
              {userReviewError}
            </div>
          )}

          {userReview && (
            <div className="border border-border/60 rounded-xl p-4 bg-muted/20 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground text-sm font-syne">{userReview.displayName || 'User Profile'}</span>
                    <span className="text-xs font-mono text-muted-foreground">({userReview.email})</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {userReview.roles?.map((r) => (
                      <Badge key={r} variant="outline" className="text-[10px] bg-background">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/admin/users/${userReview.userId}`}>
                    <Button variant="outline" size="sm" className="text-xs h-8 gap-1.5 bg-background">
                      User Detail <ExternalLink className="size-3" />
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRevokeTarget(userReview)}
                    className="text-xs h-8 gap-1.5"
                  >
                    <UserX className="size-3.5" />
                    Revoke All Sessions
                  </Button>
                </div>
              </div>

              {/* Signals Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-background rounded-lg border border-border/40">
                  <span className="text-muted-foreground text-[11px]">Lockout State</span>
                  <div className="font-semibold text-foreground mt-0.5">
                    {userReview.isLocked ? (
                      <span className="text-rose-600 font-bold">Locked Out</span>
                    ) : (
                      <span className="text-emerald-600 font-medium">Unlocked (Normal)</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-background rounded-lg border border-border/40">
                  <span className="text-muted-foreground text-[11px]">Access Failed Count</span>
                  <div className="font-semibold text-foreground mt-0.5 font-mono">
                    {userReview.accessFailedCount} attempts
                  </div>
                </div>

                <div className="p-3 bg-background rounded-lg border border-border/40">
                  <span className="text-muted-foreground text-[11px]">KYC Verification</span>
                  <div className="font-semibold text-foreground mt-0.5">
                    <AdminStatusBadge status={userReview.kycStatus || 'Not Started'} size="sm" />
                  </div>
                </div>
              </div>

              {/* Factual Risk Signals */}
              {userReview.factualSignals && userReview.factualSignals.length > 0 && (
                <div className="border-t border-border/40 pt-3">
                  <h4 className="text-xs font-semibold text-foreground mb-1.5 font-syne">Factual Risk Signals</h4>
                  <div className="space-y-1">
                    {userReview.factualSignals.map((signal, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-md">
                        <AlertTriangle className="size-3.5 flex-shrink-0" />
                        <span>{signal}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deletion Dependency Scan */}
              {userReview.dependencyCheck && (
                <div className="border-t border-border/40 pt-3">
                  <h4 className="text-xs font-semibold text-foreground mb-2 font-syne">Deletion Pre-Condition Dependency Scan</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${userReview.dependencyCheck.activeEngagementsCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span>Engagements: <strong className="font-mono">{userReview.dependencyCheck.activeEngagementsCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${userReview.dependencyCheck.openDisputesCount > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      <span>Disputes: <strong className="font-mono">{userReview.dependencyCheck.openDisputesCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${userReview.dependencyCheck.pendingPayoutsCount > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      <span>Payouts: <strong className="font-mono">{userReview.dependencyCheck.pendingPayoutsCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-blue-500" />
                      <span>Transactions: <strong className="font-mono">{userReview.dependencyCheck.transactionCount}</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Recent Security Events Preview */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold font-syne">Recent Security Events Log</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Authentication events, lockout triggers, and administrative session resets.
              </CardDescription>
            </div>
            <Link href="/dashboard/admin/security/events" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Full Events Directory <ExternalLink className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/40 text-xs">
          {visibleRecentEvents.length > 0 ? (
            visibleRecentEvents.slice(0, 5).map((evt) => (
              <div key={evt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`size-2 rounded-full ${evt.success ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <div>
                    <span className="font-semibold text-foreground font-mono text-[11px]">{evt.action}</span>
                    <span className="ml-2 text-muted-foreground">{evt.actorEmail || evt.actor}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
                  <span>{evt.ipAddress || '—'}</span>
                  <span>{new Date(evt.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground text-xs">
              No recent security events recorded.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <FileText className="size-5" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                Privacy / GDPR
              </Badge>
            </div>
            <CardTitle className="text-base font-bold mt-4 font-syne">Privacy Requests</CardTitle>
            <CardDescription className="text-xs">
              Process Subject Access Requests (SAR), data export compilation, and account anonymization queues.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="w-full justify-between text-xs" size="sm">
              <Link href="/dashboard/admin/privacy/requests">
                Manage Privacy Queue <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Scale className="size-5" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                Compliance Cases
              </Badge>
            </div>
            <CardTitle className="text-base font-bold mt-4 font-syne">Compliance & High-Risk</CardTitle>
            <CardDescription className="text-xs">
              Manage AML, sanctions, fraud investigations, append-only admin notes, and factual risk signals.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="w-full justify-between text-xs" size="sm">
              <Link href="/dashboard/admin/compliance">
                Open Compliance Directory <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <ShieldCheck className="size-5" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                Data Inventory
              </Badge>
            </div>
            <CardTitle className="text-base font-bold mt-4 font-syne">Data Governance</CardTitle>
            <CardDescription className="text-xs">
              Review data dictionary, sensitivity classifications, retention schedules, and SuperAdmin lifecycle policies.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="w-full justify-between text-xs" size="sm">
              <Link href="/dashboard/admin/data-governance">
                View Data Governance <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Revoke Sessions Confirmation Modal */}
      <Dialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Active User Sessions</DialogTitle>
            <DialogDescription>
              This operation immediately invalidates all active JWT tokens, refresh tokens, and browser sessions for{' '}
              <strong>{revokeTarget?.email}</strong>. The user will be required to re-authenticate.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)} disabled={revoking}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRevokeSession} disabled={revoking}>
              {revoking ? 'Revoking...' : 'Confirm Revoke'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  FileText,
  AlertTriangle,
  Users,
  EyeOff,
  Scale,
  BadgeCheck,
  ArrowRight,
  RefreshCw,
  Loader2,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { AdminGovernanceSummary } from '@/types/admin-audit';
import { getAdminGovernanceSummary } from '@/lib/api-admin-audit';
import { useAuth } from '@/app/_providers/AuthProvider';
import { isSuperAdmin } from '@/lib/roles';
import {
  useSuperAdminIdentifiers,
  filterVisibleAuditLogs,
} from '@/lib/audit-privilege';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
} from '@/components/admin/shared';

export default function AdminGovernancePage() {
  const { user: currentUser } = useAuth();
  const canSeePrivileged = isSuperAdmin(currentUser);
  const { superAdminIdentifiers } = useSuperAdminIdentifiers(!canSeePrivileged);

  const [summary, setSummary] = useState<AdminGovernanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic frontend filtering: hides SuperAdmin events from Normal Admin
  const visibleRecentAuditEvents = useMemo(() => {
    return filterVisibleAuditLogs(summary?.recentAuditEvents || [], canSeePrivileged, superAdminIdentifiers);
  }, [summary?.recentAuditEvents, canSeePrivileged, superAdminIdentifiers]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await getAdminGovernanceSummary();
      setSummary(res);
    } catch (err) {
      console.error('Failed to load governance summary', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <AdminPageHeader
        icon={ShieldCheck}
        title="Platform Governance & Safety Hub"
        description="Holistic supervision of trust & safety, policy enforcement, content moderation, and operational audit trails."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSummary}
            disabled={loading}
            className="text-xs h-8 gap-1.5 bg-background"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <AdminStatCard label="Open Reports" value="..." loading variant="amber" />
          <AdminStatCard label="Investigating" value="..." loading variant="blue" />
          <AdminStatCard label="Action Taken" value="..." loading variant="purple" />
          <AdminStatCard label="Total Resolved" value="..." loading variant="green" />
        </div>
      ) : summary ? (
        <>
          {/* Section 1: Reports & Abuse Queue KPIs */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-syne">
                <ShieldAlert className="size-4 text-destructive" /> Reports & Escalations
              </h2>
              <Link
                href="/dashboard/admin/reports"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                View reports queue <ArrowRight className="size-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <AdminStatCard
                label="Open Reports"
                value={summary.openReportsCount ?? 0}
                icon={AlertTriangle}
                variant={Number(summary.openReportsCount ?? 0) > 0 ? "amber" : "gray"}
                subtitle="Awaiting triage"
              />

              <AdminStatCard
                label="Under Review"
                value={summary.underReviewReportsCount ?? 0}
                icon={Scale}
                variant="blue"
                subtitle="Active moderator review"
              />

              <AdminStatCard
                label="Total Resolved"
                value={summary.resolvedReportsCount ?? 0}
                icon={BadgeCheck}
                variant="green"
                subtitle="Completed inquiries"
              />

              <AdminStatCard
                label="Dismissed"
                value={summary.dismissedReportsCount ?? 0}
                icon={EyeOff}
                variant="gray"
                subtitle="Closed without action"
              />
            </div>
          </div>

          {/* Section 2: Moderation Interventions & Backlog */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 font-syne">
                <Users className="size-4 text-primary" /> Moderation Interventions
              </h2>
              <Link
                href="/dashboard/admin/verifications"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Open Verification Hub <ArrowRight className="size-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <AdminStatCard
                label="Pending Verifications"
                value={summary.pendingVerificationsCount ?? 0}
                icon={Users}
                variant={Number(summary.pendingVerificationsCount ?? 0) > 0 ? "amber" : "green"}
                subtitle="Identity & credentials"
              />

              <AdminStatCard
                label="Open Disputes"
                value={summary.openDisputesCount ?? 0}
                icon={Scale}
                variant={Number(summary.openDisputesCount ?? 0) > 0 ? "red" : "green"}
                subtitle="Contested transactions"
              />

              <AdminStatCard
                label="Suspended Users"
                value={summary.suspendedUsersCount ?? 0}
                icon={BadgeCheck}
                variant={Number(summary.suspendedUsersCount ?? 0) > 0 ? "red" : "gray"}
                subtitle="Restricted accounts"
              />
            </div>
          </div>

          {/* Section 3: Recent Audit Log Activity */}
          <Card className="border-border/60 shadow-sm bg-card">
            <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold font-syne flex items-center gap-2">
                  <FileText className="size-4 text-primary" /> Recent Audit Trail
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Total {summary.totalAuditEventsCount ?? 0} recorded audit events. Administrative mutations and platform enforcement actions.
                </CardDescription>
              </div>
              <Link
                href="/dashboard/admin/audit"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Full Audit Trail <ExternalLink className="size-3" />
              </Link>
            </CardHeader>

            <CardContent className="p-0 divide-y divide-border/40 text-xs">
              {visibleRecentAuditEvents && visibleRecentAuditEvents.length > 0 ? (
                visibleRecentAuditEvents.map((evt) => (
                  <div key={evt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="size-2 rounded-full bg-primary" />
                      <div>
                        <span className="font-semibold text-foreground font-mono text-[11px]">{evt.action}</span>
                        <span className="ml-2 text-muted-foreground">by {evt.actorEmail || evt.actor}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground font-mono text-[11px]">
                      <span>{evt.targetType || 'Platform'}</span>
                      <span>{new Date(evt.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground text-xs">
                  No recent audit events recorded.
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

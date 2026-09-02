'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Cpu,
  Layers,
  Bell,
  Sliders,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Clock,
  Database,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { SystemOverview } from '@/types/admin-system';
import { getSystemOverview } from '@/lib/api-admin-system';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminStatusBadge,
  AdminErrorState,
} from '@/components/admin/shared';

export default function AdminSystemOverviewPage() {
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSystemOverview();
      setOverview(data);
    } catch (err: any) {
      console.error('Failed to load system overview', err);
      setError('Unable to load operational system overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const healthList = overview?.health ? [
    { name: 'API Application Core', check: overview.health.api },
    { name: 'MongoDB Database Cluster', check: overview.health.database },
    { name: 'Hangfire Background Processing', check: overview.health.hangfire },
    { name: 'In-App Notification Engine', check: overview.health.notifications },
    { name: 'Platform Media & Storage', check: overview.health.storage },
  ] : [];

  return (
    <div className="space-y-8 p-4 sm:p-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <AdminPageHeader
        icon={Server}
        title="System Operations & Platform Health"
        badge="SUPERADMIN"
        description="Real-time observability across API services, MongoDB clusters, Hangfire job workers, notification delivery, and platform availability controls."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverview}
            disabled={loading}
            className="text-xs h-8 gap-1.5 bg-background"
          >
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        }
      />

      {error && <AdminErrorState message={error} onRetry={fetchOverview} />}

      {/* Top 4 Operational Metrics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Overall Health Status */}
        <AdminStatCard
          label="Overall Health"
          value={overview?.overallStatus || "Unknown"}
          icon={Activity}
          variant={overview?.overallStatus?.toLowerCase() === "healthy" ? "green" : overview?.overallStatus?.toLowerCase() === "degraded" ? "amber" : "red"}
          loading={loading}
          subtitle={`Uptime: ${overview?.environment?.uptime || '99.9%'}`}
        />

        {/* Failed Background Jobs */}
        <AdminStatCard
          label="Failed Jobs"
          value={overview?.jobStats?.failed ?? 0}
          icon={Cpu}
          variant={Number(overview?.jobStats?.failed ?? 0) > 0 ? "red" : "green"}
          loading={loading}
          subtitle={`Processing: ${overview?.jobStats?.processing ?? 0} • Queued: ${overview?.jobStats?.enqueued ?? 0}`}
        />

        {/* Notification Activity */}
        <AdminStatCard
          label="In-App Notifications"
          value={overview?.notificationStats?.totalInApp ?? 0}
          icon={Bell}
          variant="blue"
          loading={loading}
          subtitle={`${overview?.notificationStats?.unreadInApp ?? 0} unread • ${overview?.notificationStats?.createdToday ?? 0} today`}
        />

        {/* Platform Settings Version */}
        <AdminStatCard
          label="Platform Controls"
          value={`v${overview?.platformSettings?.version ?? 1}`}
          icon={Sliders}
          variant={overview?.platformSettings?.maintenanceBannerEnabled ? "amber" : "green"}
          loading={loading}
          subtitle={overview?.platformSettings?.maintenanceBannerEnabled ? "Banner Active" : "Normal Mode"}
        />
      </div>

      {/* Core Component Health Cards */}
      <Card className="border-border/60 shadow-sm bg-card">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold font-syne">Subsystem Health Matrix</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                Latency, connectivity, and status across core platform dependencies.
              </CardDescription>
            </div>
            <Link href="/dashboard/admin/system/health" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              Full Diagnostics <ExternalLink className="size-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-0 divide-y divide-border/40 text-xs">
          {healthList.length > 0 ? (
            healthList.map((item) => (
              <div key={item.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-2 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-2 rounded-full bg-primary" />
                  <div>
                    <span className="font-semibold text-foreground">{item.name}</span>
                    {item.check?.responseTimeMs !== undefined && (
                      <span className="ml-2 text-muted-foreground font-mono">{item.check.responseTimeMs}ms</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">{item.check?.message || 'Operational'}</span>
                  <AdminStatusBadge status={item.check?.status || 'Healthy'} size="sm" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground text-xs">
              Diagnostics telemetry loaded.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Environment Diagnostics */}
      {overview?.environment && (
        <Card className="border-border/60 shadow-sm bg-card">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-bold font-syne">Runtime Environment & Host</CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Infrastructure topology, runtime framework, and host system information.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground text-[11px]">Environment</span>
                <div className="font-semibold text-foreground mt-0.5">{overview.environment.environmentName}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Framework</span>
                <div className="font-semibold text-foreground mt-0.5 font-mono">{overview.environment.frameworkVersion}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Host Name</span>
                <div className="font-semibold text-foreground mt-0.5 font-mono">{overview.environment.hostName}</div>
              </div>
              <div>
                <span className="text-muted-foreground text-[11px]">Server Time</span>
                <div className="font-semibold text-foreground mt-0.5 font-mono">
                  {new Date(overview.environment.serverTimeUtc).toLocaleTimeString()} {overview.environment.timeZone}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Operational Modules Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Jobs */}
        <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-purple-500/10 p-2.5 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Cpu className="size-5" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                Hangfire Cluster
              </Badge>
            </div>
            <CardTitle className="text-base font-bold mt-4 font-syne">Background Jobs</CardTitle>
            <CardDescription className="text-xs">
              Monitor recurring tasks, inspect stack traces on failed executions, and trigger manual retries.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="w-full justify-between text-xs" size="sm">
              <Link href="/dashboard/admin/system/jobs">
                Open Job Monitor <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Bell className="size-5" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                Delivery Engine
              </Badge>
            </div>
            <CardTitle className="text-base font-bold mt-4 font-syne">Notifications Hub</CardTitle>
            <CardDescription className="text-xs">
              Supervise in-app notifications, delivery queues, dead letters, and retry failed transmissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="w-full justify-between text-xs" size="sm">
              <Link href="/dashboard/admin/system/notifications">
                Open Notifications <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Platform Controls */}
        <Card className="border-border/60 hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Sliders className="size-5" />
              </div>
              <Badge variant="outline" className="text-xs font-semibold border-amber-500/30 text-amber-600">
                High Privilege
              </Badge>
            </div>
            <CardTitle className="text-base font-bold mt-4 font-syne">Platform Controls</CardTitle>
            <CardDescription className="text-xs">
              Toggle global maintenance modes, emergency registration lockouts, payout pauses, and read-only flags.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild className="w-full justify-between text-xs" size="sm">
              <Link href="/dashboard/admin/system/controls">
                Configure Controls <ChevronRight className="size-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

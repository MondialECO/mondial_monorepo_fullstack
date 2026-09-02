'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Cpu,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Calendar,
  ExternalLink,
  Layers,
  Clock,
  ShieldAlert,
  Server,
  PlayCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AdminPageHeader,
  AdminStatCard,
  AdminTable,
  AdminStatusBadge,
  AdminErrorState,
} from '@/components/admin/shared';
import { HangfireStats, FailedJobItem, RecurringJobItem } from '@/types/admin-system';
import { getJobStats, getFailedJobs, getRecurringJobs, retryJob } from '@/lib/api-admin-system';

export default function AdminJobsMonitoringPage() {
  const [stats, setStats] = useState<HangfireStats | null>(null);
  const [failedJobs, setFailedJobs] = useState<FailedJobItem[]>([]);
  const [recurringJobs, setRecurringJobs] = useState<RecurringJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'failed' | 'recurring'>('failed');

  const fetchData = async () => {
    try {
      setLoading(true);
      setActionMessage(null);
      const [s, f, r] = await Promise.all([
        getJobStats(),
        getFailedJobs(1, 50),
        getRecurringJobs(),
      ]);
      setStats(s);
      setFailedJobs(f || []);
      setRecurringJobs(r || []);
    } catch (err: any) {
      console.error('Failed to load job metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetry = async (job: FailedJobItem) => {
    if (!job.canRetry) {
      setActionMessage({
        type: 'error',
        text: job.highRiskReason || 'This job is classified as high-risk and cannot be retried manually.',
      });
      return;
    }

    try {
      setRetryingId(job.jobId);
      setActionMessage(null);
      const res = await retryJob(job.jobId);
      setActionMessage({
        type: 'success',
        text: res.message || `Job ${job.jobId} successfully requeued.`,
      });
      // Refresh list
      fetchData();
    } catch (err: any) {
      console.error('Failed to retry job', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to requeue job.',
      });
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Shared Admin Header */}
      <AdminPageHeader
        title="Background Jobs & Queue Operations"
        description="Monitor asynchronous task execution, examine failed jobs with safe error traces, and supervise recurring schedules."
        badge="OPERATIONS"
        icon={Cpu}
        backHref="/dashboard/admin/system"
        backLabel="Back to System Operations"
        actions={
          <div className="flex items-center gap-2.5">
            <Button asChild variant="outline" size="sm">
              <a
                href="http://localhost:5093/hangfire"
                target="_blank"
                rel="noopener noreferrer"
              >
                Hangfire UI <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
              </a>
            </Button>
            <Button
              onClick={() => fetchData()}
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      {actionMessage && (
        <div
          className={`rounded-lg border p-4 text-sm flex items-center gap-3 ${
            actionMessage.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Hangfire Stats Counters */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <AdminStatCard
          label="Enqueued"
          value={stats?.enqueued ?? 0}
          icon={Layers}
        />
        <AdminStatCard
          label="Processing"
          value={stats?.processing ?? 0}
          icon={PlayCircle}
          variant="primary"
        />
        <AdminStatCard
          label="Scheduled"
          value={stats?.scheduled ?? 0}
          icon={Calendar}
        />
        <AdminStatCard
          label="Succeeded"
          value={stats?.succeeded ?? 0}
          icon={CheckCircle2}
          variant="success"
        />
        <AdminStatCard
          label="Failed"
          value={stats?.failed ?? 0}
          icon={XCircle}
          variant={(stats?.failed ?? 0) > 0 ? "danger" : "default"}
        />
        <AdminStatCard
          label="Workers"
          value={stats?.serversCount ?? 0}
          icon={Server}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('failed')}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 transition ${
            activeTab === 'failed'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Failed Jobs ({failedJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`pb-3 text-sm font-semibold border-b-2 px-4 transition ${
            activeTab === 'recurring'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Recurring Schedules ({recurringJobs.length})
        </button>
      </div>

      {/* Tab 1: Failed Jobs Table */}
      {activeTab === 'failed' && (
        <AdminTable
          title="Failed Job Inspection & Safe Retry"
          description="Arguments are redacted for security. Manual retries are enabled for safe background operations."
          loading={loading}
          empty={failedJobs.length === 0}
          emptyTitle="Zero Failed Jobs"
          emptyDescription="All background tasks and worker pipelines are processing normally."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">Job ID</th>
                  <th className="p-3">Type & Method</th>
                  <th className="p-3">Failed At</th>
                  <th className="p-3">Exception Summary</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {failedJobs.map((job) => (
                  <tr key={job.jobId} className="hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs font-semibold text-foreground">
                      {job.jobId}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-foreground text-xs">{job.jobType}</div>
                      <div className="text-xs text-muted-foreground font-mono">{job.method}</div>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {job.failedAt ? new Date(job.failedAt).toLocaleString() : 'Unknown'}
                    </td>
                    <td className="p-3 max-w-md">
                      <div className="text-xs font-semibold text-rose-500">{job.exceptionType}</div>
                      <div className="text-xs text-muted-foreground truncate">{job.exceptionMessage}</div>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {job.canRetry ? (
                        <button
                          onClick={() => handleRetry(job)}
                          disabled={retryingId === job.jobId}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          <RotateCcw className={`h-3.5 w-3.5 ${retryingId === job.jobId ? 'animate-spin' : ''}`} />
                          Retry
                        </button>
                      ) : (
                        <span
                          title={job.highRiskReason || 'Manual rerun disabled for high risk job.'}
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" /> High Risk
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminTable>
      )}

      {/* Tab 2: Recurring Schedules Table */}
      {activeTab === 'recurring' && (
        <AdminTable
          title="Configured Recurring Jobs"
          description="Automated CRON sweeps & maintenance jobs."
          loading={loading}
          empty={recurringJobs.length === 0}
          emptyTitle="No Recurring Schedules"
          emptyDescription="No recurring schedules are currently registered."
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">Job ID</th>
                  <th className="p-3">CRON Schedule</th>
                  <th className="p-3">Handler</th>
                  <th className="p-3">Last Run</th>
                  <th className="p-3">Next Run</th>
                  <th className="p-3">Last State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recurringJobs.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold text-xs text-foreground">{r.id}</td>
                    <td className="p-3 font-mono text-xs text-indigo-500">{r.cron}</td>
                    <td className="p-3 text-xs">
                      <div className="font-medium text-foreground">{r.jobType}</div>
                      <div className="text-muted-foreground font-mono">{r.method}</div>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {r.lastExecution ? new Date(r.lastExecution).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {r.nextExecution ? new Date(r.nextExecution).toLocaleString() : 'Scheduled'}
                    </td>
                    <td className="p-3 text-xs">
                      <AdminStatusBadge status={r.lastJobState || 'active'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AdminTable>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Cpu,
  Bell,
  HardDrive,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminErrorState,
} from '@/components/admin/shared';
import { SystemHealth } from '@/types/admin-system';
import { getSystemHealth } from '@/lib/api-admin-system';

export default function AdminSystemHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSystemHealth();
      setHealth(data);
    } catch (err: any) {
      console.error('Failed to load system health', err);
      setError('Unable to load component health metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const renderComponentCard = (
    title: string,
    icon: React.ReactNode,
    component?: { status: string; message: string; responseTimeMs?: number; details?: Record<string, unknown> }
  ) => {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                {icon}
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">{title}</h3>
                <span className="text-xs text-muted-foreground">
                  {component?.responseTimeMs ? `${component.responseTimeMs}ms response time` : 'In-process monitor'}
                </span>
              </div>
            </div>
            <AdminStatusBadge status={component?.status || 'unknown'} size="sm" />
          </div>

          <p className="mt-4 text-sm text-foreground/90 bg-accent/30 rounded-lg p-3 border border-border/50">
            {component?.message || 'Component operational with no active alerts.'}
          </p>

          {component?.details && Object.keys(component.details).length > 0 && (
            <div className="mt-4 space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
              <span className="font-semibold text-foreground">Diagnostic Parameters:</span>
              <div className="grid grid-cols-2 gap-2 mt-1">
                {Object.entries(component.details).map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1 border-b border-border/30">
                    <span className="font-mono text-muted-foreground">{k}:</span>
                    <span className="font-mono font-semibold text-foreground">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground border-t border-border pt-3">
          <Clock className="h-3.5 w-3.5" />
          <span>Last probed: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'Just now'}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-6">
      {/* Shared Admin Header */}
      <AdminPageHeader
        title="System Component Health"
        description="Granular readiness diagnostics and status for backend subsystems, databases, and background queues."
        badge="OPERATIONS"
        icon={Activity}
        backHref="/dashboard/admin/system"
        backLabel="Back to System Operations"
        actions={
          <Button
            onClick={() => fetchHealth()}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Run Diagnostics
          </Button>
        }
      />

      {/* Shared Error State */}
      {error && (
        <AdminErrorState
          title="Diagnostic Probe Failed"
          message={error}
          onRetry={fetchHealth}
        />
      )}

      {/* Component Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {renderComponentCard(
          'API Application Process',
          <Server className="h-5 w-5" />,
          health?.api
        )}

        {renderComponentCard(
          'MongoDB Database Cluster',
          <Database className="h-5 w-5" />,
          health?.database
        )}

        {renderComponentCard(
          'Hangfire Job Processing Engine',
          <Cpu className="h-5 w-5" />,
          health?.hangfire
        )}

        {renderComponentCard(
          'Notification Dispatchers (In-App & Email)',
          <Bell className="h-5 w-5" />,
          health?.notifications
        )}

        {renderComponentCard(
          'Storage & Media Services',
          <HardDrive className="h-5 w-5" />,
          health?.storage
        )}
      </div>
    </div>
  );
}

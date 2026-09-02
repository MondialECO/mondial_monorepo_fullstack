'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sliders,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Save,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Store,
  Wallet,
  Flag,
  Megaphone,
  Clock,
  RotateCcw,
  ArrowLeft,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminErrorState,
} from '@/components/admin/shared';
import { AdminPlatformSettings, UpdatePlatformSettingsPayload } from '@/types/admin-system';
import { getPlatformControls, updatePlatformControls } from '@/lib/api-admin-system';
import { useAuth } from '@/app/_providers/AuthProvider';
import { isSuperAdmin } from '@/lib/roles';
import { Button } from '@/components/ui/button';

export default function AdminPlatformControlsPage() {
  const { user } = useAuth();
  const isSuper = isSuperAdmin(user);

  const [settings, setSettings] = useState<AdminPlatformSettings | null>(null);
  const [formData, setFormData] = useState<UpdatePlatformSettingsPayload>({
    registrationEnabled: true,
    marketplacePublishingEnabled: true,
    payoutRequestsEnabled: true,
    reportsEnabled: true,
    maintenanceBannerEnabled: false,
    maintenanceBannerTitle: '',
    maintenanceBannerMessage: '',
    maintenanceBannerSeverity: 'info',
    expectedVersion: 1,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setStatusMessage(null);
      setIsForbidden(false);
      const data = await getPlatformControls();
      setSettings(data);
      setFormData({
        registrationEnabled: data.registrationEnabled,
        marketplacePublishingEnabled: data.marketplacePublishingEnabled,
        payoutRequestsEnabled: data.payoutRequestsEnabled,
        reportsEnabled: data.reportsEnabled,
        maintenanceBannerEnabled: data.maintenanceBannerEnabled,
        maintenanceBannerTitle: data.maintenanceBannerTitle || '',
        maintenanceBannerMessage: data.maintenanceBannerMessage || '',
        maintenanceBannerSeverity: data.maintenanceBannerSeverity || 'info',
        expectedVersion: data.version,
      });
    } catch (err: any) {
      console.error('Failed to load platform controls', err);
      if (err.response?.status === 403) {
        setIsForbidden(true);
      }
      setStatusMessage({ type: 'error', text: err.response?.data?.message || 'Failed to load platform control settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setStatusMessage(null);
      const updated = await updatePlatformControls(formData);
      setSettings(updated);
      setFormData((prev) => ({
        ...prev,
        expectedVersion: updated.version,
      }));
      setStatusMessage({ type: 'success', text: 'Platform controls successfully saved and enforced server-side.' });
    } catch (err: any) {
      console.error('Failed to update platform controls', err);
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update platform controls.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToNormal = () => {
    setFormData({
      registrationEnabled: true,
      marketplacePublishingEnabled: true,
      payoutRequestsEnabled: true,
      reportsEnabled: true,
      maintenanceBannerEnabled: false,
      maintenanceBannerTitle: '',
      maintenanceBannerMessage: '',
      maintenanceBannerSeverity: 'info',
      expectedVersion: settings?.version ?? 1,
    });
  };

  if (!isSuper || isForbidden) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-16 text-center">
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900 inline-block mx-auto mb-4">
          <ShieldAlert className="w-12 h-12 text-rose-600 dark:text-rose-400" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Access Restricted — SuperAdmin Only</h1>
        <p className="text-sm text-muted-foreground">
          Platform Controls and operational availability toggles are strictly restricted to SuperAdmin accounts. Normal Admin accounts cannot view or modify these settings.
        </p>
        <div className="pt-4">
          <Link href="/dashboard/admin/system">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to System Operations
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      {/* Shared Admin Header */}
      <AdminPageHeader
        title="Platform Controls & Availability Authority"
        description="Central operational switches for global registration, marketplace catalog publishing, payout request creation, and system maintenance alerts."
        badge="SUPERADMIN"
        icon={Sliders}
        backHref="/dashboard/admin/system"
        backLabel="Back to System Operations"
        actions={
          <Button
            onClick={() => fetchSettings()}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {statusMessage && (
        <div
          className={`rounded-lg border p-4 text-sm flex items-center gap-3 ${
            statusMessage.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Core Platform Availability Toggles */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-foreground text-base">Operational Feature Availability</h3>
            <p className="text-xs text-muted-foreground">
              These toggles immediately enforce server-side API responses across the platform. Existing users and active sessions are preserved.
            </p>
          </div>

          <div className="space-y-4">
            {/* Toggle 1: User Registration */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-accent/20">
              <div className="flex items-start gap-3">
                <UserPlus className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <label htmlFor="reg-toggle" className="font-semibold text-sm text-foreground cursor-pointer">
                    New User Registrations
                  </label>
                  <p className="text-xs text-muted-foreground">
                    When disabled, POST /api/auth/register returns 503 Maintenance. Existing account login remains fully operational.
                  </p>
                </div>
              </div>
              <input
                id="reg-toggle"
                type="checkbox"
                checked={formData.registrationEnabled}
                onChange={(e) => setFormData({ ...formData, registrationEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            {/* Toggle 2: Marketplace Publishing */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-accent/20">
              <div className="flex items-start gap-3">
                <Store className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <label htmlFor="market-toggle" className="font-semibold text-sm text-foreground cursor-pointer">
                    Marketplace Publishing
                  </label>
                  <p className="text-xs text-muted-foreground">
                    When disabled, creation/publishing of new service listings is blocked. Existing listings remain visible to clients.
                  </p>
                </div>
              </div>
              <input
                id="market-toggle"
                type="checkbox"
                checked={formData.marketplacePublishingEnabled}
                onChange={(e) => setFormData({ ...formData, marketplacePublishingEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            {/* Toggle 3: Payout Requests */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-accent/20">
              <div className="flex items-start gap-3">
                <Wallet className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <label htmlFor="payout-toggle" className="font-semibold text-sm text-foreground cursor-pointer">
                    New Payout Requests
                  </label>
                  <p className="text-xs text-muted-foreground">
                    When disabled, service providers cannot submit new earnings withdrawal requests. Admin payout processing remains active.
                  </p>
                </div>
              </div>
              <input
                id="payout-toggle"
                type="checkbox"
                checked={formData.payoutRequestsEnabled}
                onChange={(e) => setFormData({ ...formData, payoutRequestsEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
              />
            </div>

            {/* Toggle 4: Report Submissions */}
            <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-accent/20">
              <div className="flex items-start gap-3">
                <Flag className="h-5 w-5 text-rose-500 mt-0.5" />
                <div>
                  <label htmlFor="report-toggle" className="font-semibold text-sm text-foreground cursor-pointer">
                    User Report Submissions
                  </label>
                  <p className="text-xs text-muted-foreground">
                    When disabled, user-side abuse reporting is paused. Administrators can still review and resolve open queues.
                  </p>
                </div>
              </div>
              <input
                id="report-toggle"
                type="checkbox"
                checked={formData.reportsEnabled}
                onChange={(e) => setFormData({ ...formData, reportsEnabled: e.target.checked })}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Global Maintenance Announcement Banner */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-foreground text-base flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-amber-500" /> Maintenance & Announcement Banner
            </h3>
            <p className="text-xs text-muted-foreground">
              Broadcasts a persistent platform banner across user navigation headers. HTML is automatically sanitized.
            </p>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-lg border border-border bg-accent/20">
            <div>
              <label htmlFor="banner-toggle" className="font-semibold text-sm text-foreground cursor-pointer">
                Display Announcement Banner
              </label>
              <p className="text-xs text-muted-foreground">Make this maintenance announcement visible across the web application.</p>
            </div>
            <input
              id="banner-toggle"
              type="checkbox"
              checked={formData.maintenanceBannerEnabled}
              onChange={(e) => setFormData({ ...formData, maintenanceBannerEnabled: e.target.checked })}
              className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
            />
          </div>

          {formData.maintenanceBannerEnabled && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Banner Title</label>
                <input
                  type="text"
                  maxLength={200}
                  value={formData.maintenanceBannerTitle}
                  onChange={(e) => setFormData({ ...formData, maintenanceBannerTitle: e.target.value })}
                  placeholder="e.g. Scheduled Infrastructure Maintenance"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Banner Message</label>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={formData.maintenanceBannerMessage}
                  onChange={(e) => setFormData({ ...formData, maintenanceBannerMessage: e.target.value })}
                  placeholder="e.g. We are performing scheduled database maintenance from 02:00 to 04:00 UTC. Some features may be briefly unavailable."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Banner Severity</label>
                <select
                  value={formData.maintenanceBannerSeverity}
                  onChange={(e) => setFormData({ ...formData, maintenanceBannerSeverity: e.target.value as any })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="info">Informational (Blue)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="alert">Critical / Outage (Red)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          <button
            type="button"
            onClick={handleResetToNormal}
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-accent transition"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset to Normal Defaults
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Version: {settings?.version ?? 1}</span>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save & Enforce Controls'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/_providers/AuthProvider';
import { UserRole } from '@/lib/roles';
import {
  getDataGovernanceInventory,
  getDataRetentionSettings,
  updateDataRetentionSettings,
} from '@/lib/api-admin-security';
import {
  DataGovernanceInventoryItem,
  DataRetentionPolicy,
} from '@/types/admin-security-compliance';
import {
  Database,
  ShieldCheck,
  Lock,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Settings,
  Clock,
  Shield,
  FileText,
  AlertCircle,
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminTable,
  AdminStatusBadge,
  AdminErrorState,
} from '@/components/admin/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AdminDataGovernancePage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SUPERADMIN || user?.roles?.includes(UserRole.SUPERADMIN);

  const [inventory, setInventory] = useState<DataGovernanceInventoryItem[]>([]);
  const [policies, setPolicies] = useState<DataRetentionPolicy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Inventory is accessible to both Admin and SuperAdmin
      const invData = await getDataGovernanceInventory();
      setInventory(invData || []);

      // If SuperAdmin, also load retention policy settings
      if (isSuperAdmin) {
        try {
          const policyData = await getDataRetentionSettings();
          setPolicies(policyData || []);
        } catch {
          // If retention settings fail or 403, proceed gracefully
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load data governance inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isSuperAdmin]);

  const handlePolicyChange = (category: string, field: keyof DataRetentionPolicy, value: any) => {
    setPolicies((prev) =>
      prev.map((p) => (p.dataCategory === category ? { ...p, [field]: value } : p))
    );
  };

  const handleSavePolicies = async () => {
    if (!isSuperAdmin) return;
    try {
      setSaving(true);
      setError(null);
      setActionSuccess(null);
      const updated = await updateDataRetentionSettings({ policies });
      setPolicies(updated);
      setActionSuccess('Data retention policies successfully saved.');
      // Refresh inventory to show updated retention rules
      const refreshedInv = await getDataGovernanceInventory();
      setInventory(refreshedInv || []);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setError('Concurrency conflict: The retention settings were updated by another administrator. Please refresh and re-apply.');
      } else {
        setError(err?.response?.data?.message || 'Failed to save retention policies.');
      }
    } finally {
      setSaving(false);
    }
  };

  const getSensitivityBadge = (sensitivity: string) => {
    switch (sensitivity) {
      case 'High':
      case 'Confidential':
        return <Badge variant="destructive" className="text-[10px]">{sensitivity}</Badge>;
      case 'Internal':
        return <Badge variant="secondary" className="text-[10px]">{sensitivity}</Badge>;
      case 'Public':
        return <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/20">{sensitivity}</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{sensitivity}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Shared Admin Header */}
      <AdminPageHeader
        title="Data Governance & Retention"
        description="Platform data dictionary, storage authority mapping, sensitivity classification, and retention rules."
        badge="DATA GOVERNANCE"
        icon={Database}
        backHref="/dashboard/admin/security"
        backLabel="Back to Security Overview"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
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
          title="Failed to load governance data"
          message={error}
          onRetry={fetchData}
        />
      )}

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Layers className="w-4 h-4" /> Data Inventory ({inventory.length})
          </TabsTrigger>
          <TabsTrigger value="retention" className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> Retention Policies {isSuperAdmin ? '(Configurable)' : '(Read-Only)'}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Data Inventory */}
        <TabsContent value="inventory" className="space-y-4">
          <AdminTable
            title="Platform Data Dictionary & Storage Inventory"
            description="Comprehensive inventory of platform database collections, sensitivity ratings, and deletion strategies."
            loading={loading}
            empty={inventory.length === 0}
            emptyTitle="No data inventory items found"
            emptyDescription="No data categories or collections currently registered."
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20 text-muted-foreground">
                    <th className="py-3.5 px-4 font-medium">Data Category</th>
                    <th className="py-3.5 px-4 font-medium">Storage Authority</th>
                    <th className="py-3.5 px-4 font-medium">Sensitivity</th>
                    <th className="py-3.5 px-4 font-medium">Retention Policy</th>
                    <th className="py-3.5 px-4 font-medium">Deletion Strategy</th>
                    <th className="py-3.5 px-4 font-medium">Access Authority</th>
                    <th className="py-3.5 px-4 font-medium text-right">Est. Records</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {inventory.map((item) => (
                    <tr key={item.dataCategory} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {item.dataCategory}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground">
                        {item.storageAuthority}
                      </td>
                      <td className="py-3.5 px-4">
                        {getSensitivityBadge(item.dataSensitivity)}
                      </td>
                      <td className="py-3.5 px-4 text-foreground">
                        {item.retentionPolicy}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="outline" className="text-[10px]">
                          {item.deletionStrategy}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="secondary" className="text-[10px]">
                          {item.accessAuthority}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-foreground">
                        {item.estimatedRecordsCount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminTable>
        </TabsContent>

        {/* Tab 2: Retention Policies */}
        <TabsContent value="retention" className="space-y-4">
          {!isSuperAdmin && (
            <div className="p-4 bg-muted/40 border border-border/50 rounded-xl flex items-center gap-3 text-xs text-muted-foreground">
              <Lock className="w-4 h-4 text-primary flex-shrink-0" />
              <span>
                <strong>SuperAdmin Authority Required:</strong> Retention policy changes alter global platform data lifetimes and require SuperAdmin privileges. The table below reflects active configurations in read-only mode.
              </span>
            </div>
          )}

          <AdminTable
            title="Data Retention Policy Configuration"
            description="Configure automated retention durations, post-retention actions (Review, Anonymize, HardDelete), and active toggles."
            headerActions={
              isSuperAdmin ? (
                <Button size="sm" onClick={handleSavePolicies} disabled={saving} className="flex items-center gap-2">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Retention Policies
                </Button>
              ) : undefined
            }
            loading={loading}
            empty={policies.length === 0}
            emptyTitle="No retention policies configured"
            emptyDescription={isSuperAdmin ? 'No retention policies currently configured.' : 'Retention policies managed by SuperAdmin.'}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20 text-muted-foreground">
                    <th className="py-3.5 px-4 font-medium">Category</th>
                    <th className="py-3.5 px-4 font-medium">Retention (Days)</th>
                    <th className="py-3.5 px-4 font-medium">Action After Retention</th>
                    <th className="py-3.5 px-4 font-medium">Sensitivity</th>
                    <th className="py-3.5 px-4 font-medium">Status</th>
                    <th className="py-3.5 px-4 font-medium">Last Modified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {policies.map((pol) => (
                    <tr key={pol.dataCategory} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-foreground">
                        {pol.dataCategory}
                      </td>
                      <td className="py-3.5 px-4">
                        {isSuperAdmin ? (
                          <Input
                            type="number"
                            min={1}
                            max={3650}
                            placeholder="Indefinite"
                            value={pol.retentionDays ?? ''}
                            onChange={(e) =>
                              handlePolicyChange(
                                pol.dataCategory,
                                'retentionDays',
                                e.target.value ? parseInt(e.target.value, 10) : null
                              )
                            }
                            className="h-8 w-28 text-xs font-mono"
                          />
                        ) : (
                          <span className="font-mono text-foreground">
                            {pol.retentionDays ? `${pol.retentionDays} days` : 'Indefinite'}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isSuperAdmin ? (
                          <Select
                            value={pol.actionAfterRetention}
                            onValueChange={(val) =>
                              handlePolicyChange(pol.dataCategory, 'actionAfterRetention', val)
                            }
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ReviewOnly">Review Only</SelectItem>
                              <SelectItem value="Anonymize">Anonymize</SelectItem>
                              <SelectItem value="HardDelete">Hard Delete</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {pol.actionAfterRetention}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {getSensitivityBadge(pol.dataSensitivity)}
                      </td>
                      <td className="py-3.5 px-4">
                        <AdminStatusBadge status={pol.enabled ? 'active' : 'inactive'} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 font-mono text-muted-foreground whitespace-nowrap">
                        {pol.updatedAt ? new Date(pol.updatedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminTable>
        </TabsContent>
      </Tabs>
    </div>
  );
}

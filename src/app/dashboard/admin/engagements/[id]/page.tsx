'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Briefcase,
  User,
  ShieldCheck,
  Calendar,
  DollarSign,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronLeft,
  Loader2,
  FileText,
  Gavel,
  Receipt,
  DownloadCloud,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import {
  AdminPageHeader,
  AdminStatusBadge,
  AdminErrorState,
} from '@/components/admin/shared';
import { fetchAdminEngagementDetail } from '@/lib/api-admin-commerce';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminEngagementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: eng, isLoading, error } = useQuery({
    queryKey: ['admin-engagement-detail', id],
    queryFn: () => fetchAdminEngagementDetail(id),
  });

  const formatCurrency = (val: number, cur = 'EUR') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
    }).format(val || 0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center p-6">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading engagement details...</p>
        </div>
      </div>
    );
  }

  if (error || !eng) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <AdminErrorState
          title="Engagement Not Found"
          message={error instanceof Error ? error.message : 'The requested engagement does not exist.'}
        />
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/admin/engagements">
            <ChevronLeft className="size-4 mr-1" /> Back to Engagements
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      {/* Shared Admin Page Header */}
      <AdminPageHeader
        title={eng.title}
        description={eng.description || 'No description provided.'}
        badge={
          <div className="flex items-center gap-2">
            <AdminStatusBadge status={eng.status} size="sm" />
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold px-2.5 py-0.5">
              {formatCurrency(eng.contractValue, eng.currency)}
            </Badge>
          </div>
        }
        icon={Briefcase}
        backHref="/dashboard/admin/engagements"
        backLabel="Back to Engagements"
      />

      {/* Parties Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Client Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <User className="size-4 text-blue-500" />
              Client Identity
            </div>
            <Badge variant="secondary" className="text-xs">
              KYC: {eng.client.kycStatus}
            </Badge>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground">{eng.client.name}</h3>
            <p className="text-sm text-muted-foreground">{eng.client.email}</p>
            <p className="text-xs font-mono text-muted-foreground mt-1">ID: {eng.client.id}</p>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
            {eng.client.roles.map((r) => (
              <Badge key={r} variant="outline" className="text-[11px]">
                {r}
              </Badge>
            ))}
            {eng.client.phoneNumber && (
              <span className="text-xs text-muted-foreground ml-auto">
                Phone: {eng.client.phoneNumber}
              </span>
            )}
          </div>
        </div>

        {/* Provider Card */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldCheck className="size-4 text-emerald-500" />
              Service Provider Identity
            </div>
            <Badge variant="secondary" className="text-xs">
              KYC: {eng.provider.kycStatus}
            </Badge>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-foreground">{eng.provider.name}</h3>
            <p className="text-sm text-muted-foreground">{eng.provider.email}</p>
            <p className="text-xs font-mono text-muted-foreground mt-1">ID: {eng.provider.id}</p>
          </div>

          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
            {eng.provider.roles.map((r) => (
              <Badge key={r} variant="outline" className="text-[11px]">
                {r}
              </Badge>
            ))}
            {eng.provider.phoneNumber && (
              <span className="text-xs text-muted-foreground ml-auto">
                Phone: {eng.provider.phoneNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contract & Progress Meta */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contract Details</span>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contract ID:</span>
              <span className="font-mono text-xs truncate max-w-[150px]">{eng.contractId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pricing Model:</span>
              <span className="font-medium text-foreground">{eng.contract?.pricingType || 'Fixed'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Window:</span>
              <span className="font-medium text-foreground">
                {eng.contract?.deliveryTimeValue} {eng.contract?.deliveryTimeUnit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Included Revisions:</span>
              <span className="font-medium text-foreground">
                {eng.contract?.unlimitedRevisions ? 'Unlimited' : eng.contract?.includedRevisionCount ?? 1}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline & Dates</span>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="text-foreground">{formatDate(eng.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Started:</span>
              <span className="text-foreground">{formatDate(eng.startDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expected End:</span>
              <span className="text-foreground">{formatDate(eng.expectedEndDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Actual End:</span>
              <span className="text-foreground">{formatDate(eng.actualEndDate)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Completion</span>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold text-foreground">{Math.round(eng.completionPercentage)}%</span>
            <span className="text-xs text-muted-foreground">{eng.milestones.length} Milestones</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${Math.min(eng.completionPercentage, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Escrow: {eng.escrowStatus}</span>
            <span>{eng.milestones.filter(m => m.status === 'Approved').length} Approved</span>
          </div>
        </div>
      </div>

      {/* Tabs: Milestones, Deliverables, Transactions, Files */}
      <Tabs defaultValue="milestones" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="milestones">Milestones ({eng.milestones.length})</TabsTrigger>
          <TabsTrigger value="deliverables">Deliverables ({eng.deliverables.length})</TabsTrigger>
          <TabsTrigger value="transactions">Ledger Transactions ({eng.transactions.length})</TabsTrigger>
          <TabsTrigger value="files">Files ({eng.files.length})</TabsTrigger>
        </TabsList>

        {/* Milestones Content */}
        <TabsContent value="milestones" className="space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5">#</th>
                    <th className="px-5 py-3.5">Milestone</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Escrow</th>
                    <th className="px-5 py-3.5">Due Date</th>
                    <th className="px-5 py-3.5">Revisions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {eng.milestones.map((m) => (
                    <tr key={m.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{m.displayOrder}</td>
                      <td className="px-5 py-4 max-w-sm">
                        <div className="font-medium text-foreground">{m.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{m.description}</div>
                        {m.disputeOpenedAt && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            <ShieldAlert className="size-3" />
                            Disputed on {formatDate(m.disputeOpenedAt)}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-semibold text-foreground">
                        {formatCurrency(m.amount, m.currency)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge variant="outline">{m.status}</Badge>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Badge variant="secondary">{m.escrowStatus}</Badge>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(m.dueDate)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs">
                        {m.unlimitedRevisions ? 'Unlimited' : `${m.usedRevisionCount} / ${m.includedRevisionCount}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* Deliverables Content */}
        <TabsContent value="deliverables" className="space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {!eng.deliverables.length ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No deliverables submitted yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3.5">Deliverable</th>
                      <th className="px-5 py-3.5">Version</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Submitted</th>
                      <th className="px-5 py-3.5">Files / Links</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {eng.deliverables.map((d) => (
                      <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-medium text-foreground">{d.title}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">{d.description}</div>
                        </td>
                        <td className="px-5 py-4 font-mono text-xs">v{d.version}</td>
                        <td className="px-5 py-4">
                          <Badge variant="outline">{d.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(d.submittedAt)}</td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">
                          {d.filesCount} file(s), {d.linksCount} link(s)
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Transactions Content */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {!eng.transactions.length ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No financial transactions recorded for this engagement.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3.5">Transaction ID</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Gross</th>
                      <th className="px-5 py-3.5">Fee</th>
                      <th className="px-5 py-3.5">Net</th>
                      <th className="px-5 py-3.5">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {eng.transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4 font-mono text-xs text-muted-foreground">{t.id}</td>
                        <td className="px-5 py-4 font-medium text-foreground">{t.transactionType}</td>
                        <td className="px-5 py-4">
                          <Badge variant="secondary">{t.paymentStatus}</Badge>
                        </td>
                        <td className="px-5 py-4 font-medium text-foreground">{formatCurrency(t.grossAmount, t.currency)}</td>
                        <td className="px-5 py-4 text-muted-foreground">{formatCurrency(t.commissionAmount, t.currency)}</td>
                        <td className="px-5 py-4 font-semibold text-foreground">{formatCurrency(t.netAmount, t.currency)}</td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(t.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Files Content */}
        <TabsContent value="files" className="space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {!eng.files.length ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No files uploaded in workroom.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3.5">File Name</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Size</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Uploaded</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {eng.files.map((f) => (
                      <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-4 font-medium text-foreground flex items-center gap-2">
                          <FileText className="size-4 text-muted-foreground" />
                          {f.originalName}
                        </td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{f.contentType}</td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{(f.sizeBytes / 1024).toFixed(1)} KB</td>
                        <td className="px-5 py-4"><Badge variant="outline">{f.status}</Badge></td>
                        <td className="px-5 py-4 text-xs text-muted-foreground">{formatDate(f.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

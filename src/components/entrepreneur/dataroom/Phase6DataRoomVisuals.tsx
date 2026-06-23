'use client';

import { useEffect, useState } from 'react';
import { FileText, Eye, Download, ShieldCheck } from 'lucide-react';
import entrepreneurApi, {
  type DataRoomStatusResponse,
  type DataRoomAnalyticsResponse,
  type DataRoomDocumentResponse,
} from '@/lib/api-entrepreneur';
import { SectionCard, MetricCard, StatusRing, Chip, UnavailableValue, type Tone } from '@/components/entrepreneur/phase3/FinancialWidgets';

const mb = (bytes: number) => `${(((bytes || 0) / 1048576)).toFixed(1)} MB`;
const intl = (n: number) => new Intl.NumberFormat('en-IE').format(n || 0);
const dateFmt = (s?: string) => (s ? new Date(s).toLocaleDateString() : '—');

function Skeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading data room…</span>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-border bg-muted/40" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-border bg-muted/40" />
    </div>
  );
}

export function Phase6DataRoomVisuals() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<DataRoomStatusResponse | null>(null);
  const [analytics, setAnalytics] = useState<DataRoomAnalyticsResponse | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prog = await entrepreneurApi.getCurrentPhase();
        const id = prog.companyId;
        if (!id) {
          if (!cancelled) setLoading(false);
          return;
        }
        const [st, an] = await Promise.allSettled([
          entrepreneurApi.getDataRoom(id),
          entrepreneurApi.getDataRoomAnalytics(id),
        ]);
        if (cancelled) return;
        if (st.status === 'fulfilled') setStatus(st.value);
        if (an.status === 'fulfilled') setAnalytics(an.value);
      } catch {
        if (!cancelled) setError('Could not load the data room.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <Skeleton />;

  const docs = status?.documents ?? [];
  const grants = status?.accessGrants ?? [];
  const published = docs.filter((d) => d.status === 'published').length;
  const publishedPct = docs.length > 0 ? Math.round((published / docs.length) * 100) : null;
  const totalSize = docs.reduce((s, d) => s + (d.fileSize || 0), 0);

  const byCategory = docs.reduce<Record<string, DataRoomDocumentResponse[]>>((acc, d) => {
    const key = d.category || 'other';
    (acc[key] ??= []).push(d);
    return acc;
  }, {});
  const categories = Object.keys(byCategory).sort();

  const statusTone = (s: string): Tone => (s === 'published' ? 'success' : 'muted');

  return (
    <div className="space-y-4 md:space-y-6">
      {error && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Documents" value={docs.length > 0 ? intl(docs.length) : undefined} unavailable={docs.length > 0 ? undefined : 'unavailable'} chip={docs.length ? `${published} published` : undefined} chipTone="success" />
        <MetricCard label="Total file size" value={docs.length > 0 ? mb(totalSize) : undefined} unavailable={docs.length > 0 ? undefined : 'unavailable'} />
        <MetricCard label="Access grants" value={grants.length > 0 ? intl(grants.length) : undefined} unavailable={grants.length > 0 ? undefined : 'unavailable'} chip={status?.ndaRequired ? 'NDA required' : undefined} chipTone="primary" />
        <MetricCard label="Total views" value={analytics ? intl(analytics.totalViews) : undefined} unavailable={analytics ? undefined : 'unavailable'} chip={analytics ? `${intl(analytics.totalDownloads)} downloads` : undefined} chipTone="muted" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        {/* Readiness ring (real published ratio) + access control */}
        <div className="space-y-4">
          <StatusRing percent={publishedPct} label="Documents published" sublabel={docs.length ? `${published} of ${docs.length}` : undefined} />
          <SectionCard title="Access control">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between gap-2">
                <span className="text-foreground">NDA required</span>
                <Chip tone={status?.ndaRequired ? 'success' : 'muted'}>{status?.ndaRequired ? 'On' : 'Off'}</Chip>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-foreground">Email alerts</span>
                <UnavailableValue kind="config" />
              </li>
              <li className="flex items-center justify-between gap-2">
                <span className="text-foreground">Access expiry</span>
                <UnavailableValue kind="config" />
              </li>
            </ul>
          </SectionCard>
        </div>

        {/* Documents by category (accessible native accordion) */}
        <SectionCard title="All documents" subtitle={docs.length ? `${docs.length} files in ${categories.length} categories` : 'No documents uploaded yet'}>
          {docs.length === 0 ? (
            <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
              <span className="text-sm italic text-muted-foreground">No documents uploaded yet.</span>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <details key={cat} className="rounded-xl border border-border bg-background" open>
                  <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold capitalize text-foreground marker:hidden">
                    {cat} <span className="text-muted-foreground">({byCategory[cat].length})</span>
                  </summary>
                  <ul className="divide-y divide-border/60 border-t border-border">
                    {byCategory[cat].map((d) => (
                      <li key={d.documentId} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                        <span className="flex items-center gap-2 text-sm text-foreground">
                          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                          {d.title || d.fileName}
                          <span className="text-xs text-muted-foreground">· {mb(d.fileSize)}</span>
                        </span>
                        <span className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden />{d.viewCount}</span>
                          <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" aria-hidden />{d.downloadCount}</span>
                          <Chip tone={statusTone(d.status)}>{d.status}</Chip>
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Manage access */}
      <SectionCard title="Manage access" headerRight={<span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" aria-hidden /> investors</span>}>
        {grants.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20">
            <span className="text-sm italic text-muted-foreground">No investor access granted yet.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">Investor access grants</caption>
              <thead>
                <tr className="border-b border-border text-left">
                  {['Investor', 'Access level', 'Granted', 'Expires'].map((c) => (
                    <th key={c} scope="col" className="py-2 pr-4 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grants.map((g) => (
                  <tr key={g.investorId} className="border-b border-border/60 last:border-0">
                    <th scope="row" className="py-2.5 pr-4 text-left font-medium text-foreground">{g.investorName || g.investorId}</th>
                    <td className="py-2.5 pr-4"><Chip tone="muted">{g.accessLevel}</Chip></td>
                    <td className="py-2.5 pr-4 text-muted-foreground">{dateFmt(g.grantedAt)}</td>
                    <td className="py-2.5 text-muted-foreground">{dateFmt(g.expiresAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default Phase6DataRoomVisuals;

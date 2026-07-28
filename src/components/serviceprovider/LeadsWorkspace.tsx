'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Bookmark, BriefcaseBusiness, Clock, FileText, MapPin, Search, Send, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateProposal, useDuplicateProposal, useLeadBrief, useLeadInbox, useProposals,
  useReviewOrderRequest, useSubmitProposal, useUpdateLeadInteraction, useWithdrawProposal,
} from '@/hooks/queries/leads';
import type { ClientBrief, Proposal, UpsertProposalRequest } from '@/types/leads';

type View = { mode: 'home' } | { mode: 'brief'; id: string } | { mode: 'proposal'; brief: ClientBrief };
type LeadTab = 'leads' | 'proposals' | 'saved';

export function LeadsWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = leadTab(searchParams.get('view'));
  const briefId = searchParams.get('brief');

  function setTab(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', leadTab(next));
    params.delete('brief');
    router.replace(`${pathname}?${params.toString()}`);
  }

  return <LeadsWorkspaceView key={`${tab}-${briefId ?? ''}`} tab={tab} initialBriefId={briefId} onTabChange={setTab} />;
}

function LeadsWorkspaceView({ tab, initialBriefId, onTabChange }: { tab: LeadTab; initialBriefId: string | null; onTabChange: (tab: string) => void }) {
  const [view, setView] = useState<View>(initialBriefId ? { mode: 'brief', id: initialBriefId } : { mode: 'home' });
  if (view.mode === 'brief') return <BriefDetail id={view.id} onBack={() => setView({ mode: 'home' })} onPropose={(brief) => setView({ mode: 'proposal', brief })} />;
  if (view.mode === 'proposal') return <ProposalEditor brief={view.brief} onBack={() => setView({ mode: 'brief', id: view.brief.id })} onDone={() => setView({ mode: 'home' })} />;
  return <LeadHome tab={tab} onTabChange={onTabChange} onOpen={(id) => setView({ mode: 'brief', id })} />;
}

function LeadHome({ tab, onTabChange, onOpen }: { tab: LeadTab; onTabChange: (tab: string) => void; onOpen: (id: string) => void }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">Leads</h1>
        <p className="text-sm text-muted-foreground">Review client briefs, prepare proposals, and track client decisions.</p>
      </div>
      <Tabs defaultValue="leads" value={tab} onValueChange={onTabChange}>
        <TabsList>
          <TabsTrigger value="leads">Client Briefs</TabsTrigger>
          <TabsTrigger value="proposals">Pipeline</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>
        <TabsContent value="leads">
          <InboxToolbar search={search} setSearch={setSearch} sort={sort} setSort={setSort} />
          <LeadList search={search} sort={sort} savedOnly={false} onOpen={onOpen} />
        </TabsContent>
        <TabsContent value="proposals"><ProposalPipeline /></TabsContent>
        <TabsContent value="saved"><LeadList search="" sort="newest" savedOnly onOpen={onOpen} /></TabsContent>
      </Tabs>
    </div>
  );
}

function leadTab(value: string | null): LeadTab {
  return value === 'proposals' || value === 'saved' ? value : 'leads';
}

function InboxToolbar({ search, setSearch, sort, setSort }: { search: string; setSearch: (v: string) => void; sort: string; setSort: (v: string) => void }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search skills, industries, or titles" className="pl-9" /></div>
      <select aria-label="Sort opportunities" value={sort} onChange={(e) => setSort(e.target.value)} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground">
        <option value="newest">Newest</option><option value="highestbudget">Highest budget</option><option value="closestdeadline">Closest deadline</option><option value="bestmatch">Best skill match</option><option value="previouslyviewed">Previously viewed</option>
      </select>
    </div>
  );
}

function LeadList({ search, sort, savedOnly, onOpen }: { search: string; sort: string; savedOnly: boolean; onOpen: (id: string) => void }) {
  const { data, isLoading, isError } = useLeadInbox({ sort, savedOnly });
  const interaction = useUpdateLeadInteraction();
  const rows = useMemo(() => (data ?? []).filter((b) => [b.title, b.description, ...b.requiredSkills, ...b.industries].join(' ').toLowerCase().includes(search.toLowerCase())), [data, search]);
  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (isError) return <p className="text-sm text-destructive">Couldn&apos;t load opportunities. Try again.</p>;
  if (rows.length === 0) return savedOnly ? <EmptyState icon={Bookmark} title="No Saved Client Briefs" description="Save relevant client briefs to review them later." /> : <EmptyState icon={BriefcaseBusiness} title="No New Client Briefs" description="New client briefs matching your professional profile will appear here." action={<Button asChild variant="outline"><Link href="/dashboard/serviceprovider/services">Review Service Preferences</Link></Button>} />;
  return <div className="grid gap-3">{rows.map((brief) => <LeadCard key={brief.id} brief={brief} onOpen={() => onOpen(brief.id)} onSave={() => interaction.mutate({ id: brief.id, saved: !brief.saved })} onDismiss={() => interaction.mutate({ id: brief.id, dismissed: true })} />)}</div>;
}

function LeadCard({ brief, onOpen, onSave, onDismiss }: { brief: ClientBrief; onOpen: () => void; onSave: () => void; onDismiss: () => void }) {
  return (
    <Card><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-lg">{brief.title}</CardTitle><CardDescription>{brief.serviceCategory} · {brief.source}</CardDescription></div><Badge variant="secondary">{Math.round(brief.matchScore * 100)}% match</Badge></div></CardHeader>
      <CardContent className="space-y-3"><p className="line-clamp-2 text-sm text-muted-foreground">{brief.description}</p><div className="flex flex-wrap gap-2">{brief.requiredSkills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</div>
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><span>{money(brief.budgetMinimum, brief.currency)}–{money(brief.budgetMaximum, brief.currency)}</span><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{brief.expectedDuration || 'Flexible'}</span><span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{brief.remoteAllowed ? 'Remote available' : brief.location}</span></div>
        <div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="ghost" onClick={onDismiss}><Trash2 className="h-4 w-4" />Dismiss</Button><Button size="sm" variant="outline" onClick={onSave}><Bookmark className="h-4 w-4" />{brief.saved ? 'Saved' : 'Save'}</Button><Button size="sm" onClick={onOpen}>View client brief</Button></div>
      </CardContent></Card>
  );
}

function BriefDetail({ id, onBack, onPropose }: { id: string; onBack: () => void; onPropose: (brief: ClientBrief) => void }) {
  const { data: brief, isLoading, isError } = useLeadBrief(id); const interaction = useUpdateLeadInteraction();
  if (isLoading) return <Skeleton className="mx-auto h-96 w-full max-w-5xl rounded-xl" />;
  if (isError || !brief) return <p className="text-sm text-destructive">Couldn&apos;t load this opportunity.</p>;
  return <div className="mx-auto w-full max-w-5xl space-y-5 pb-8"><Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" />All opportunities</Button><Card><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle className="text-2xl">{brief.title}</CardTitle><CardDescription>{brief.serviceCategory} · posted {date(brief.publishedAt)}</CardDescription></div><Badge variant="secondary">{Math.round(brief.matchScore * 100)}% match</Badge></div></CardHeader><CardContent className="space-y-6"><p className="whitespace-pre-wrap text-sm text-foreground">{brief.description}</p><div className="grid gap-4 rounded-xl bg-muted/40 p-4 sm:grid-cols-3"><Metric label="Budget" value={`${money(brief.budgetMinimum, brief.currency)}–${money(brief.budgetMaximum, brief.currency)}`} /><Metric label="Duration" value={brief.expectedDuration || 'Flexible'} /><Metric label="Deadline" value={date(brief.expiresAt)} /></div><div><h3 className="mb-2 text-sm font-semibold">Required skills</h3><div className="flex flex-wrap gap-2">{brief.requiredSkills.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}</div></div><div className="flex flex-wrap justify-end gap-2"><Button variant="outline" onClick={() => interaction.mutate({ id: brief.id, saved: !brief.saved })}><Bookmark className="h-4 w-4" />{brief.saved ? 'Saved' : 'Save opportunity'}</Button><Button disabled={brief.proposalSubmitted} onClick={() => onPropose(brief)}><Send className="h-4 w-4" />{brief.proposalSubmitted ? 'Proposal submitted' : 'Create proposal'}</Button></div></CardContent></Card></div>;
}

function ProposalEditor({ brief, onBack, onDone }: { brief: ClientBrief; onBack: () => void; onDone: () => void }) {
  const create = useCreateProposal(); const [error, setError] = useState('');
  const [form, setForm] = useState({ title: brief.title, coverMessage: '', proposedPrice: brief.budgetMinimum, deliveryTimeValue: 7, includedRevisionCount: 1, unlimitedRevisions: false, revisionRequestWindowDays: 7, deliverables: '', expiresAt: localDate(7) });
  const commission = Math.round(form.proposedPrice * 0.12 * 100) / 100;
  async function save() {
    setError('');
    const payload: UpsertProposalRequest = { clientBriefId: brief.id, proposalSource: brief.source === 'DirectInvitation' ? 'DirectInvitationProposal' : 'StandardProposal', title: form.title, coverMessage: form.coverMessage, proposedPrice: form.proposedPrice, currency: brief.currency, pricingType: brief.pricingType, deliveryTimeValue: form.deliveryTimeValue, deliveryTimeUnit: 'Days', deliveryDayType: 'BusinessDays', deliveryStartRule: 'AfterEscrowFunding', includedRevisionCount: form.includedRevisionCount, unlimitedRevisions: form.unlimitedRevisions, confirmUnlimitedRevisions: form.unlimitedRevisions, revisionRequestWindowDays: form.revisionRequestWindowDays, deliverables: form.deliverables.split('\n').map((x) => x.trim()).filter(Boolean), milestonePlan: [], attachments: [], expiresAt: new Date(form.expiresAt).toISOString() };
    try { await create.mutateAsync(payload); onDone(); } catch { setError('Couldn\'t save the proposal. Review the required fields and try again.'); }
  }
  const set = (key: keyof typeof form, value: string | number | boolean) => setForm((f) => ({ ...f, [key]: value }));
  return <div className="mx-auto w-full max-w-4xl space-y-5 pb-8"><Button variant="ghost" onClick={onBack}><ArrowLeft className="h-4 w-4" />Opportunity details</Button><div><h1 className="text-3xl font-semibold">Create Proposal</h1><p className="text-sm text-muted-foreground">Terms remain a draft until you explicitly submit them.</p></div><Card><CardContent className="space-y-5 pt-6"><Field label="Proposal title"><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></Field><Field label="Cover message"><Textarea rows={7} value={form.coverMessage} onChange={(e) => set('coverMessage', e.target.value)} placeholder="Explain your approach, relevant experience, and the outcome you will deliver." /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label={`Price (${brief.currency})`}><Input type="number" min="0" value={form.proposedPrice} onChange={(e) => set('proposedPrice', Number(e.target.value))} /></Field><Field label="Delivery (business days)"><Input type="number" min="1" value={form.deliveryTimeValue} onChange={(e) => set('deliveryTimeValue', Number(e.target.value))} /></Field></div><Field label="Deliverables (one per line)"><Textarea rows={5} value={form.deliverables} onChange={(e) => set('deliverables', e.target.value)} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Included revisions"><Input type="number" min="0" disabled={form.unlimitedRevisions} value={form.includedRevisionCount} onChange={(e) => set('includedRevisionCount', Number(e.target.value))} /></Field><Field label="Revision request window (days)"><Input type="number" min="0" value={form.revisionRequestWindowDays} onChange={(e) => set('revisionRequestWindowDays', Number(e.target.value))} /></Field></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.unlimitedRevisions} onChange={(e) => set('unlimitedRevisions', e.target.checked)} />I explicitly confirm unlimited revisions</label><Field label="Proposal expires"><Input type="datetime-local" value={form.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} /></Field><div className="rounded-xl border border-border bg-muted/30 p-4"><h3 className="text-sm font-semibold">Earnings preview</h3><div className="mt-2 grid grid-cols-3 gap-3 text-sm"><Metric label="Price" value={money(form.proposedPrice, brief.currency)} /><Metric label="Commission (12%)" value={money(commission, brief.currency)} /><Metric label="Net" value={money(form.proposedPrice - commission, brief.currency)} /></div></div>{(form.proposedPrice < brief.budgetMinimum || form.proposedPrice > brief.budgetMaximum) && <p className="text-sm text-warning">Your price is outside the client&apos;s budget. You can still save and submit it.</p>}{error && <p className="text-sm text-destructive">{error}</p>}<div className="flex justify-end"><Button onClick={save} disabled={create.isPending}><FileText className="h-4 w-4" />{create.isPending ? 'Saving…' : 'Save draft'}</Button></div></CardContent></Card></div>;
}

function ProposalPipeline() {
  const { data, isLoading, isError } = useProposals(); const submit = useSubmitProposal(); const withdraw = useWithdrawProposal(); const duplicate = useDuplicateProposal(); const review = useReviewOrderRequest();
  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (isError) return <p className="text-sm text-destructive">Couldn&apos;t load proposals. Try again.</p>;
  if (!data?.length) return <EmptyState icon={FileText} title="No Active Proposals" description="Submit a proposal or send a custom offer to begin a client discussion." action={<Button variant="outline">Browse Opportunities</Button>} />;
  return <div className="grid gap-3">{data.map((p) => <Card key={p.id}><CardHeader className="pb-3"><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-lg">{p.title || 'Untitled proposal'}</CardTitle><CardDescription>Version {p.version} · {p.proposalSource}</CardDescription></div><ProposalBadge status={p.status} /></div></CardHeader><CardContent><div className="flex flex-wrap items-end justify-between gap-3"><div className="text-sm"><span className="font-semibold">{money(p.proposedPrice, p.currency)}</span><span className="ml-3 text-muted-foreground">Net {money(p.earningsPreview.net, p.currency)}</span></div><div className="flex gap-2">{p.status === 'Draft' && <Button size="sm" onClick={() => submit.mutate(p.id)}>Submit</Button>}{p.status === 'Submitted' && p.acceptanceTrigger !== 'ProviderApprovalRequired' && <Button size="sm" variant="outline" onClick={() => withdraw.mutate(p.id)}>Withdraw</Button>}{p.status === 'Submitted' && p.acceptanceTrigger === 'ProviderApprovalRequired' && <><Button size="sm" variant="outline" onClick={() => review.mutate({ id: p.id, accept: false })}>Decline</Button><Button size="sm" onClick={() => review.mutate({ id: p.id, accept: true })}>Approve request</Button></>}{p.status === 'Expired' && <Button size="sm" variant="outline" onClick={() => duplicate.mutate(p.id)}>Duplicate</Button>}</div></div>{p.warnings.map((w) => <p key={w} className="mt-2 text-xs text-warning">{w}</p>)}</CardContent></Card>)}</div>;
}

function ProposalBadge({ status }: { status: Proposal['status'] }) { const variant = status === 'Accepted' ? 'success' : ['Declined', 'Withdrawn', 'Expired'].includes(status) ? 'secondary' : status === 'ChangesRequested' ? 'warning' : 'outline'; return <Badge variant={variant as 'success' | 'secondary' | 'warning' | 'outline'}>{status.replace(/([A-Z])/g, ' $1').trim()}</Badge>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium text-foreground">{value}</p></div>; }
function money(value: number, currency: string) { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value); } catch { return `${currency} ${value.toFixed(2)}`; } }
function date(value?: string | null) { return value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)) : 'Not set'; }
function localDate(days: number) { const d = new Date(Date.now() + days * 86400000); const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 16); }

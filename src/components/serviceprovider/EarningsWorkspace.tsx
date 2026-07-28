'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CreditCard, FileText, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAddPayoutMethod, useEarnings, useRequestPayout, useUpdateTaxSettings } from '@/hooks/queries/workroom';

export function EarningsWorkspace() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = earningsTab(searchParams.get('tab'));
  const setActiveTab = (nextTab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', earningsTab(nextTab));
    router.replace(`${pathname}?${params.toString()}`);
  };
  const [currency, setCurrency] = useState('EUR'); const { data, isLoading, isError } = useEarnings(currency); const payout = useRequestPayout(); const method = useAddPayoutMethod(); const tax = useUpdateTaxSettings();
  const [amount, setAmount] = useState(0); const [methodForm, setMethodForm] = useState({ rail: 'StripeConnect', displayName: '', maskedDescriptor: '' }); const [taxForm, setTaxForm] = useState({ legalName: '', countryCode: '', taxIdentifierMasked: '', vatRegistered: false, vatNumberMasked: '' });
  if (isLoading) return <Skeleton className="h-[28rem] w-full rounded-xl" />;
  if (isError || !data) return <p className="text-sm text-destructive">Couldn&apos;t load earnings. Try again.</p>;
  return <div className="mx-auto w-full max-w-6xl space-y-6 pb-8"><div className="flex items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">Earnings &amp; Payouts</h1><p className="text-sm text-muted-foreground">Escrow, releases, flat 12% commission, invoices, statements, and payouts.</p></div><select className="h-9 rounded-md border bg-background px-3 text-sm" value={currency} onChange={(e) => setCurrency(e.target.value)}><option>EUR</option><option>USD</option><option>GBP</option></select></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><MoneyCard label="Work in progress" value={data.workInProgress} currency={currency} /><MoneyCard label="In review" value={data.inReview} currency={currency} /><MoneyCard label="Pending" value={data.pending} currency={currency} /><MoneyCard label="Available" value={data.available} currency={currency} strong /></div>
    <Tabs defaultValue="activity" value={activeTab} onValueChange={setActiveTab}><TabsList><TabsTrigger value="activity">Financial activity</TabsTrigger><TabsTrigger value="payouts">Payouts</TabsTrigger><TabsTrigger value="invoices">Invoices</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger></TabsList>
      <TabsContent value="activity">{!data.transactions.length ? <EmptyState icon={Wallet} title="No Earnings Yet" description="Approved project payments will appear here." /> : <Card><CardContent className="pt-4">{data.transactions.map((t) => <div key={t.id} className="flex items-center justify-between border-b py-3 last:border-0"><div><p className="text-sm font-medium">{words(t.transactionType)}</p><p className="text-xs text-muted-foreground">{date(t.createdAt)} · {t.paymentStatus}</p></div><div className="text-right"><p className="text-sm font-medium">{money(t.netAmount || t.grossAmount, t.currency)}</p>{t.commissionAmount > 0 && <p className="text-xs text-muted-foreground">Commission {money(t.commissionAmount, t.currency)}</p>}</div></div>)}</CardContent></Card>}</TabsContent>
      <TabsContent value="payouts"><div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Request payout</CardTitle><CardDescription>Available: {money(data.available, currency)}</CardDescription></CardHeader><CardContent className="space-y-3">{!data.settings.payoutMethods.length ? <EmptyState icon={CreditCard} title="Add a Payout Method" description="Verify a payout method before requesting a withdrawal." /> : <><Field label={`Amount (${currency})`}><Input type="number" min={data.settings.minimumPayoutAmount} max={data.available} value={amount} onChange={(e) => setAmount(Number(e.target.value))} /></Field><Button disabled={payout.isPending || amount <= 0} onClick={() => payout.mutate({ amount, currency })}>Request payout</Button></>}</CardContent></Card><Card><CardHeader><CardTitle>Payout history</CardTitle></CardHeader><CardContent>{data.payouts.length ? data.payouts.map((p) => <div key={p.id} className="flex justify-between border-b py-2 text-sm"><span>{money(p.amount, p.currency)}</span><Badge variant="outline">{p.status}</Badge></div>) : <p className="text-sm text-muted-foreground">No completed or active payouts.</p>}</CardContent></Card></div></TabsContent>
      <TabsContent value="invoices"><Card><CardHeader><CardTitle>Invoices</CardTitle><CardDescription>Issued records are immutable; corrections use a credit note.</CardDescription></CardHeader><CardContent>{data.invoices.length ? data.invoices.map((i) => <div key={i.id} className="flex justify-between border-b py-3"><div><p className="text-sm font-medium">{i.invoiceNumber}</p><p className="text-xs text-muted-foreground">{date(i.createdAt)} · {i.status}</p></div><span className="text-sm">{money(i.netAmount, i.currency)}</span></div>) : <EmptyState icon={FileText} title="No Invoices Yet" description="Issued milestone invoices will appear here." />}</CardContent></Card></TabsContent>
      <TabsContent value="settings"><div className="grid gap-4 md:grid-cols-2"><Card><CardHeader><CardTitle>Payout method</CardTitle><CardDescription>STUB verification; only masked descriptors are stored.</CardDescription></CardHeader><CardContent className="space-y-3"><Field label="Rail"><select className="h-9 w-full rounded-md border bg-background px-3 text-sm" value={methodForm.rail} onChange={(e) => setMethodForm({ ...methodForm, rail: e.target.value })}><option>StripeConnect</option><option>Wise</option><option>BankTransfer</option><option>PayPal</option></select></Field><Field label="Display name"><Input value={methodForm.displayName} onChange={(e) => setMethodForm({ ...methodForm, displayName: e.target.value })} /></Field><Field label="Account descriptor"><Input value={methodForm.maskedDescriptor} onChange={(e) => setMethodForm({ ...methodForm, maskedDescriptor: e.target.value })} placeholder="Last four digits or email" /></Field><Button onClick={() => method.mutate(methodForm)}>Set up payout method</Button></CardContent></Card><Card><CardHeader><CardTitle>Tax / VAT invoice settings</CardTitle></CardHeader><CardContent className="space-y-3"><Field label="Legal name"><Input value={taxForm.legalName} onChange={(e) => setTaxForm({ ...taxForm, legalName: e.target.value })} /></Field><Field label="Country code"><Input maxLength={2} value={taxForm.countryCode} onChange={(e) => setTaxForm({ ...taxForm, countryCode: e.target.value })} /></Field><Field label="Tax identifier"><Input value={taxForm.taxIdentifierMasked} onChange={(e) => setTaxForm({ ...taxForm, taxIdentifierMasked: e.target.value })} /></Field><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={taxForm.vatRegistered} onChange={(e) => setTaxForm({ ...taxForm, vatRegistered: e.target.checked })} />VAT registered</label><Button variant="outline" onClick={() => tax.mutate(taxForm)}>Save invoice settings</Button></CardContent></Card></div></TabsContent>
    </Tabs>
    {data.transactions.length > 0 && data.available <= 0 && <EmptyState icon={Wallet} title="No Funds Available" description="Released earnings that are ready for payout will appear here." />}
  </div>;
}
function MoneyCard({ label, value, currency, strong = false }: { label: string; value: number; currency: string; strong?: boolean }) { return <Card className={strong ? 'border-primary/40' : ''}><CardContent className="pt-5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{money(value, currency)}</p></CardContent></Card>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-2"><Label>{label}</Label>{children}</div>; }
function money(value: number, currency: string) { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value); } catch { return `${currency} ${value.toFixed(2)}`; } }
function words(value: string) { return value.replace(/([A-Z])/g, ' $1').trim(); }
function date(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)); }
function earningsTab(value: string | null): 'activity' | 'payouts' | 'invoices' | 'settings' {
  return value === 'payouts' || value === 'invoices' || value === 'settings' ? value : 'activity';
}

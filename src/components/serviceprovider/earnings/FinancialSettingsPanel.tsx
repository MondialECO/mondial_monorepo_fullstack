'use client';

// Remaining hardcoded hex on this file is deliberate, not an oversight: those values
// have no exact token equivalent. See the PENDING DESIGN-TOKEN DECISION note in
// src/app/globals.css (below the .sp-workspace block) for the full list and why.
import { useEffect, useState } from 'react';
import { BadgeCheck, Building2, CreditCard, FileText, Landmark, Plus, ReceiptText, ShieldAlert, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useAddPayoutMethod, useRemovePayoutMethod, useSetDefaultPayoutMethod, useUpdateTaxSettings } from '@/hooks/queries/workroom';
import { SpCard, SpEmptyState, SpFormField, SpMutationFeedback, SpSectionHeader, SpStatusBadge } from '@/components/serviceprovider/ui';
import { apiError, formatDate, money, words } from '@/components/serviceprovider/workroom/_shared';
import type { FinancialSummary, PayoutMethod, TaxSettingsPayload } from '@/types/workroom';
import { shortReference, transactionTone } from './_shared';
import { useSpDirtyFormGuard } from '@/hooks/useSpDirtyFormGuard';

type MethodAction = { kind: 'default' | 'remove'; method: PayoutMethod } | null;
const emptyMethod = { rail: 'BankTransfer', displayName: '', maskedDescriptor: '' };

export function financialTaxForm(settings: FinancialSummary['settings']['tax']): TaxSettingsPayload {
  return {
    legalName: settings.legalName ?? '',
    countryCode: settings.countryCode ?? '',
    taxIdentifierMasked: settings.taxIdentifierMasked ?? '',
    vatRegistered: settings.vatRegistered,
    vatNumberMasked: settings.vatNumberMasked ?? '',
  };
}

export function FinancialSettingsPanel({ data, currency }: { data: FinancialSummary; currency: string }) {
  const addMethod = useAddPayoutMethod();
  const setDefault = useSetDefaultPayoutMethod();
  const removeMethod = useRemovePayoutMethod();
  const updateTax = useUpdateTaxSettings();
  const [methodForm, setMethodForm] = useState(emptyMethod);
  const [methodDialog, setMethodDialog] = useState(false);
  const [methodAction, setMethodAction] = useState<MethodAction>(null);
  const [taxConfirm, setTaxConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [tax, setTax] = useState<TaxSettingsPayload>(() => financialTaxForm(data.settings.tax));
  const dirtyGuard = useSpDirtyFormGuard(tax);
  const { markClean } = dirtyGuard;

  useEffect(() => {
    const next = financialTaxForm(data.settings.tax);
    setTax(next);
    markClean(next);
  }, [data.settings.tax, markClean]);

  const validMethod = methodForm.displayName.trim().length >= 2 && methodForm.maskedDescriptor.trim().length >= 3;
  const validTax = tax.legalName.trim().length >= 2 && /^[A-Za-z]{2}$/.test(tax.countryCode.trim()) && (!tax.vatRegistered || !!tax.vatNumberMasked?.trim());

  const saveMethod = async () => {
    if (!validMethod) return;
    setFeedback(null);
    try {
      await addMethod.mutateAsync(methodForm);
      setFeedback({ status: 'success', message: 'Masked payout method saved and marked verified by the deterministic STUB adapter.' });
      setMethodForm(emptyMethod); setMethodDialog(false);
    } catch (error) { setFeedback({ status: 'error', message: apiError(error, 'The payout method could not be saved. Review the fields and try again.') }); }
  };

  const confirmMethodAction = async () => {
    if (!methodAction) return;
    setFeedback(null);
    try {
      if (methodAction.kind === 'default') {
        await setDefault.mutateAsync(methodAction.method.id);
        setFeedback({ status: 'success', message: `${methodAction.method.displayName} is now the default sandbox payout method.` });
      } else {
        await removeMethod.mutateAsync(methodAction.method.id);
        setFeedback({ status: 'success', message: `${methodAction.method.displayName} was removed. Historical payout records remain intact.` });
      }
      setMethodAction(null);
    } catch (error) { setFeedback({ status: 'error', message: apiError(error, 'The payout-method change could not be completed. Existing settings were preserved.') }); setMethodAction(null); }
  };

  const saveTax = async () => {
    if (!validTax) return;
    setFeedback(null);
    try {
      const savedTax = { ...tax, countryCode: tax.countryCode.trim().toUpperCase() };
      await updateTax.mutateAsync(savedTax);
      setTax(savedTax);
      markClean(savedTax);
      setFeedback({ status: 'success', message: 'Tax and VAT invoice settings were saved. Existing invoice snapshots were not changed.' });
      setTaxConfirm(false);
    } catch (error) { setFeedback({ status: 'error', message: apiError(error, 'Tax settings could not be saved. Existing values were preserved.') }); setTaxConfirm(false); }
  };

  return <div className="space-y-6">
    {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}
    {data.settings.accountOnHold && <SpMutationFeedback status="error"><strong>Account hold:</strong> payout settings remain visible, but payout requests are blocked until the backend account review is resolved.</SpMutationFeedback>}
    <div className="grid gap-6 xl:grid-cols-2">
      <SpCard>
        <SpSectionHeader title="Payout methods" description="Manage masked destinations used by the payment sandbox." action={<Button type="button" variant="outline" onClick={() => setMethodDialog(true)}><Plus className="size-4" aria-hidden="true" />Add method</Button>} />
        <div className="mt-5 rounded-xl border border-border bg-[#F9FAFB] p-4"><div className="flex items-start gap-3"><Landmark className="mt-0.5 size-5 text-primary" aria-hidden="true" /><div><p className="text-sm font-semibold text-foreground">Minimum payout: {money(data.settings.minimumPayoutAmount, currency)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">The minimum and account-hold state are backend-owned. No frontend payout rule is calculated here.</p></div></div></div>
        {data.settings.payoutMethods.length === 0 ? <SpEmptyState className="mt-5 min-h-52 border-0 bg-[#F9FAFB]" icon={CreditCard} title="No payout methods" description="Add a masked descriptor to use with sandbox payout requests." /> : <ul className="mt-5 space-y-3">{data.settings.payoutMethods.map((method) => { const isDefault = method.id === data.settings.defaultPayoutMethodId; return <li key={method.id} className="rounded-xl border border-border p-4"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex min-w-0 items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><CreditCard className="size-5" aria-hidden="true" /></span><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{method.displayName}</p>{isDefault && <SpStatusBadge tone="info"><Star className="mr-1 size-3" aria-hidden="true" />Default</SpStatusBadge>}<SpStatusBadge tone={method.verified ? 'positive' : 'warning'}>{method.verified ? 'STUB verified' : 'Unverified'}</SpStatusBadge></div><p className="mt-1 text-sm text-muted-foreground">{words(method.rail)} · {method.maskedDescriptor}</p><p className="mt-1 text-xs text-[#9CA3AF]">Added {formatDate(method.createdAt)}</p></div></div><div className="flex shrink-0 gap-2">{!isDefault && <Button type="button" size="sm" variant="outline" disabled={!method.verified} onClick={() => setMethodAction({ kind: 'default', method })}><BadgeCheck className="size-4" aria-hidden="true" />Make default</Button>}<Button type="button" size="sm" variant="outline" onClick={() => setMethodAction({ kind: 'remove', method })} className="text-[#B42318]"><Trash2 className="size-4" aria-hidden="true" />Remove</Button></div></div></li>; })}</ul>}
        <SpMutationFeedback status="info" className="mt-5">Payout-method verification is STUB-backed. It does not confirm ownership of a real bank, Wise, PayPal or Stripe account.</SpMutationFeedback>
      </SpCard>

      <SpCard>
        <SpSectionHeader title="Tax & invoice settings" description="These values are stored as the provider’s tax settings and snapshotted onto future invoices." action={<Building2 className="size-5 text-primary" aria-hidden="true" />} />
        <div className="mt-5 space-y-4">
          <SpFormField id="tax-legal-name" label="Tax legal name" required><Input value={tax.legalName} onChange={(event) => setTax((current) => ({ ...current, legalName: event.target.value }))} /></SpFormField>
          <SpFormField id="tax-country" label="Country code" description="Two-letter country code, for example FR or BD." error={tax.countryCode && !/^[A-Za-z]{2}$/.test(tax.countryCode.trim()) ? 'Enter a two-letter country code.' : null} required><Input maxLength={2} value={tax.countryCode} onChange={(event) => setTax((current) => ({ ...current, countryCode: event.target.value.toUpperCase() }))} /></SpFormField>
          <SpFormField id="tax-identifier" label="Masked tax identifier" description="Existing masked values can be preserved; new values are masked by the backend before storage."><Input value={tax.taxIdentifierMasked ?? ''} onChange={(event) => setTax((current) => ({ ...current, taxIdentifierMasked: event.target.value }))} /></SpFormField>
          <label className="flex items-start gap-3 rounded-xl border border-border bg-[#F9FAFB] p-4 text-sm text-[#374151]"><input type="checkbox" checked={tax.vatRegistered} onChange={(event) => setTax((current) => ({ ...current, vatRegistered: event.target.checked }))} className="mt-0.5 size-4 accent-primary" /><span><strong className="block text-foreground">VAT registered</strong><span className="mt-1 block text-xs leading-5 text-muted-foreground">This records registration status only. VAT rates and invoice tax are not automatically calculated by the current API.</span></span></label>
          {tax.vatRegistered && <SpFormField id="vat-number" label="Masked VAT number" required><Input value={tax.vatNumberMasked ?? ''} onChange={(event) => setTax((current) => ({ ...current, vatNumberMasked: event.target.value }))} /></SpFormField>}
          <Button type="button" disabled={!validTax || !dirtyGuard.dirty || updateTax.isPending} onClick={() => setTaxConfirm(true)}>Review tax-setting changes</Button>
          <p className="text-xs leading-5 text-muted-foreground">Saving sends the complete API-backed settings form, so changing one field does not erase the other values shown here. Existing invoice snapshots are immutable.</p>
        </div>
      </SpCard>
    </div>

    <InvoiceTable data={data} />

    <Dialog open={methodDialog} onOpenChange={setMethodDialog}><DialogContent><DialogHeader><DialogTitle>Add a sandbox payout method</DialogTitle><DialogDescription>Only a display label and masked descriptor are stored. Production account verification is not active.</DialogDescription></DialogHeader><div className="space-y-4"><SpFormField id="method-rail" label="Payout rail" required><select value={methodForm.rail} onChange={(event) => setMethodForm((current) => ({ ...current, rail: event.target.value }))} className="h-10 w-full rounded-xl border border-input bg-white px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="BankTransfer">Bank transfer</option><option value="Wise">Wise</option><option value="PayPal">PayPal</option><option value="StripeConnect">Stripe Connect</option></select></SpFormField><SpFormField id="method-name" label="Display name" required><Input value={methodForm.displayName} onChange={(event) => setMethodForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Primary business account" /></SpFormField><SpFormField id="method-descriptor" label="Masked account descriptor" description="Use a masked account ending or email. Do not enter full bank credentials." required><Input value={methodForm.maskedDescriptor} onChange={(event) => setMethodForm((current) => ({ ...current, maskedDescriptor: event.target.value }))} placeholder="•••• 4821" /></SpFormField><SpMutationFeedback status="info"><ShieldAlert className="sr-only" />This method will be marked verified by the deterministic STUB adapter only.</SpMutationFeedback></div><DialogFooter><Button type="button" variant="outline" onClick={() => setMethodDialog(false)} disabled={addMethod.isPending}>Cancel</Button><Button type="button" onClick={saveMethod} disabled={!validMethod || addMethod.isPending}>{addMethod.isPending ? 'Saving…' : 'Confirm and save'}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={!!methodAction} onOpenChange={(open) => !open && setMethodAction(null)}><DialogContent><DialogHeader><DialogTitle>{methodAction?.kind === 'remove' ? 'Remove payout method?' : 'Change the default payout method?'}</DialogTitle><DialogDescription>{methodAction?.kind === 'remove' ? 'The backend blocks removal when this method is attached to an active payout. Historical payout references remain unchanged.' : 'Future sandbox payout requests will select this verified method by default.'}</DialogDescription></DialogHeader>{methodAction && <div className="rounded-xl bg-[#F9FAFB] p-4"><p className="font-semibold text-foreground">{methodAction.method.displayName}</p><p className="mt-1 text-sm text-muted-foreground">{methodAction.method.maskedDescriptor}</p></div>}<DialogFooter><Button type="button" variant="outline" onClick={() => setMethodAction(null)} disabled={setDefault.isPending || removeMethod.isPending}>Cancel</Button><Button type="button" variant={methodAction?.kind === 'remove' ? 'destructive' : 'default'} onClick={confirmMethodAction} disabled={setDefault.isPending || removeMethod.isPending}>{setDefault.isPending || removeMethod.isPending ? 'Saving…' : methodAction?.kind === 'remove' ? 'Remove method' : 'Set as default'}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={taxConfirm} onOpenChange={setTaxConfirm}><DialogContent><DialogHeader><DialogTitle>Confirm tax-setting changes</DialogTitle><DialogDescription>These values will be used for future invoice snapshots. Existing invoices are not retroactively changed.</DialogDescription></DialogHeader><dl className="space-y-3 rounded-xl bg-[#F9FAFB] p-4"><ReviewRow label="Legal name" value={tax.legalName} /><ReviewRow label="Country" value={tax.countryCode.toUpperCase()} /><ReviewRow label="Tax identifier" value={tax.taxIdentifierMasked || 'Not provided'} /><ReviewRow label="VAT registered" value={tax.vatRegistered ? 'Yes' : 'No'} />{tax.vatRegistered && <ReviewRow label="VAT number" value={tax.vatNumberMasked || 'Not provided'} />}</dl><DialogFooter><Button type="button" variant="outline" onClick={() => setTaxConfirm(false)} disabled={updateTax.isPending}>Cancel</Button><Button type="button" onClick={saveTax} disabled={!validTax || updateTax.isPending}>{updateTax.isPending ? 'Saving…' : 'Confirm tax settings'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function InvoiceTable({ data }: { data: FinancialSummary }) {
  return <SpCard><SpSectionHeader title="Invoices" description="Immutable invoice records generated from approved payment releases. Corrections reference the original invoice rather than overwriting it." action={<ReceiptText className="size-5 text-primary" aria-hidden="true" />} />{data.invoices.length === 0 ? <SpEmptyState className="mt-5 border-0 bg-[#F9FAFB]" icon={FileText} title="No invoices yet" description="Issued milestone invoices will appear here when the backend creates them." /> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead><tr className="border-b border-border text-xs uppercase tracking-[0.08em] text-muted-foreground"><th className="px-3 py-3 font-semibold">Invoice</th><th className="px-3 py-3 font-semibold">Project / milestone</th><th className="px-3 py-3 font-semibold">Gross</th><th className="px-3 py-3 font-semibold">Commission</th><th className="px-3 py-3 font-semibold">Net</th><th className="px-3 py-3 font-semibold">Lifecycle</th><th className="px-3 py-3 font-semibold">Status</th></tr></thead><tbody>{data.invoices.map((invoice) => <tr key={invoice.id} className="border-b border-border align-top last:border-0"><td className="px-3 py-4"><p className="font-semibold text-foreground">{invoice.invoiceNumber}</p>{invoice.correctsInvoiceId && <p className="mt-1 text-xs text-warning">Corrects {shortReference(invoice.correctsInvoiceId)}</p>}</td><td className="px-3 py-4 text-[#374151]"><p>Project {shortReference(invoice.engagementId)}</p><p className="mt-1 text-xs text-muted-foreground">Milestone {shortReference(invoice.milestoneId)}</p></td><td className="px-3 py-4 text-[#374151]">{money(invoice.grossAmount, invoice.currency)}</td><td className="px-3 py-4 text-[#374151]">{money(invoice.commissionAmount, invoice.currency)}</td><td className="px-3 py-4 font-semibold text-foreground">{money(invoice.netAmount, invoice.currency)}</td><td className="px-3 py-4 text-xs text-muted-foreground"><p>Approved {formatDate(invoice.approvalDate)}</p><p className="mt-1">Released {formatDate(invoice.releaseDate)}</p></td><td className="px-3 py-4"><SpStatusBadge tone={transactionTone(invoice.status)}>{words(invoice.status)}</SpStatusBadge></td></tr>)}</tbody></table></div>}<p className="mt-5 text-xs leading-5 text-muted-foreground">The API does not return invoice PDFs, downloadable templates, editable numbering, or a document-generation endpoint, so none are presented here.</p></SpCard>;
}

function ReviewRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-right text-sm font-semibold text-foreground">{value}</dd></div>; }

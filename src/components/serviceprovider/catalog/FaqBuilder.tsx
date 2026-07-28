'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  HelpCircle,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  SpCard,
  SpEmptyState,
  SpMutationFeedback,
  SpSectionHeader,
  SpStatusBadge,
} from '@/components/serviceprovider/ui';
import {
  useAddFaq,
  useDeleteFaq,
  useDuplicateFaq,
  usePublishFaq,
  useReorderFaqs,
  useUnpublishFaq,
  useUpdateFaq,
} from '@/hooks/queries/service-catalog';
import { FAQ_VISIBILITIES, type ServiceFaq, type ServicePackage } from '@/types/service-catalog';
import { EnumSelect, Field } from './_shared';

type Feedback = { status: 'success' | 'error'; message: string };

export function FaqBuilder({
  listingId,
  faqs,
  packages,
}: {
  listingId: string;
  faqs: ServiceFaq[];
  packages: ServicePackage[];
}) {
  const add = useAddFaq();
  const update = useUpdateFaq();
  const remove = useDeleteFaq();
  const duplicate = useDuplicateFaq();
  const publish = usePublishFaq();
  const unpublish = useUnpublishFaq();
  const reorder = useReorderFaqs();
  const [editing, setEditing] = useState<ServiceFaq | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceFaq | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const sorted = [...faqs].sort((left, right) => left.displayOrder - right.displayOrder);

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setFeedback(null);
    try {
      await reorder.mutateAsync([
        listingId,
        { items: reordered.map((faq, itemIndex) => ({ faqId: faq.id, displayOrder: itemIndex })) },
      ]);
    } catch {
      setFeedback({ status: 'error', message: 'The FAQ order could not be updated.' });
    }
  };

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setFeedback(null);
    try {
      await action();
      setFeedback({ status: 'success', message: successMessage });
    } catch {
      setFeedback({ status: 'error', message: 'The FAQ could not be updated. Try again.' });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await remove.mutateAsync([deleteTarget.id]);
      setDeleteTarget(null);
      setFeedback({ status: 'success', message: 'FAQ deleted successfully.' });
    } catch {
      setFeedback({ status: 'error', message: 'The FAQ could not be deleted. Try again.' });
    }
  };

  return (
    <div className="space-y-5">
      <SpCard>
        <SpSectionHeader
          title="Frequently asked questions"
          description="Answer common client questions. Package terms remain authoritative when an FAQ conflicts with package configuration."
          action={
            !adding && !editing ? (
              <Button type="button" variant="outline" onClick={() => setAdding(true)}>
                <Plus className="size-4" aria-hidden="true" />
                Add FAQ
              </Button>
            ) : undefined
          }
        />
      </SpCard>

      {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}

      {editing && (
        <FaqForm
          key={editing.id}
          packages={packages}
          initial={editing}
          onCancel={() => setEditing(null)}
          onSubmit={async (payload) => {
            await update.mutateAsync([editing.id, payload]);
            setEditing(null);
            setFeedback({ status: 'success', message: 'FAQ saved successfully.' });
          }}
          pending={update.isPending}
        />
      )}

      {adding && (
        <FaqForm
          packages={packages}
          onCancel={() => setAdding(false)}
          onSubmit={async (payload) => {
            await add.mutateAsync([listingId, payload]);
            setAdding(false);
            setFeedback({ status: 'success', message: 'FAQ added successfully.' });
          }}
          pending={add.isPending}
        />
      )}

      {sorted.length === 0 && !adding ? (
        <SpEmptyState
          icon={HelpCircle}
          title="No FAQs yet"
          description="Add an FAQ when clients repeatedly need the same clarification. FAQs are optional."
          action={
            <Button type="button" variant="outline" onClick={() => setAdding(true)}>
              Add first FAQ
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((faq, index) => (
            <SpCard key={faq.id} className="p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SpStatusBadge tone={faq.status === 'Published' ? 'positive' : 'neutral'}>{faq.status}</SpStatusBadge>
                    <SpStatusBadge>{formatEnum(faq.visibility)}</SpStatusBadge>
                  </div>
                  <h3 className="mt-3 text-sm font-semibold leading-6 text-[#171717]">{faq.question}</h3>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#6B7280]">{faq.answer}</p>
                  {faq.conflictWarning && (
                    <SpMutationFeedback status="error" className="mt-3">
                      <span className="inline-flex items-center gap-2">
                        <AlertTriangle className="size-4" aria-hidden="true" />
                        {faq.conflictWarning}
                      </span>
                    </SpMutationFeedback>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:max-w-64 sm:justify-end">
                  <Button type="button" size="icon" variant="outline" aria-label={`Move ${faq.question} up`} onClick={() => move(index, -1)} disabled={index === 0 || reorder.isPending}>
                    <ChevronUp className="size-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" size="icon" variant="outline" aria-label={`Move ${faq.question} down`} onClick={() => move(index, 1)} disabled={index === sorted.length - 1 || reorder.isPending}>
                    <ChevronDown className="size-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => { setEditing(faq); setAdding(false); }}>
                    <Pencil className="size-3.5" aria-hidden="true" /> Edit
                  </Button>
                  <Button type="button" size="icon" variant="outline" aria-label={`Duplicate ${faq.question}`} onClick={() => runAction(() => duplicate.mutateAsync([faq.id]), 'FAQ duplicated as a draft.')} disabled={duplicate.isPending}>
                    <Copy className="size-4" aria-hidden="true" />
                  </Button>
                  {faq.status === 'Published' ? (
                    <Button type="button" size="sm" variant="outline" onClick={() => runAction(() => unpublish.mutateAsync([faq.id]), 'FAQ unpublished successfully.')} disabled={unpublish.isPending}>Unpublish</Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" onClick={() => runAction(() => publish.mutateAsync([faq.id]), 'FAQ published successfully.')} disabled={publish.isPending}>Publish</Button>
                  )}
                  <Button type="button" size="icon" variant="ghost" aria-label={`Delete ${faq.question}`} onClick={() => setDeleteTarget(faq)}>
                    <Trash2 className="size-4 text-[#B42318]" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </SpCard>
          ))}
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this FAQ?</DialogTitle>
            <DialogDescription>
              This permanently removes the FAQ from the service. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteTarget(null)} disabled={remove.isPending}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={confirmDelete} disabled={remove.isPending}>
              {remove.isPending ? 'Deleting…' : 'Delete FAQ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FaqForm({
  packages,
  initial,
  onSubmit,
  onCancel,
  pending,
}: {
  packages: ServicePackage[];
  initial?: ServiceFaq;
  onSubmit: (payload: { packageId: string | null; question: string; answer: string; visibility: string; displayOrder: number }) => Promise<void>;
  onCancel: () => void;
  pending: boolean;
}) {
  const [question, setQuestion] = useState(initial?.question ?? '');
  const [answer, setAnswer] = useState(initial?.answer ?? '');
  const [visibility, setVisibility] = useState<string>(initial?.visibility ?? 'AllPackages');
  const [packageId, setPackageId] = useState<string>(initial?.packageId ?? '');
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!question.trim() || !answer.trim()) {
      setError('Question and answer are both required.');
      return;
    }
    setError(null);
    try {
      await onSubmit({
        packageId: packageId || null,
        question: question.trim(),
        answer: answer.trim(),
        visibility,
        displayOrder: initial?.displayOrder ?? 0,
      });
    } catch {
      setError('The FAQ could not be saved. Check for a duplicate question and try again.');
    }
  };

  return (
    <SpCard>
      <SpSectionHeader title={initial ? 'Edit FAQ' : 'Add FAQ'} description="Use a direct question and a client-facing answer." />
      <div className="mt-5 space-y-4">
        <Field label="Question" htmlFor="faq-question">
          <Input id="faq-question" value={question} onChange={(event) => setQuestion(event.target.value)} />
        </Field>
        <Field label="Answer" htmlFor="faq-answer">
          <Textarea id="faq-answer" rows={5} value={answer} onChange={(event) => setAnswer(event.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Visibility" htmlFor="faq-visibility">
            <EnumSelect labelFor="faq-visibility" value={visibility} onChange={setVisibility} options={FAQ_VISIBILITIES} />
          </Field>
          <Field label="Applies to package" htmlFor="faq-package">
            <select
              id="faq-package"
              value={packageId}
              onChange={(event) => setPackageId(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#171717] outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
            >
              <option value="">All packages</option>
              {packages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.packageType} — {item.packageTitle || item.packageName || 'Untitled'}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {error && <SpMutationFeedback status="error">{error}</SpMutationFeedback>}
        <div className="flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-4">
          <Button type="button" onClick={submit} disabled={pending}>{pending ? 'Saving…' : 'Save FAQ'}</Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>Cancel</Button>
        </div>
      </div>
    </SpCard>
  );
}

function formatEnum(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}

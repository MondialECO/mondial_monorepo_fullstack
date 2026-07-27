'use client';

import { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Copy, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  const del = useDeleteFaq();
  const dup = useDuplicateFaq();
  const pub = usePublishFaq();
  const unpub = useUnpublishFaq();
  const reorder = useReorderFaqs();

  const [editing, setEditing] = useState<ServiceFaq | null>(null);
  const [adding, setAdding] = useState(false);

  const sorted = [...faqs].sort((a, b) => a.displayOrder - b.displayOrder);

  const move = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const reordered = [...sorted];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    await reorder.mutateAsync([listingId, { items: reordered.map((f, i) => ({ faqId: f.id, displayOrder: i })) }]);
  };

  return (
    <div className="space-y-4">
      {sorted.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground">No FAQs yet. Add one to answer common client questions.</p>
      )}

      {sorted.map((faq, i) => (
        <Card key={faq.id}>
          <CardContent className="space-y-2 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{faq.question}</p>
                <p className="mt-1 text-sm text-muted-foreground">{faq.answer}</p>
              </div>
              <Badge variant={faq.status === 'Published' ? 'success' : 'secondary'}>{faq.status}</Badge>
            </div>
            {faq.conflictWarning && (
              <p className="inline-flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" /> {faq.conflictWarning}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <Button size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}><ChevronUp className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === sorted.length - 1}><ChevronDown className="h-4 w-4" /></Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(faq); setAdding(false); }}><Pencil className="h-3.5 w-3.5" /> Edit</Button>
              <Button size="sm" variant="outline" onClick={() => dup.mutate([faq.id])}><Copy className="h-3.5 w-3.5" /> Duplicate</Button>
              {faq.status === 'Published'
                ? <Button size="sm" variant="outline" onClick={() => unpub.mutate([faq.id])}>Unpublish</Button>
                : <Button size="sm" variant="outline" onClick={() => pub.mutate([faq.id])}>Publish</Button>}
              <Button size="sm" variant="ghost" onClick={() => del.mutate([faq.id])}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {editing && (
        <FaqForm
          key={editing.id}
          packages={packages}
          initial={editing}
          onCancel={() => setEditing(null)}
          onSubmit={async (payload) => { await update.mutateAsync([editing.id, payload]); setEditing(null); }}
          pending={update.isPending}
        />
      )}

      {adding ? (
        <FaqForm
          packages={packages}
          onCancel={() => setAdding(false)}
          onSubmit={async (payload) => { await add.mutateAsync([listingId, payload]); setAdding(false); }}
          pending={add.isPending}
        />
      ) : (
        !editing && <Button variant="outline" onClick={() => setAdding(true)}>Add FAQ</Button>
      )}
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
      setError('Could not save the FAQ (a duplicate question, perhaps). Try again.');
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <Field label="Question" htmlFor="faq-q">
          <Input id="faq-q" value={question} onChange={(e) => setQuestion(e.target.value)} />
        </Field>
        <Field label="Answer" htmlFor="faq-a">
          <Textarea id="faq-a" rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Visibility" htmlFor="faq-vis">
            <EnumSelect labelFor="faq-vis" value={visibility} onChange={setVisibility} options={FAQ_VISIBILITIES} />
          </Field>
          <Field label="Applies to package" htmlFor="faq-pkg">
            <select
              id="faq-pkg"
              value={packageId}
              onChange={(e) => setPackageId(e.target.value)}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All packages</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>{p.packageType} — {p.packageTitle || p.packageName}</option>
              ))}
            </select>
          </Field>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center gap-3">
          <Button onClick={submit} disabled={pending}>{pending ? 'Saving…' : 'Save FAQ'}</Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { Clock3, Plus } from 'lucide-react';
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
import { SpCard, SpEmptyState, SpFormField, SpMutationFeedback, SpSectionHeader } from '@/components/serviceprovider/ui';
import { useAddTimeEntry } from '@/hooks/queries/workroom';
import type { WorkroomDetail } from '@/types/workroom';
import { apiError, formatDate, localDateTime } from './_shared';

export function TimeEntriesPanel({ data, readOnly }: { data: WorkroomDetail; readOnly: boolean }) {
  const mutation = useAddTimeEntry();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ startedAt: '', endedAt: '', description: '' });
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const totalHours = useMemo(() => data.hourlyTimeEntries.reduce((sum, item) => sum + Math.max(0, new Date(item.endedAt).getTime() - new Date(item.startedAt).getTime()) / 3_600_000, 0), [data.hourlyTimeEntries]);
  const duration = form.startedAt && form.endedAt ? (new Date(form.endedAt).getTime() - new Date(form.startedAt).getTime()) / 3_600_000 : 0;

  const submit = async () => {
    setFeedback(null);
    try {
      await mutation.mutateAsync({ id: data.engagement.id, payload: { startedAt: new Date(form.startedAt).toISOString(), endedAt: new Date(form.endedAt).toISOString(), description: form.description.trim() } });
      setFeedback({ status: 'success', message: 'Time entry recorded for client and invoice review.' });
      setOpen(false); setForm({ startedAt: '', endedAt: '', description: '' });
    } catch (error) { setFeedback({ status: 'error', message: apiError(error, 'The time entry could not be recorded.') }); }
  };

  return <div className="space-y-6">{feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}<SpCard><SpSectionHeader title="Hourly time entries" description={`${totalHours.toFixed(2)} recorded hours · ${data.contract.terms.weeklyHourLimit ?? 'No'} weekly-hour limit`} action={!readOnly && <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="size-4" aria-hidden="true" /> Add entry</Button>} />{data.hourlyTimeEntries.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b border-[#E5E7EB] text-xs uppercase tracking-[0.08em] text-[#6B7280]"><th className="px-3 py-3">Date</th><th className="px-3 py-3">Time range</th><th className="px-3 py-3">Duration</th><th className="px-3 py-3">Description</th></tr></thead><tbody>{data.hourlyTimeEntries.map((item) => <tr key={item.id} className="border-b border-[#E5E7EB] last:border-0"><td className="px-3 py-4">{formatDate(item.startedAt)}</td><td className="px-3 py-4">{time(item.startedAt)} – {time(item.endedAt)}</td><td className="px-3 py-4 font-semibold">{hours(item.startedAt, item.endedAt)}</td><td className="px-3 py-4 text-[#374151]">{item.description}</td></tr>)}</tbody></table></div> : <SpEmptyState icon={Clock3} title="No time entries" description="Completed time ranges will appear here for hourly contract review." className="mt-5 min-h-52 border-0 p-0" />}</SpCard><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Add a completed time entry</DialogTitle><DialogDescription>Only completed ranges can be recorded. Entries remain pending until the supported client review process approves them.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><SpFormField id="time-start" label="Started" required><Input type="datetime-local" max={localDateTime()} value={form.startedAt} onChange={(event) => setForm({ ...form, startedAt: event.target.value })} /></SpFormField><SpFormField id="time-end" label="Ended" required><Input type="datetime-local" max={localDateTime()} value={form.endedAt} onChange={(event) => setForm({ ...form, endedAt: event.target.value })} /></SpFormField></div><SpFormField id="time-description" label="Work completed" required><Textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={4} /></SpFormField>{duration > 0 && <p className="text-sm text-[#6B7280]">Duration: {duration.toFixed(2)} hours</p>}<DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>Cancel</Button><Button type="button" onClick={submit} disabled={duration <= 0 || !form.description.trim() || mutation.isPending}>{mutation.isPending ? 'Saving…' : 'Save time entry'}</Button></DialogFooter></DialogContent></Dialog></div>;
}

function time(value: string) { return new Intl.DateTimeFormat(undefined, { timeStyle: 'short' }).format(new Date(value)); }
function hours(start: string, end: string) { return `${((new Date(end).getTime() - new Date(start).getTime()) / 3_600_000).toFixed(2)}h`; }

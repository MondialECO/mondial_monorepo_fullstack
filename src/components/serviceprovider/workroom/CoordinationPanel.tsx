'use client';

import { useState, type ReactNode } from 'react';
import { ClipboardList, Plus, UserRoundCheck } from 'lucide-react';
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
import { SpCard, SpEmptyState, SpFormField, SpMutationFeedback, SpSectionHeader, SpStatusBadge } from '@/components/serviceprovider/ui';
import { useCreateWorkroomTask, useRequestClientInput } from '@/hooks/queries/workroom';
import type { WorkroomDetail } from '@/types/workroom';
import { apiError, formatDate, localDateTime, words } from './_shared';

export function CoordinationPanel({ data, readOnly }: { data: WorkroomDetail; readOnly: boolean }) {
  const createTask = useCreateWorkroomTask();
  const requestInput = useRequestClientInput();
  const [taskOpen, setTaskOpen] = useState(false);
  const [inputOpen, setInputOpen] = useState(false);
  const [task, setTask] = useState({ title: '', description: '', milestoneId: '', dueDate: '', visibility: 'ClientVisible' });
  const [clientInput, setClientInput] = useState({ type: 'Clarification', description: '', milestoneId: '', dueDate: '', deliveryImpact: '' });
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  const saveTask = async () => {
    setFeedback(null);
    try {
      await createTask.mutateAsync({ id: data.engagement.id, payload: { ...task, milestoneId: task.milestoneId || null, dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null } });
      setFeedback({ status: 'success', message: 'Task created. Task status remains server-owned and read-only in this interface.' });
      setTaskOpen(false); setTask({ title: '', description: '', milestoneId: '', dueDate: '', visibility: 'ClientVisible' });
    } catch (error) { setFeedback({ status: 'error', message: apiError(error, 'The task could not be created.') }); }
  };

  const sendInput = async () => {
    setFeedback(null);
    try {
      await requestInput.mutateAsync({ id: data.engagement.id, payload: { ...clientInput, milestoneId: clientInput.milestoneId || null, dueDate: clientInput.dueDate ? new Date(clientInput.dueDate).toISOString() : null } });
      setFeedback({ status: 'success', message: 'Client input requested. Project deadlines were not changed automatically.' });
      setInputOpen(false); setClientInput({ type: 'Clarification', description: '', milestoneId: '', dueDate: '', deliveryImpact: '' });
    } catch (error) { setFeedback({ status: 'error', message: apiError(error, 'The client-input request could not be sent.') }); }
  };

  return (
    <div className="space-y-6">
      {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}
      <div className="grid gap-6 xl:grid-cols-2">
        <SpCard>
          <SpSectionHeader title="Tasks" description="Task status is displayed from the server. This API currently supports creation, not provider-side status changes." action={!readOnly && <Button type="button" size="sm" variant="outline" onClick={() => setTaskOpen(true)}><Plus className="size-4" aria-hidden="true" /> Add task</Button>} />
          {data.tasks.length ? <ul className="mt-5 space-y-3">{data.tasks.map((item) => <li key={item.id} className="rounded-xl border border-[#E5E7EB] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#171717]">{item.title}</p><p className="mt-1 text-sm leading-6 text-[#6B7280]">{item.description || 'No description.'}</p></div><SpStatusBadge>{words(item.status)}</SpStatusBadge></div><p className="mt-3 text-xs text-[#6B7280]">Due {formatDate(item.dueDate)}</p></li>)}</ul> : <SpEmptyState icon={ClipboardList} title="No tasks yet" description="Add a client-visible or provider-private coordination task." className="mt-5 min-h-52 border-0 p-0" />}
        </SpCard>

        <SpCard>
          <SpSectionHeader title="Client input" description="Requests identify blockers explicitly. They never extend project deadlines automatically." action={!readOnly && <Button type="button" size="sm" variant="outline" onClick={() => setInputOpen(true)}><Plus className="size-4" aria-hidden="true" /> Request input</Button>} />
          {data.clientInputRequests.length ? <ul className="mt-5 space-y-3">{data.clientInputRequests.map((item) => <li key={item.id} className="rounded-xl border border-[#E5E7EB] p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#171717]">{words(item.type)}</p><p className="mt-1 text-sm leading-6 text-[#6B7280]">{item.description}</p></div><SpStatusBadge tone={item.status === 'Supplied' ? 'positive' : 'warning'}>{words(item.status)}</SpStatusBadge></div>{item.deliveryImpact && <p className="mt-3 rounded-lg bg-warning/10 px-3 py-2 text-xs text-warning">Delivery impact: {item.deliveryImpact}</p>}<p className="mt-3 text-xs text-[#6B7280]">Requested for {formatDate(item.dueDate)}</p></li>)}</ul> : <SpEmptyState icon={UserRoundCheck} title="No client input requested" description="Use this when a file, decision, clarification, or approval is blocking delivery." className="mt-5 min-h-52 border-0 p-0" />}
        </SpCard>
      </div>

      <Dialog open={taskOpen} onOpenChange={setTaskOpen}><DialogContent><DialogHeader><DialogTitle>Create a Workroom task</DialogTitle><DialogDescription>Tasks are coordination records. The current provider API does not support changing their status after creation.</DialogDescription></DialogHeader><SpFormField id="task-title" label="Task title" required><Input value={task.title} onChange={(event) => setTask({ ...task, title: event.target.value })} /></SpFormField><SpFormField id="task-description" label="Description"><Textarea value={task.description} onChange={(event) => setTask({ ...task, description: event.target.value })} rows={3} /></SpFormField><div className="grid gap-4 sm:grid-cols-2"><SpFormField id="task-milestone" label="Milestone"><Select value={task.milestoneId} onChange={(value) => setTask({ ...task, milestoneId: value })}><option value="">Project-wide</option>{data.milestones.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select></SpFormField><SpFormField id="task-due" label="Due date"><Input type="datetime-local" min={localDateTime()} value={task.dueDate} onChange={(event) => setTask({ ...task, dueDate: event.target.value })} /></SpFormField></div><DialogFooter><Button type="button" variant="outline" onClick={() => setTaskOpen(false)} disabled={createTask.isPending}>Cancel</Button><Button type="button" onClick={saveTask} disabled={!task.title.trim() || createTask.isPending}>{createTask.isPending ? 'Creating…' : 'Create task'}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={inputOpen} onOpenChange={setInputOpen}><DialogContent><DialogHeader><DialogTitle>Request client input</DialogTitle><DialogDescription>The request marks the Workroom as waiting for client input. It does not alter any deadline automatically.</DialogDescription></DialogHeader><SpFormField id="input-type" label="Input type" required><Select value={clientInput.type} onChange={(value) => setClientInput({ ...clientInput, type: value })}>{['File', 'Decision', 'Feedback', 'Approval', 'Clarification', 'Meeting'].map((item) => <option key={item} value={item}>{item}</option>)}</Select></SpFormField><SpFormField id="input-description" label="What is needed?" required><Textarea value={clientInput.description} onChange={(event) => setClientInput({ ...clientInput, description: event.target.value })} rows={4} /></SpFormField><div className="grid gap-4 sm:grid-cols-2"><SpFormField id="input-milestone" label="Milestone"><Select value={clientInput.milestoneId} onChange={(value) => setClientInput({ ...clientInput, milestoneId: value })}><option value="">Project-wide</option>{data.milestones.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</Select></SpFormField><SpFormField id="input-due" label="Requested by"><Input type="datetime-local" min={localDateTime()} value={clientInput.dueDate} onChange={(event) => setClientInput({ ...clientInput, dueDate: event.target.value })} /></SpFormField></div><SpFormField id="input-impact" label="Delivery impact"><Textarea value={clientInput.deliveryImpact} onChange={(event) => setClientInput({ ...clientInput, deliveryImpact: event.target.value })} rows={3} placeholder="Explain the impact without promising an automatic extension." /></SpFormField><DialogFooter><Button type="button" variant="outline" onClick={() => setInputOpen(false)} disabled={requestInput.isPending}>Cancel</Button><Button type="button" onClick={sendInput} disabled={!clientInput.description.trim() || requestInput.isPending}>{requestInput.isPending ? 'Sending…' : 'Send request'}</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: ReactNode }) { return <select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm text-[#171717] outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]">{children}</select>; }

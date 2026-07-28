'use client';

import { useEffect, useState } from 'react';
import { Gauge, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SpCard,
  SpFormField,
  SpMutationFeedback,
  SpSectionHeader,
  SpStatusBadge,
} from '@/components/serviceprovider/ui';
import { useCapacity, useUpdateCapacity } from '@/hooks/queries/service-catalog';

export function CapacityPanel() {
  const capacityQuery = useCapacity();
  const update = useUpdateCapacity();
  const [maximum, setMaximum] = useState(0);
  const [available, setAvailable] = useState(true);
  const [manualWhenLow, setManualWhenLow] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!capacityQuery.data) return;
    setMaximum(capacityQuery.data.maximumConcurrentOrders);
    setAvailable(capacityQuery.data.newOrderAvailability);
    setManualWhenLow(capacityQuery.data.manualApprovalWhenCapacityLow);
  }, [capacityQuery.data]);

  if (capacityQuery.isLoading) {
    return <Skeleton className="h-80 w-full rounded-2xl" aria-label="Loading provider capacity" />;
  }

  if (capacityQuery.isError || !capacityQuery.data) {
    return (
      <SpMutationFeedback status="error">
        <div className="flex flex-wrap items-center gap-3">
          <span>Your capacity settings could not be loaded.</span>
          <button
            type="button"
            onClick={() => capacityQuery.refetch()}
            className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
          >
            Try again
          </button>
        </div>
      </SpMutationFeedback>
    );
  }

  const data = capacityQuery.data;
  const save = async () => {
    setFeedback(null);
    try {
      await update.mutateAsync({
        maximumConcurrentOrders: Math.max(0, maximum),
        newOrderAvailability: available,
        manualApprovalWhenCapacityLow: manualWhenLow,
      });
      setFeedback({ status: 'success', message: 'Capacity settings saved successfully.' });
    } catch {
      setFeedback({ status: 'error', message: 'Capacity settings could not be saved. Try again.' });
    }
  };

  const statusTone =
    data.capacityStatus === 'Available'
      ? 'positive'
      : data.capacityStatus === 'Limited'
        ? 'warning'
        : 'negative';

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <SpCard>
        <SpSectionHeader
          title="Capacity settings"
          description="Control whether new orders can be accepted and how the platform behaves as active engagements approach your limit."
          action={<SpStatusBadge tone={statusTone}>{formatEnum(data.capacityStatus)}</SpStatusBadge>}
        />

        <div className="mt-6 space-y-5">
          <SpFormField
            id="maximum-concurrent-orders"
            label="Maximum concurrent engagements"
            description="Use 0 for no numeric limit. The active count is maintained by Workroom engagements and cannot be edited here."
          >
            <Input
              type="number"
              min={0}
              value={maximum}
              onChange={(event) => setMaximum(Number(event.target.value) || 0)}
            />
          </SpFormField>

          <div className="space-y-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-[#374151]">
              <Checkbox checked={available} onChange={(event) => setAvailable(event.target.checked)} />
              <span>
                <span className="block font-semibold text-[#171717]">Accept new orders</span>
                <span className="mt-1 block leading-5 text-[#6B7280]">Turning this off makes capacity unavailable for new orders.</span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 border-t border-[#E5E7EB] pt-3 text-sm text-[#374151]">
              <Checkbox checked={manualWhenLow} onChange={(event) => setManualWhenLow(event.target.checked)} />
              <span>
                <span className="block font-semibold text-[#171717]">Require manual approval when capacity is low</span>
                <span className="mt-1 block leading-5 text-[#6B7280]">Prevents automatic acceptance when the server marks capacity as limited.</span>
              </span>
            </label>
          </div>

          {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}

          <Button type="button" onClick={save} disabled={update.isPending}>
            {update.isPending ? 'Saving…' : 'Save capacity'}
          </Button>
        </div>
      </SpCard>

      <SpCard>
        <SpSectionHeader title="Current workload" description="Read-only values from the capacity API." />
        <div className="mt-6 flex items-center gap-4 rounded-xl bg-[#F9FAFB] p-4">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#3C61DD]">
            <Gauge className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-2xl font-semibold text-[#171717]">{data.currentActiveOrders}</p>
            <p className="text-sm text-[#6B7280]">Active engagements</p>
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
            <dt className="text-[#6B7280]">Configured limit</dt>
            <dd className="font-semibold text-[#171717]">{data.maximumConcurrentOrders || 'No limit'}</dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-b border-[#E5E7EB] pb-3">
            <dt className="text-[#6B7280]">Instant order</dt>
            <dd><SpStatusBadge tone={data.instantOrderAvailable ? 'positive' : 'warning'}>{data.instantOrderAvailable ? 'Available' : 'Blocked'}</SpStatusBadge></dd>
          </div>
        </dl>

        {!data.instantOrderAvailable && (
          <SpMutationFeedback status="info" className="mt-5">
            <span className="inline-flex items-start gap-2">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Instant ordering is currently blocked by the server-side availability and capacity rules.
            </span>
          </SpMutationFeedback>
        )}
      </SpCard>
    </div>
  );
}

function formatEnum(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}

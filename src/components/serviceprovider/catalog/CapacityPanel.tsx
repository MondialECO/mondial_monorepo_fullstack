'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useCapacity, useUpdateCapacity } from '@/hooks/queries/service-catalog';
import { Field } from './_shared';

export function CapacityPanel() {
  const { data, isLoading, isError } = useCapacity();
  const update = useUpdateCapacity();
  const [max, setMax] = useState(0);
  const [available, setAvailable] = useState(true);
  const [manualWhenLow, setManualWhenLow] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setMax(data.maximumConcurrentOrders);
      setAvailable(data.newOrderAvailability);
      setManualWhenLow(data.manualApprovalWhenCapacityLow);
    }
  }, [data]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(t);
  }, [saved]);

  if (isLoading) return <Skeleton className="h-56 w-full rounded-xl" />;
  if (isError || !data) return <p className="text-sm text-destructive">Couldn&apos;t load capacity.</p>;

  const save = async () => {
    await update.mutateAsync({
      maximumConcurrentOrders: Math.max(0, max),
      newOrderAvailability: available,
      manualApprovalWhenCapacityLow: manualWhenLow,
    });
    setSaved(true);
  };

  const statusVariant =
    data.capacityStatus === 'Available' ? 'success'
    : data.capacityStatus === 'FullyBooked' || data.capacityStatus === 'Unavailable' ? 'destructive'
    : 'warning';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          Capacity
          <Badge variant={statusVariant as 'success' | 'warning' | 'destructive'}>{data.capacityStatus}</Badge>
        </CardTitle>
        <CardDescription>
          Instant order is blocked once active orders reach your limit. Active-order counts
          are driven by engagements (a later module) — today this shows {data.currentActiveOrders} active.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Maximum concurrent orders (0 = no limit)" htmlFor="cap-max">
            <Input id="cap-max" type="number" min={0} value={max} onChange={(e) => setMax(Number(e.target.value) || 0)} />
          </Field>
          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={available} onChange={(e) => setAvailable(e.target.checked)} />
              Accepting new orders
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={manualWhenLow} onChange={(e) => setManualWhenLow(e.target.checked)} />
              Require manual approval when capacity is low
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={update.isPending}>{update.isPending ? 'Saving…' : 'Save capacity'}</Button>
          {saved && <span className="text-sm text-success-text">Saved</span>}
        </div>
      </CardContent>
    </Card>
  );
}

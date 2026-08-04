'use client';

import { BarChart3 } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { SpCard, SpEmptyState, SpSectionHeader } from '@/components/serviceprovider/ui';
import type { AnalyticsDashboard } from '@/types/analytics';

/**
 * Net earnings released, bucketed across a period.
 *
 * Shared by the Analytics "Earnings" tab and the real Earnings & Payouts page rather than
 * implemented twice. Both read the SAME server-built series — the one whose sum is pinned
 * equal to revenue.net by AnalyticsTrendIntegrationTests, with refunded milestones already
 * excluded. Bucketing client-side from the raw ledger would have meant reproducing that
 * exclusion in the browser, and a chart that disagrees with the totals printed beside it is
 * worse than no chart.
 *
 * The Overview chart's rating series is deliberately absent: a second axis on a chart headed
 * "earnings" reads as a claimed relationship that was never made.
 *
 * Granularity is whatever the server bucketed the period into — the heading reports it
 * rather than assuming weeks, so a different range changes the chart honestly instead of
 * relabelling the same shape.
 */
export function EarningsTrendChart({ data, title, description }: {
  data: AnalyticsDashboard;
  title?: string;
  description?: string;
}) {
  const points = data.trend ?? [];
  const hasEarnings = points.some((point) => point.netEarnings > 0);
  const granularity = data.trendGranularity === 'month' ? 'Monthly' : data.trendGranularity === 'day' ? 'Daily' : 'Weekly';

  return (
    <SpCard aria-labelledby="earnings-trend-title">
      <SpSectionHeader
        titleId="earnings-trend-title"
        title={title ?? `${granularity} earnings trend`}
        description={description ?? 'Net earnings released, bucketed across the selected period.'}
      />
      {!points.length || !hasEarnings ? (
        <SpEmptyState
          className="mt-5 border-0 bg-muted/40"
          icon={BarChart3}
          title="No earnings in this period"
          description="Released payments appear here once the first one lands in the selected range."
        />
      ) : (
        <div className="mt-5">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={points}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="netEarnings" name={`Net earnings (${data.currency})`} stroke="var(--color-primary)" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </SpCard>
  );
}

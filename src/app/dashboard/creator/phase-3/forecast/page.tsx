'use client';

import { useRouter } from 'next/navigation';
import { TrendingUp, BarChart3, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const FINANCIAL_DATA = [
  { name: 'Year 1', Revenue: 120000, Expenses: 104000, EBITDA: 16000 },
  { name: 'Year 2', Revenue: 480000, Expenses: 336000, EBITDA: 144000 },
  { name: 'Year 3', Revenue: 1500000, Expenses: 820000, EBITDA: 680000 },
];

export default function ForecastResultsPage() {
  const router = useRouter();
  const { state, saveOutputVersion, upsertDocument, completeStep } = useCreatorProgress();
  const project = state.project;
  const year3 = FINANCIAL_DATA[FINANCIAL_DATA.length - 1];

  const handleNext = () => {
    saveOutputVersion('financialForecastVersions', {
      status: 'forecast_generated',
      title: '3-Year Financial Forecast',
      projectName: project.name || 'AutoInvoice',
      data: FINANCIAL_DATA,
      summary: {
        year3Revenue: year3.Revenue,
        year3Ebitda: year3.EBITDA,
        ebitdaMargin: '45.3%',
        estimatedBreakeven: 'Month 8',
      },
    });
    upsertDocument({
      id: 'phase3-financial-forecast',
      name: '3_Year_Financial_Forecast.xlsx',
      category: 'Financial Model',
      size: '1.2 MB',
      phase: 3,
      step: 2,
      outputKey: 'financialForecastVersions',
    });
    completeStep(3, 2); // Step 3.2: Forecast Results
    router.push('/dashboard/creator/phase-3/business-plan');
  };

  return (
    <Phase3SetupShell
      stepEyebrow="Step 3.2"
      title="Financial Projections & Simulations"
      description={`"${project.name || 'AutoInvoice'}"-এর 3-year revenue, EBITDA, and runway calculations simulated from parameters.`}
      stepLabel="Phase 3 Step 2 of 6"
      progress={33}
    >
        <div className="grid gap-6 md:grid-cols-3">
          {/* Recharts Area Chart */}
          <Card className="md:col-span-2 rounded-2xl border border-border bg-card shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-primary" /> 3-Year EBITDA Forecast
                </CardTitle>
                <CardDescription className="text-[11px] mt-0.5">Cumulative projections based on growth curves.</CardDescription>
              </div>
              <Badge className="bg-success-light text-success-text border-0 font-bold px-2 py-0.5 text-[10px]">
                Active Simulation
              </Badge>
            </div>

            <div className="h-[260px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={FINANCIAL_DATA} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorEbitda" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success-text)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--success-text)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `€${v / 1000}k`} />
                  <Tooltip formatter={(v) => v != null ? [`€${Number(v).toLocaleString()}`] : []} contentStyle={{ background: 'var(--card)', borderColor: 'var(--border)', borderRadius: '12px' }} />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="Revenue" stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="EBITDA" stroke="var(--success-text)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEbitda)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Quick Stats Panel */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm p-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">Metrics & Runway</h3>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Conversion rate</span>
                    <span className="text-foreground">2.4%</span>
                  </div>
                  <Progress value={24} className="h-1.5 bg-muted" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Monthly churn</span>
                    <span className="text-foreground">4.8%</span>
                  </div>
                  <Progress value={48} className="h-1.5 bg-muted [&>div]:bg-warning" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-muted-foreground">Annual growth rate</span>
                    <span className="text-foreground">180%</span>
                  </div>
                  <Progress value={85} className="h-1.5 bg-muted [&>div]:bg-success-text" />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border mt-4 space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Estimated Breakeven</span>
                <span className="font-bold text-foreground">Month 8</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Year 3 EBITDA Margin</span>
                <span className="font-bold text-success-text">45.3%</span>
              </div>
            </div>
          </Card>
        </div>

        {/* P&L Table */}
        <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/10">
            <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-primary" /> P&L Projections Table
            </h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30 font-bold text-muted-foreground">
                  <th className="p-4">Line Item</th>
                  <th className="p-4">Year 1</th>
                  <th className="p-4">Year 2</th>
                  <th className="p-4">Year 3</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 font-medium text-foreground">
                <tr>
                  <td className="p-4 font-bold">Gross Revenue</td>
                  <td className="p-4">€120,000</td>
                  <td className="p-4">€480,000</td>
                  <td className="p-4">€1,500,000</td>
                </tr>
                <tr>
                  <td className="p-4">Cost of Goods Sold (COGS)</td>
                  <td className="p-4">€24,000</td>
                  <td className="p-4">€86,000</td>
                  <td className="p-4">€220,000</td>
                </tr>
                <tr className="bg-primary/5 text-primary font-bold">
                  <td className="p-4">Gross Margin (80%)</td>
                  <td className="p-4">€96,000</td>
                  <td className="p-4">€394,000</td>
                  <td className="p-4">€1,280,000</td>
                </tr>
                <tr>
                  <td className="p-4">Operating Expenses (OPEX)</td>
                  <td className="p-4">€80,000</td>
                  <td className="p-4">€250,000</td>
                  <td className="p-4">€600,000</td>
                </tr>
                <tr className="bg-success-light/30 text-success-text font-bold">
                  <td className="p-4">EBITDA</td>
                  <td className="p-4">€16,000</td>
                  <td className="p-4">€144,000</td>
                  <td className="p-4">€680,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 mt-8">
          <Button variant="ghost" onClick={() => router.back()} className="text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl self-start sm:self-center">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
          </Button>
          <Button onClick={handleNext} className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl py-5 px-6 text-sm flex items-center justify-center gap-1.5 shadow-sm">
            Proceed to Business Plan <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
    </Phase3SetupShell>
  );
}

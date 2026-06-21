'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sliders, DollarSign, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';

export default function Phase3FinancialInputPage() {
  const router = useRouter();
  const { state, updateProject, saveOutputVersion, completeStep } = useCreatorProgress();
  const project = state.project;

  const [conversionRate, setConversionRate] = useState('2.4');
  const [churnRate, setChurnRate] = useState('4.8');
  const [annualGrowth, setAnnualGrowth] = useState('180');
  const [plannedPrice, setPlannedPrice] = useState('15');
  const [startupCosts, setStartupCosts] = useState('2500');

  const handleSimulate = () => {
    const inputs = {
      plannedPrice: Number(plannedPrice),
      startupCosts: Number(startupCosts),
      conversionRate: Number(conversionRate),
      churnRate: Number(churnRate),
      annualGrowth: Number(annualGrowth),
    };

    updateProject({
      marketPotential: `Simulated at €${plannedPrice}/mo with ${conversionRate}% conv. rate and ${churnRate}% churn.`,
    });
    saveOutputVersion('financialForecastVersions', {
      status: 'inputs_saved',
      title: 'Financial Modeling Inputs',
      projectName: project.name || 'Untitled project',
      inputs,
    });
    completeStep(3, 1); // Step 3.1: Financial Input
    router.push('/dashboard/creator/phase-3/forecast');
  };

  return (
    <Phase3SetupShell
      stepEyebrow="Step 3.1"
      title="Financial Modeling Inputs"
      description={`তোমার concept "${project.name || 'Untitled project'}"-এর dynamic financial forecast build করার জন্য parameters provide করো।`}
      stepLabel="Phase 3 Step 1 of 6"
      progress={16}
    >
        <Card className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Inputs Panel Left */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Planned Customer Price (€/month)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="number"
                    value={plannedPrice}
                    onChange={(e) => setPlannedPrice(e.target.value)}
                    className="pl-9 rounded-xl border-border bg-muted/20 text-foreground"
                    placeholder="e.g. 15"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Startup Costs (€)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="number"
                    value={startupCosts}
                    onChange={(e) => setStartupCosts(e.target.value)}
                    className="pl-9 rounded-xl border-border bg-muted/20 text-foreground"
                    placeholder="e.g. 2500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Target Conversion Rate (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={conversionRate}
                  onChange={(e) => setConversionRate(e.target.value)}
                  className="rounded-xl border-border bg-muted/20 text-foreground"
                  placeholder="e.g. 2.4"
                />
              </div>
            </div>

            {/* Inputs Panel Right */}
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Target Monthly Churn (%)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={churnRate}
                  onChange={(e) => setChurnRate(e.target.value)}
                  className="rounded-xl border-border bg-muted/20 text-foreground"
                  placeholder="e.g. 4.8"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Annual Growth Rate (%)</label>
                <Input
                  type="number"
                  value={annualGrowth}
                  onChange={(e) => setAnnualGrowth(e.target.value)}
                  className="rounded-xl border-border bg-muted/20 text-foreground"
                  placeholder="e.g. 180"
                />
              </div>

              {/* Description Info Box */}
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-1 text-xs">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Smart Recommendation
                </span>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  Based on your B2B SaaS category, we recommend a price of <span className="font-bold text-foreground">€15–29/mo</span>, and a targeted churn under <span className="font-bold text-foreground">5%</span>.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6 mt-8">
          <Button variant="ghost" onClick={() => router.push('/dashboard/creator')} className="text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl self-start sm:self-center">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
          </Button>
          <Button onClick={handleSimulate} className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl py-5 px-6 text-sm flex items-center justify-center gap-1.5 shadow-sm">
            Simulate Forecasts <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
    </Phase3SetupShell>
  );
}

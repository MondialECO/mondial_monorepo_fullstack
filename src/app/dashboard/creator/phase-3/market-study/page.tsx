'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';

export default function MarketStudyPage() {
  const router = useRouter();
  const { completeStep } = useCreatorProgress();

  const handleNext = () => {
    completeStep(3, 1);
    router.push('/dashboard/creator/phase-3/business-model');
  };

  return (
    <Phase3SetupShell
      fullWidth
      stepEyebrow="Step 3.1"
      title="Market Study & Competitive Intelligence"
      description="Deep market analysis, TAM/SAM/SOM sizing, sector tailwinds, and competitor landscape benchmarking."
    >
      <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-xl">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-sm">Market Sizing &amp; Competitor Intelligence</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Explore comprehensive TAM/SAM/SOM projections, regulatory landscape indicators, and market dynamics mapped from your clarified idea.
        </p>

        <div className="flex items-center justify-between border-t border-border pt-4 mt-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/creator/phase-2/complete')}
            className="text-xs font-bold text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Phase 2 Complete
          </Button>
          <Button onClick={handleNext} className="gap-2">
            Continue to Business Model <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </Phase3SetupShell>
  );
}

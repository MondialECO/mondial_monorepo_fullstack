'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, LayoutGrid, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phase3SetupShell } from '@/components/creator/Phase3SetupShell';
import { useCreatorProgress } from '@/providers/CreatorProgressProvider';

export default function BusinessModelPage() {
  const router = useRouter();
  const { completeStep } = useCreatorProgress();

  const handleNext = () => {
    completeStep(3, 2);
    router.push('/dashboard/creator/phase-3/business-plan');
  };

  return (
    <Phase3SetupShell
      fullWidth
      stepEyebrow="Step 3.2"
      title="Business Model & Monetization Canvas"
      description="9-point business model canvas, revenue architecture, cost structure, and unit economics."
    >
      <Card className="rounded-2xl border border-border bg-card p-6 space-y-4 max-w-xl">
        <div className="flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-primary" />
          <h3 className="font-bold text-sm">Business Model Canvas</h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Structure your value propositions, key channels, revenue streams, and cost drivers grounded in your market study insights.
        </p>

        <div className="flex items-center justify-between border-t border-border pt-4 mt-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/creator/phase-3/market-study')}
            className="text-xs font-bold text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Market Study
          </Button>
          <Button onClick={handleNext} className="gap-2">
            Continue to Business Plan <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </Phase3SetupShell>
  );
}

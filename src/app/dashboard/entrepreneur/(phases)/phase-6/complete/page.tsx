'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { EntrepreneurLayout } from '@/components/entrepreneur/EntrepreneurLayout';

export default function Phase6CompletePage() {
  const router = useRouter();

  return (
    <RouteGuard requiredPhase={7}>
      <EntrepreneurLayout sidebar={<div />}>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-2xl text-center space-y-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                <CheckCircle2 className="w-24 h-24 text-primary relative" />
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-foreground">Phase 6 Complete! 🎉</h1>
              <p className="text-lg text-muted-foreground">
                Your data room has been published and is ready for investor access.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">📊 Live Data Room</p>
                <p className="text-xs text-muted-foreground">
                  Your documents are now publicly accessible to authorized investors.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">🔒 NDA Protected</p>
                <p className="text-xs text-muted-foreground">
                  Investors must sign your NDA before accessing sensitive documents.
                </p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-foreground">📈 Analytics Ready</p>
                <p className="text-xs text-muted-foreground">
                  Track investor engagement and monitor document access activity.
                </p>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 space-y-2">
              <p className="text-sm font-medium text-primary">
                ✨ Your data room is now live and ready for investor diligence.
              </p>
              <p className="text-xs text-muted-foreground">
                Investors with valid access grants can now view and download your published documents.
                Monitor their engagement from the data room dashboard.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/entrepreneur/phase-6')}
              >
                Back to Data Room
              </Button>
              <Button
                onClick={() => router.push('/dashboard/entrepreneur/phase-7')}
                className="gap-2"
              >
                Continue to Phase 7
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground pt-8">
              Phase 6 submitted for compliance review. You'll be notified when verification is complete.
            </p>
          </div>
        </div>
      </EntrepreneurLayout>
    </RouteGuard>
  );
}

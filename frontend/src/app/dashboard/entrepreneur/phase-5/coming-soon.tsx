'use client';

import { useRouter } from 'next/navigation';
import { Clock, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ComingSoonPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl w-24 h-24 mx-auto"></div>
            <Clock className="w-16 h-16 text-primary relative z-10 mx-auto" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-neutral-1 mb-3">Advisor Matching</h1>
          <p className="text-lg text-neutral-5 mb-4">
            Connect with experienced advisors to guide your company&apos;s growth
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg mb-6">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Coming Soon</span>
          </div>
        </div>

        {/* Feature List */}
        <div className="bg-white rounded-lg border border-neutral-2 p-6 mb-8 space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">1</span>
            </div>
            <div>
              <h3 className="font-medium text-neutral-1 text-sm">AI-Powered Matching</h3>
              <p className="text-xs text-neutral-5 mt-1">Find advisors aligned with your industry and stage</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">2</span>
            </div>
            <div>
              <h3 className="font-medium text-neutral-1 text-sm">Expert Network</h3>
              <p className="text-xs text-neutral-5 mt-1">Access vetted advisors with proven track records</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">3</span>
            </div>
            <div>
              <h3 className="font-medium text-neutral-1 text-sm">Seamless Collaboration</h3>
              <p className="text-xs text-neutral-5 mt-1">Schedule calls and track advisor interactions</p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Status:</span> Our backend team is currently developing the advisor matching API. This feature will be available in the next phase.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={() => router.push('/dashboard/entrepreneur/phase-6')}
          >
            Continue to Phase 6 <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/dashboard/entrepreneur')}
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-neutral-5 text-center mt-8">
          Phase 5 of 9 • Estimated availability: Next quarter
        </p>
      </div>
    </div>
  );
}

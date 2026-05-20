'use client';

import Link from 'next/link';
import { CheckCircle, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Phase1Page() {
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-green-100">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-foreground">
                Phase 1: Identity & Onboarding
              </h1>
              <p className="text-lg text-muted-foreground mt-2">
                KYC verified, Tier 2 access unlocked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <span className="font-semibold text-green-600">Completed</span>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-green-900">Status: Verified</h2>
              <span className="px-4 py-2 rounded-lg bg-green-100 text-green-700 font-semibold text-sm">
                +44 Trust Score
              </span>
            </div>
            <p className="text-green-800">
              Your identity has been successfully verified. You now have Tier 2 access and can proceed to the next phase.
            </p>
          </div>
        </div>

        {/* Verification Details */}
        <div className="border border-border rounded-2xl p-6 bg-background space-y-6">
          <h3 className="text-xl font-bold text-foreground">Verification Details</h3>

          <div className="space-y-4">
            {[
              { label: 'Legal Name', value: 'Verified ✓' },
              { label: 'Email Address', value: 'Verified ✓' },
              { label: 'Phone Number', value: 'Verified ✓' },
              { label: 'Government ID', value: 'Verified ✓' },
              { label: 'Address Verification', value: 'Verified ✓' },
              { label: 'Access Level', value: 'Tier 2' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between pb-4 border-b border-border last:border-0">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="font-semibold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="border border-border rounded-2xl p-6 bg-background space-y-6">
          <h3 className="text-xl font-bold text-foreground">What&apos;s Next?</h3>
          <p className="text-muted-foreground">
            Now that your identity is verified, you can proceed to Phase 2: Company Verification. In this phase, you&apos;ll set up your company profile and get verified with an official company badge.
          </p>

          <Button asChild size="lg" className="w-full md:w-auto">
            <Link href="/dashboard/entrepreneur/phase-2">
              Continue to Phase 2: Company Verification
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Back to Overview */}
        <div>
          <Button variant="outline" asChild>
            <Link href="/dashboard/entrepreneur">
              Back to Overview
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

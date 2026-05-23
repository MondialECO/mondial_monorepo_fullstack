'use client';

import { Suspense } from 'react';
import SignupOnboardingContent from './content';

export default function SignupOnboarding() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SignupOnboardingContent />
    </Suspense>
  );
}

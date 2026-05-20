'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Phase5Client() {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
      <Button variant="outline" onClick={() => router.push('/dashboard/entrepreneur')}>
        Back to Dashboard
      </Button>
      <Button onClick={() => router.push('/dashboard/entrepreneur/phase-2/step-6')} className="gap-2">
        Go to Phase 6 <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

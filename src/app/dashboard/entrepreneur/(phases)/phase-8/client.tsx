'use client';

import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEntrepreneurProgress } from '@/hooks/useEntrepreneurProgress';

export default function Phase8Client() {
  const router = useRouter();
  const { moveToNextStep } = useEntrepreneurProgress();

  const handleContinue = () => {
    moveToNextStep(8, 1);
    router.push('/dashboard/entrepreneur/phase-9');
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-between">
      <Button variant="outline" onClick={() => router.back()}>Back</Button>
      <Button onClick={handleContinue}>
        Go to Phase 9 <TrendingUp className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

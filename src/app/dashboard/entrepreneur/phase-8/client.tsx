'use client';

import { useRouter } from 'next/navigation';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Phase8Client() {
  const router = useRouter();

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-between">
      <Button variant="outline" onClick={() => router.back()}>Back</Button>
      <Button onClick={() => router.push('/dashboard/entrepreneur/phase-9')}>
        Go to Phase 9 <TrendingUp className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

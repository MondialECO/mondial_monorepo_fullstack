'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Phase9Client() {
  const router = useRouter();

  return (
    <div className="flex gap-3">
      <Button variant="outline" onClick={() => router.back()}>Back to Phase 8</Button>
      <Button onClick={() => router.push('/dashboard/entrepreneur')}>Complete & Return Home</Button>
    </div>
  );
}

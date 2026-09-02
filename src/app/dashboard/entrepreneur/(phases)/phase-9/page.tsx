'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Phase9Page() {
  const router = useRouter();

  useEffect(() => {
    if (router?.replace) {
      router.replace('/dashboard/entrepreneur/deals');
    } else if (router?.push) {
      router.push('/dashboard/entrepreneur/deals');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
      Redirecting to Deals &amp; Term Sheets...
    </div>
  );
}

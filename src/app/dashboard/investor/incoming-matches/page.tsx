'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InvestorIncomingMatchesPage() {
  const router = useRouter();

  useEffect(() => {
    if (router?.replace) {
      router.replace('/dashboard/investor/discovery');
    } else if (router?.push) {
      router.push('/dashboard/investor/discovery');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center p-12 text-sm text-muted-foreground">
      Redirecting to Discover Opportunities...
    </div>
  );
}

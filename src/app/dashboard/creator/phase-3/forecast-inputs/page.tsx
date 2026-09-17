'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ForecastInputsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/creator/phase-3/forecast');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground gap-2 font-sans text-xs">
      <Loader2 className="h-4 w-4 animate-spin text-primary" /> Redirecting to Financial Forecast…
    </div>
  );
}

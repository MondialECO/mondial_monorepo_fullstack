'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import PartnershipActiveScreen from '@/components/marketplace/PartnershipActiveScreen';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function CreatorPartnershipDetailPage() {
  const params = useParams();
  const dealId = params?.dealId as string;

  if (!dealId) return null;

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 text-foreground font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <Button asChild variant="ghost" size="sm" className="gap-2 text-xs text-muted-foreground hover:text-foreground">
          <Link href="/dashboard/creator/partnerships">
            <ArrowLeft className="w-4 h-4" />
            Back to My Partnerships
          </Link>
        </Button>
      </div>

      <PartnershipActiveScreen dealId={dealId} isCreator={true} />
    </div>
  );
}

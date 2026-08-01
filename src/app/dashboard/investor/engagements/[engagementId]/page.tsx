'use client';

import { useParams } from 'next/navigation';
import { EngagementDetail } from '@/components/marketplace/EngagementDetail';

export default function InvestorEngagementDetailPage() {
  const params = useParams();
  const engagementId = Array.isArray(params.engagementId)
    ? params.engagementId[0]
    : params.engagementId ?? '';

  return (
    <EngagementDetail basePath="/dashboard/investor/engagements" engagementId={engagementId} />
  );
}

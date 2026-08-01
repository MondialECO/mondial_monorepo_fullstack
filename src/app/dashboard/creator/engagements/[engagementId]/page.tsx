'use client';

import { useParams } from 'next/navigation';
import { EngagementDetail } from '@/components/marketplace/EngagementsPlaceholder';

export default function CreatorEngagementDetailPage() {
  const params = useParams();
  const engagementId = Array.isArray(params.engagementId)
    ? params.engagementId[0]
    : params.engagementId ?? '';

  return (
    <EngagementDetail basePath="/dashboard/creator/engagements" engagementId={engagementId} />
  );
}

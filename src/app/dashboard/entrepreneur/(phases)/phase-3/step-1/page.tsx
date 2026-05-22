'use client';

import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { Phase3RevenueInputClient } from './revenue-input-client';

export default function Phase3Step1Page() {
  return (
    <RouteGuard requiredPhase={3} requiredStep={1}>
      <Phase3RevenueInputClient />
    </RouteGuard>
  );
}

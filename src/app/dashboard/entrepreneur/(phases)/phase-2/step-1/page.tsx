import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import Phase2Step1Client from './client';

export default function Phase2Step1Page() {
  return (
    <RouteGuard requiredPhase={2} requiredStep={1}>
      <Phase2Step1Client />
    </RouteGuard>
  );
}

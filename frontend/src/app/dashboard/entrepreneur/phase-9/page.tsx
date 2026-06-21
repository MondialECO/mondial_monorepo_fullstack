import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import DealExecutionClient from './client';

export const metadata = {
  title: 'Deal Execution | Mondial',
  description: 'Manage and close investment deals',
};

export default function Phase9Page() {
  return (
    <RouteGuard requiredPhase={9}>
      <DealExecutionClient />
    </RouteGuard>
  );
}

import { RouteGuard } from '@/components/layout/RouteGuard';
import InvestorMatchingClient from './client';

export const metadata = {
  title: 'Investor Matching | Mondial',
  description: 'Find and interact with matched investors',
};

export default function Phase8Page() {
  return (
    <RouteGuard requiredPhase={8}>
      <InvestorMatchingClient />
    </RouteGuard>
  );
}

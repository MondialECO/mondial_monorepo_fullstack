import { RouteGuard } from '@/components/layout/RouteGuard';
import ComingSoonPage from './coming-soon';

export const metadata = {
  title: 'Advisor Matching | Mondial',
  description: 'Find and connect with experienced advisors',
};

export default function Phase5Page() {
  return (
    <RouteGuard requiredPhase={5}>
      <ComingSoonPage />
    </RouteGuard>
  );
}

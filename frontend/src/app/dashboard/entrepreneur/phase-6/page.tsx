import { RouteGuard } from '@/components/layout/RouteGuard';
import DataRoomClient from './client';

export const metadata = {
  title: 'Data Room | Mondial',
  description: 'Manage your secure data room for investor access',
};

export default function Phase6Page() {
  return (
    <RouteGuard requiredPhase={6}>
      <DataRoomClient />
    </RouteGuard>
  );
}

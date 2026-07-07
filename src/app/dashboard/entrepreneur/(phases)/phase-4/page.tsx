'use client';

import { RouteGuard } from '@/components/entrepreneur/RouteGuard';
import { Phase4TabbedView } from '@/components/entrepreneur/equity/Phase4TabbedView';

function Phase4PageContent() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        <Phase4TabbedView />
      </div>
    </div>
  );
}

export default function Phase4Page() {
  return (
    <RouteGuard requiredPhase={4}>
      <Phase4PageContent />
    </RouteGuard>
  );
}

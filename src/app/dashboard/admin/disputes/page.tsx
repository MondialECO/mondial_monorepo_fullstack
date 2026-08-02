import { DisputeResolutionPanel } from '@/components/admin/workroom/DisputeResolutionPanel';

export const metadata = {
  title: 'Dispute Resolution | Mondial',
  description: 'Resolve escrow disputes raised inside a workroom milestone.',
};

export default function AdminDisputesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">Dispute Resolution</h1>
        <p className="text-sm text-muted-foreground">
          Admin is the only actor that can settle a milestone dispute. Resolving one moves
          escrow and recalculates the provider&apos;s trust signals, so it cannot be undone
          from the interface.
        </p>
      </div>
      <DisputeResolutionPanel />
    </div>
  );
}

import { PendingVerificationQueue } from '@/components/admin/serviceprovider/PendingVerificationQueue';

export const metadata = {
  title: 'Provider Verifications | Mondial',
  description: 'Review and moderate service-provider verification submissions.',
};

export default function AdminServiceProvidersPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">
          Provider Verifications
        </h1>
        <p className="text-sm text-muted-foreground">
          Review submitted service-provider profiles and approve or reject them.
        </p>
      </div>
      <PendingVerificationQueue />
    </div>
  );
}

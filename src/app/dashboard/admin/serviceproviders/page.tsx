import { PendingVerificationQueue } from '@/components/admin/serviceprovider/PendingVerificationQueue';

export const metadata = {
  title: 'Provider Verifications | Mondial',
  description: 'Moderate service-provider verification remediation.',
};

export default function AdminServiceProvidersPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold text-foreground">
          Provider Verifications
        </h1>
        <p className="text-sm text-muted-foreground">
          Review remediated profiles after an admin rejection. Complete first
          submissions are verified automatically.
        </p>
      </div>
      <PendingVerificationQueue />
    </div>
  );
}

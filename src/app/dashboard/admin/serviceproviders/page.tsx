import { UserCheck } from 'lucide-react';
import { AdminPageHeader } from '@/components/admin/shared';
import { PendingVerificationQueue } from '@/components/admin/serviceprovider/PendingVerificationQueue';

export const metadata = {
  title: 'Provider Verifications | Mondial',
  description: 'Moderate service-provider verification remediation.',
};

export default function AdminServiceProvidersPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-8">
      <AdminPageHeader
        title="Provider Verifications"
        description="Review remediated profiles after an admin rejection. Complete first submissions are verified automatically."
        badge="PROVIDERS"
        icon={UserCheck}
        backHref="/dashboard/admin/verifications"
        backLabel="Back to Verification Hub"
      />
      <PendingVerificationQueue />
    </div>
  );
}

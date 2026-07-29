import { Suspense } from 'react';
import { ProfileView } from '@/components/serviceprovider/profile/ProfileView';

export const metadata = {
  title: 'Provider Profile | Mondial',
  description: 'Your published service provider profile, portfolio, and verification.',
};

export default function ServiceProviderProfilePage() {
  // Read-only published profile. Editing lives on the separate editor route;
  // legacy `?view=edit` links are normalized to it inside ProfileView.
  return (
    <Suspense fallback={null}>
      <ProfileView mode="owner" />
    </Suspense>
  );
}

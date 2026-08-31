import { Suspense } from 'react';
import { ProfileView } from '@/components/serviceprovider/profile/ProfileView';

export const metadata = {
  title: 'My Profile | Mondial',
  description: 'Your universal professional profile, experiences, and credentials.',
};

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileView mode="owner" />
    </Suspense>
  );
}

import { Suspense } from 'react';
import { ProfileEditorWorkspace } from '@/components/serviceprovider/profile/editor/ProfileEditorWorkspace';

export const metadata = {
  title: 'Edit Profile | Mondial',
  description: 'Update your universal profile and professional credentials.',
};

export default function ProfileEditPage() {
  return (
    <Suspense fallback={null}>
      <ProfileEditorWorkspace />
    </Suspense>
  );
}

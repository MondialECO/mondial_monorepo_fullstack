import { Suspense } from "react";
import { ProfileEditorWorkspace } from "@/components/serviceprovider/profile/editor/ProfileEditorWorkspace";

export const metadata = {
  title: "Edit Profile | Mondial",
  description: "Update your Service Provider profile in four guided steps.",
};

export default function ServiceProviderProfileEditPage() {
  // The editor reads its step from the URL, so it needs a Suspense boundary.
  return (
    <Suspense fallback={null}>
      <ProfileEditorWorkspace />
    </Suspense>
  );
}

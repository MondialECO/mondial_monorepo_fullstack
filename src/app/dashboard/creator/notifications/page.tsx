import { Suspense } from "react";
import type { Metadata } from "next";
import SharedNotificationsPage from "@/components/notifications/SharedNotificationsPage";

export const metadata: Metadata = {
  title: "Notifications | Mondial Creator",
  description: "Stay updated on your projects, deals, messages, and platform activity.",
};

export default function CreatorNotificationsPage() {
  return (
    <Suspense fallback={null}>
      <SharedNotificationsPage role="Creator" />
    </Suspense>
  );
}

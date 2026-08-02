import { Suspense } from "react";
import MessagingWorkspace from "@/components/messaging/MessagingWorkspace";

export default function ServiceProviderMessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagingWorkspace />
    </Suspense>
  );
}

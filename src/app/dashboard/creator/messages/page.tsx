import { Suspense } from "react";
import MessagingWorkspace from "@/components/messaging/MessagingWorkspace";

export default function CreatorMessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagingWorkspace />
    </Suspense>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import MessagingWorkspace from "@/components/messaging/MessagingWorkspace";

export const metadata: Metadata = {
  title: "Messages | Mondial Creator",
  description: "Real-time direct messaging between creators, entrepreneurs, investors, and platform partners.",
};

export default function CreatorMessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagingWorkspace />
    </Suspense>
  );
}

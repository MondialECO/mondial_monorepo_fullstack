import { CreatorProgressProvider } from "@/providers/CreatorProgressProvider";
import CreatorPhaseGuard from "@/components/layout/CreatorPhaseGuard";
import { CreatorConflictNotice } from "@/components/creator/CreatorConflictNotice";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CreatorProgressProvider>
      <CreatorConflictNotice />
      <CreatorPhaseGuard>
        {children}
      </CreatorPhaseGuard>
    </CreatorProgressProvider>
  );
}

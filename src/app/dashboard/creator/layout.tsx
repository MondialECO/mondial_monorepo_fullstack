import { CreatorProgressProvider } from "@/providers/CreatorProgressProvider";
import CreatorPhaseGuard from "@/components/layout/CreatorPhaseGuard";
import CreatorHumainXQuickStartGuard from "@/components/layout/CreatorHumainXQuickStartGuard";
import { CreatorConflictNotice } from "@/components/creator/CreatorConflictNotice";
import { CreatorActiveIdeaSync } from "@/components/creator/CreatorActiveIdeaSync";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CreatorProgressProvider>
      <CreatorActiveIdeaSync />
      <CreatorConflictNotice />
      <CreatorHumainXQuickStartGuard>
        <CreatorPhaseGuard>
          {children}
        </CreatorPhaseGuard>
      </CreatorHumainXQuickStartGuard>
    </CreatorProgressProvider>
  );
}

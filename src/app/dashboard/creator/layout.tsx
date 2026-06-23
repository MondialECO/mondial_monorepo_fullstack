import { CreatorProgressProvider } from "@/providers/CreatorProgressProvider";
import CreatorPhaseGuard from "@/components/layout/CreatorPhaseGuard";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CreatorProgressProvider>
      <CreatorPhaseGuard>
        {children}
      </CreatorPhaseGuard>
    </CreatorProgressProvider>
  );
}

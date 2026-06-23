import { SidebarProvider } from "@/components/ui/sidebar";
import Topbar from "@/components/layout/Topbar";
import AuthGuard from "@/components/layout/AuthGuard";

// EntrepreneurProgressProvider is now supplied once at the entrepreneur root
// layout (../layout.tsx) so the overview, phases, deals and messages all share
// a single provider instance. It must NOT be re-declared here, or phase routes
// would mount a second, conflicting state instance.
export default function PhaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-screen w-full flex-col">
          {/* Topbar full width */}
          {/* <Topbar /> */}

          {/* Content full width (no sidebar) */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}

import { SidebarProvider } from "@/components/ui/sidebar";
import Topbar from "@/components/layout/Topbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { EntrepreneurProgressProvider } from "@/providers/EntrepreneurProgressProvider";

export default function PhaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <EntrepreneurProgressProvider>
        <SidebarProvider>
          <div className="flex min-h-screen w-full flex-col">
            {/* Topbar full width */}
            <Topbar />

            {/* Content full width (no sidebar) */}
            <main className="flex-1 overflow-auto p-4 md:p-6">
              {children}
            </main>
          </div>
        </SidebarProvider>
      </EntrepreneurProgressProvider>
    </AuthGuard>
  );
}

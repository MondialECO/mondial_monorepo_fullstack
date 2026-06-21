
"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import Topbar from "@/components/layout/Topbar";
import AuthGuard from "@/components/layout/AuthGuard";
import OnboardingGuard from "@/components/layout/OnboardingGuard";
import IdentityGateModal from "@/components/onboarding/IdentityGateModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPhase2 = pathname?.includes("/dashboard/creator/phase-2");
  const isPhase3 = pathname?.includes("/dashboard/creator/phase-3");
  const isCreatorMessenger = pathname?.includes("/dashboard/creator/messenger");
  const isServiceProviderMessenger = pathname?.includes("/dashboard/serviceprovider/messenger");

  if (isPhase2 || isPhase3 || isCreatorMessenger || isServiceProviderMessenger) {
    return (
      <AuthGuard>
        <OnboardingGuard>
          <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
            {children}
          </div>
        </OnboardingGuard>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <OnboardingGuard>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">

            {/* LEFT: SIDEBAR */}
            <AppSidebar />

            {/* RIGHT: TOPBAR + CONTENT */}
            <div className="flex flex-1 flex-col">

              {/* Topbar only takes CONTENT width */}
              <Topbar />

              {/* Content */}
              <main className="flex-1 overflow-auto p-4 md:p-6">
                {children}
              </main>

            </div>
          </div>

          {/* Universal Identity Gate — overlays all dashboard pages */}
          <IdentityGateModal />
        </SidebarProvider>
      </OnboardingGuard>
    </AuthGuard>
  );
}

"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import Topbar from "@/components/layout/Topbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { SpMobileHeader } from "@/components/serviceprovider/SpMobileHeader";
import { SpDesktopTopbar } from "@/components/serviceprovider/SpDesktopTopbar";
import { SpSandboxNotice } from "@/components/serviceprovider/SpSandboxNotice";
import { isPhase2ChromeRoute } from "@/lib/layout-config";
import { isServiceProviderRoute } from "@/lib/service-provider-navigation";
import { EntrepreneurProgressProvider } from "@/providers/EntrepreneurProgressProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPhase2 = isPhase2ChromeRoute(pathname);
  const isServiceProvider = isServiceProviderRoute(pathname);
  const isCreatorPhase3FullWidth =
    pathname === "/dashboard/creator/phase-3/business-plan" ||
    pathname === "/dashboard/creator/phase-3/forecast";

  return (
    <AuthGuard>
      <EntrepreneurProgressProvider>
        <SidebarProvider>
          <div className={`flex min-h-screen w-full ${isServiceProvider ? "sp-workspace" : ""}`}>

            {/* LEFT: SIDEBAR (hidden for Phase 2) */}
            {!isPhase2 && <AppSidebar />}

            {/* RIGHT: TOPBAR + CONTENT */}
            <div className="flex flex-1 flex-col">

              {/* Topbar (adapts content based on route) */}
              {!isServiceProvider && <Topbar />}
              {isServiceProvider && (
                <>
                  <SpMobileHeader />
                  <SpDesktopTopbar />
                  <SpSandboxNotice />
                </>
              )}

              {/* Content (padding suppressed for full-bleed Phase 2 design) */}
              <main className={`flex-1 overflow-auto ${isServiceProvider ? "bg-[#F4F5F7] p-4 sm:p-6 lg:p-8" : `bg-background ${isPhase2 || isCreatorPhase3FullWidth ? "" : "p-4 sm:p-6 lg:p-8 pb-16"}`}`}>
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </EntrepreneurProgressProvider>
    </AuthGuard>
  );
}

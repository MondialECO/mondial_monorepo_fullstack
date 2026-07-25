"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import Topbar from "@/components/layout/Topbar";
import AuthGuard from "@/components/layout/AuthGuard";
import { isPhase2ChromeRoute } from "@/lib/layout-config";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPhase2 = isPhase2ChromeRoute(pathname);

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">

          {/* LEFT: SIDEBAR (hidden for Phase 2) */}
          {!isPhase2 && <AppSidebar />}

          {/* RIGHT: TOPBAR + CONTENT */}
          <div className="flex flex-1 flex-col">

            {/* Topbar (adapts content based on route) */}
            <Topbar />

            {/* Content (padding suppressed for full-bleed Phase 2 design) */}
            <main className={`flex-1 overflow-auto bg-background ${isPhase2 ? "" : "pt-6 pr-6"}`}>
              {children}
            </main>
           </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}

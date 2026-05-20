
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/layout/AppSidebar";
import Topbar from "@/components/layout/Topbar";
import AuthGuard from "@/components/layout/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
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
      </SidebarProvider>
    </AuthGuard>
  );
}

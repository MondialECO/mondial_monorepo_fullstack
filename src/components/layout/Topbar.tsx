"use client";

import { usePathname } from "next/navigation";
import Image from "next/image";
import { SidebarTrigger } from "@/components/ui/sidebar";
import ThemeToggle from "../ThemeToggle";
import { LayoutGrid, ChevronRight, Settings, UserRound } from "lucide-react";
import Link from "next/link";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import NotificationBell from "@/components/notifications/NotificationBell";
import MessageIcon from "@/components/messages/MessageIcon";
import { useAuth } from "@/app/_providers/AuthProvider";
import { isPhase2ChromeRoute } from "@/lib/layout-config";
import { AccountMenu, type AccountMenuItem } from "@/components/layout/AccountMenu";
import { UserRole } from "@/lib/roles";

/**
 * Account destinations per role, verified against the routes that actually exist under
 * src/app/dashboard rather than assumed from the role list. Entrepreneur and Admin have no
 * profile or settings page today, so they get an empty list and the menu falls back to
 * sign-out alone — the control is never opened onto nothing, and no link is offered that
 * would 404.
 */
const ROLE_MENU_ITEMS: Record<UserRole, AccountMenuItem[]> = {
  [UserRole.CREATOR]: [
    { href: "/dashboard/creator/profile", icon: UserRound, label: "Profile" },
    { href: "/dashboard/creator/settings", icon: Settings, label: "Settings" },
  ],
  [UserRole.INVESTOR]: [
    { href: "/dashboard/investor/profile", icon: UserRound, label: "Profile" },
  ],
  [UserRole.ENTREPRENEUR]: [],
  [UserRole.ADMIN]: [],
  // Service Provider never reaches this topbar — dashboard/layout.tsx routes SP to
  // SpDesktopTopbar/SpMobileHeader — but the map must be total for the Record type.
  [UserRole.SERVICE_PROVIDER]: [],
};

const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CREATOR]: "Creator",
  [UserRole.INVESTOR]: "Investor",
  [UserRole.ENTREPRENEUR]: "Entrepreneur",
  [UserRole.ADMIN]: "Admin",
  [UserRole.SERVICE_PROVIDER]: "Service Provider",
};

export default function Topbar() {
  const pathname = usePathname();
  const isPhase2 = isPhase2ChromeRoute(pathname);
  const breadcrumbs = useBreadcrumb();
  const { user } = useAuth();
  const role = user?.role ?? UserRole.CREATOR;

  if (isPhase2) {
    // Reduced Phase 2 chrome: logo tile, breadcrumb, avatar only
    return (
      <header className="sticky top-0 z-40 w-full border-b flex-shrink-0" style={{ borderColor: "var(--border)", backgroundColor: "var(--card)" }}>
        <div className="flex h-[72px] items-center justify-between px-6 sm:px-6">

          {/* LEFT: Logo tile + Breadcrumb */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            {/* Logo tile */}
            <div className="h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ backgroundColor: "var(--popover)", borderColor: "var(--stroke-10)", borderWidth: "1px" }}>
              <Image
                src="/icons/phase2/logo.png"
                alt="Mondial"
                width={20}
                height={20}
              />
            </div>

            {/* Breadcrumb (always visible in Phase 2) */}
            <nav className="flex items-center text-sm min-w-0" style={{ color: "var(--muted-foreground)" }}>
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1;

                return (
                  <div key={item.href} className="flex items-center min-w-0">
                    {index !== 0 && (
                      <ChevronRight className="mx-2 h-4 w-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }} />
                    )}

                    {isLast ? (
                      <span className="font-semibold truncate" style={{ color: "var(--foreground)" }}>
                        {item.label}
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        className="hover:transition-colors truncate"
                        style={{ color: "var(--muted-foreground)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--foreground)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted-foreground)")}
                      >
                        {item.label}
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* RIGHT: Avatar only */}
          <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold" style={{ backgroundColor: "var(--muted)", color: "var(--foreground)" }}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

        </div>
      </header>
    );
  }

  // Standard topbar for all other routes
  return (
    <header className="sticky top-0 z-40 w-full border-b border-sidebar-border bg-card text-muted-foreground">
      <div className="flex h-[72px] items-center justify-between px-4 sm:px-5 md:px-5 lg:px-5">

        {/* LEFT */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Sidebar trigger */}
          <SidebarTrigger />

          {/* App icon */}
          <div className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg border">
            <LayoutGrid className="h-5 w-5 text-muted-foreground" />
          </div>

          {/* Breadcrumb (desktop only) */}
          <nav className="hidden lg:flex items-center text-sm min-w-0">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <div key={item.href} className="flex items-center min-w-0">
                  {index !== 0 && (
                    <ChevronRight className="mx-2 h-4 w-4 text-muted-foreground" />
                  )}

                  {isLast ? (
                    <span className="font-semibold text-foreground truncate">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-muted-foreground hover:text-foreground transition-colors truncate"
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-4 lg:gap-6">
          <MessageIcon />
          <NotificationBell />
          <ThemeToggle />
          {/* Replaces a bare Logout button. Sign-out is still here, now inside the menu
              alongside the role's own destinations, so the control does the old job plus
              the identity display SP already had. */}
          <AccountMenu
            roleLabel={ROLE_LABELS[role]}
            initialsFallback={ROLE_LABELS[role].charAt(0)}
            items={ROLE_MENU_ITEMS[role]}
          />
        </div>

      </div>
    </header>
  );
}

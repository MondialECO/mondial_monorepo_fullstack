"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import ThemeToggle from "../ThemeToggle";
import { LayoutGrid, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useBreadcrumb } from "@/hooks/useBreadcrumb";
import NotificationBell from "@/components/notifications/NotificationBell";
import MessageIcon from "@/components/messages/MessageIcon";

export default function Topbar() {
  const breadcrumbs = useBreadcrumb();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-card text-muted-foreground">
      <div className="flex h-[72px] items-center justify-between px-4 lg:px-8">

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
        </div>

      </div>
    </header>
  );
}

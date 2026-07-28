"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { useAuth } from "@/app/_providers/AuthProvider";
import NotificationBell from "@/components/notifications/NotificationBell";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getServiceProviderPageTitle } from "@/lib/service-provider-navigation";

export function SpMobileHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const title = getServiceProviderPageTitle(pathname, searchParams);
  const initials = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SP";

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-[#E5E7EB] bg-white px-4 md:hidden">
      <div className="flex min-w-0 items-center gap-2.5">
        <SidebarTrigger className="size-9 shrink-0 text-[#4B5563]" />
        <Link href="/dashboard/serviceprovider" className="min-w-0 outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#3C61DD]">
          <span className="block truncate font-heading text-sm font-semibold text-[#171717]">mondial.eco</span>
          <span className="block truncate text-[11px] text-[#6B7280]">{title}</span>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <NotificationBell />
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={() => setOpen((current) => !current)}
            className="flex size-9 items-center justify-center rounded-full bg-[#E8ECFF] text-xs font-bold text-[#3C61DD] outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD] focus-visible:ring-offset-2"
          >
            {initials}
          </button>
          {open && (
            <div role="menu" className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-[#E5E7EB] bg-white p-2 text-[#171717]">
              <div className="border-b border-[#E5E7EB] px-3 py-2">
                <p className="truncate text-sm font-semibold">{user?.name || "Service Provider"}</p>
                <p className="mt-0.5 truncate text-xs text-[#6B7280]">Service Provider</p>
              </div>
              <Link
                role="menuitem"
                href="/dashboard/serviceprovider/profile"
                onClick={() => setOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#F4F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
              >
                <UserRound className="size-4" /> Profile &amp; Trust
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F4F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

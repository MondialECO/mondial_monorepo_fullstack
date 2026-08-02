"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { BadgeCheck, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/app/_providers/AuthProvider";

export function SpAccountMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);
  const menuId = useId();
  const initials = user?.name
    ?.split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "SP";

  useEffect(() => {
    if (!open) return;
    firstItemRef.current?.focus();

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open account menu"
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex size-11 items-center justify-center rounded-full bg-[#E8ECFF] text-xs font-bold text-[#3C61DD] outline-none transition-colors hover:bg-[#DCE4FF] focus-visible:ring-2 focus-visible:ring-[#3C61DD] focus-visible:ring-offset-2"
      >
        {initials}
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label="Service Provider account" className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-[#E5E7EB] bg-white p-2 text-[#171717]">
          <div className="border-b border-[#E5E7EB] px-3 py-2">
            <p className="truncate text-sm font-semibold">{user?.name || "Service Provider"}</p>
            <p className="mt-0.5 truncate text-xs text-[#6B7280]">Service Provider</p>
          </div>
          <Link
            ref={firstItemRef}
            role="menuitem"
            href="/dashboard/serviceprovider/profile"
            onClick={() => setOpen(false)}
            className="mt-1 flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#F4F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
          >
            <BadgeCheck className="size-4" aria-hidden="true" /> Profile &amp; Trust
          </Link>
          <Link
            role="menuitem"
            href="/dashboard/serviceprovider/phase-1"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-[#F4F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
          >
            <ShieldCheck className="size-4" aria-hidden="true" /> Identity &amp; Account Verification
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F4F5F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3C61DD]"
          >
            <LogOut className="size-4" aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

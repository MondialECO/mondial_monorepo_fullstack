"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import NotificationBell from "@/components/notifications/NotificationBell";
import { SpAccountMenu } from "@/components/serviceprovider/SpAccountMenu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getServiceProviderPageTitle } from "@/lib/service-provider-navigation";

export function SpMobileHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const title = getServiceProviderPageTitle(pathname, searchParams);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-[#E5E7EB] bg-white px-4 lg:hidden">
      <div className="flex min-w-0 items-center gap-2.5">
        <SidebarTrigger className="size-11 shrink-0 text-[#4B5563]" />
        <Link href="/dashboard/serviceprovider" className="flex items-center gap-2 min-w-0 outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#3C61DD]">
          <div className="relative size-7 shrink-0 rounded-md bg-white border border-[#E5E7EB] flex items-center justify-center overflow-hidden">
            <Image
              src="/brand-logo-footer.png"
              alt="Mondial"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <div className="min-w-0">
            <span className="block truncate font-heading text-sm font-semibold text-[#171717]">mondial.eco</span>
            <span className="block truncate text-[11px] text-[#6B7280]">{title}</span>
          </div>
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <NotificationBell triggerClassName="size-11" />
        <SpAccountMenu />
      </div>
    </header>
  );
}

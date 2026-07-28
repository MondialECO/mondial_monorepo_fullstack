"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import MessageIcon from "@/components/messages/MessageIcon";
import NotificationBell from "@/components/notifications/NotificationBell";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { SpAccountMenu } from "@/components/serviceprovider/SpAccountMenu";
import { getServiceProviderPageTitle, SERVICE_PROVIDER_ROOT } from "@/lib/service-provider-navigation";

export function SpDesktopTopbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const title = getServiceProviderPageTitle(pathname, searchParams);
  const isDashboard = pathname === SERVICE_PROVIDER_ROOT;

  return (
    <header className="sticky top-0 z-40 hidden h-[68px] shrink-0 items-center border-b border-[#E5E7EB] bg-white px-8 text-[#171717] lg:flex">
      <div className="flex w-full min-w-0 items-center justify-between gap-6">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger className="size-11 shrink-0 rounded-lg text-[#4B5563] hover:bg-[#F4F5F7] focus-visible:ring-2 focus-visible:ring-[#3C61DD]" />
          <nav aria-label="Service Provider breadcrumb" className="flex min-w-0 items-center text-sm">
            {!isDashboard && (
              <>
                <Link href={SERVICE_PROVIDER_ROOT} className="shrink-0 rounded-sm text-[#6B7280] outline-none hover:text-[#171717] focus-visible:ring-2 focus-visible:ring-[#3C61DD] focus-visible:ring-offset-2">
                  Dashboard
                </Link>
                <ChevronRight className="mx-2 size-4 shrink-0 text-[#9CA3AF]" aria-hidden="true" />
              </>
            )}
            <span aria-current="page" className="truncate font-heading text-[15px] font-semibold text-[#171717]">{title}</span>
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1" aria-label="Workspace controls">
          <div className="[&_button]:size-11"><MessageIcon /></div>
          <div className="[&_button]:size-11"><NotificationBell /></div>
          <SpAccountMenu />
        </div>
      </div>
    </header>
  );
}

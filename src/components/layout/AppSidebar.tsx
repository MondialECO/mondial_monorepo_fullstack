"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/app/_providers/AuthProvider";
import { menu, type MenuSection } from "@/lib/menu";
import { UserRole } from "@/lib/roles";
import { useCapacity, useUpdateCapacity } from "@/hooks/queries/service-catalog";
import { useProviderOverview } from "@/hooks/queries/analytics";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const sections = menu[user.role];

  if (user.role === UserRole.SERVICE_PROVIDER) {
    return <ServiceProviderSidebar sections={sections} pathname={pathname} />;
  }

  return (
    <Sidebar>
      <SidebarHeader className="h-18 justify-center border-b border-sidebar-border mb-2">
        <div className="flex items-center gap-2 px-4">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-xl">M</span>
          </div>
          <span className="text-xl font-bold tracking-tight">Mondial</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 py-4">
              {section.title}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active} className="py-6">
                        <Link href={item.href} className="flex items-center gap-3">
                          {Icon && (
                            <Icon
                              className={
                                active ? "text-primary" : "text-muted-foreground"
                              }
                            />
                          )}
                          <span className={active ? "font-medium" : "font-normal"}>
                            {item.label}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="p-4 gap-4 mt-auto">
        <div className="rounded-xl bg-primary/10 dark:bg-primary/20 p-4 border border-primary/20 dark:border-primary/30 group-data-[collapsible=icon]:hidden">
          <p className="text-sm font-semibold text-primary dark:text-primary/90 mb-2">
            Upgrade Now
          </p>
          <p className="text-xs text-primary/80 dark:text-primary/70 mb-3">
            Get more views and reach more investors.
          </p>
          <button className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors">
            Upgrade
          </button>
        </div>

        <div className="flex items-center gap-3 py-2 border-t border-sidebar-border pt-4">
          <div className="h-10 w-10 min-w-10 rounded-full bg-muted dark:bg-muted/80 flex items-center justify-center overflow-hidden">
            <span className="text-xs font-bold">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold truncate leading-none mb-1">
              {user.name || "User"}
            </span>
            <span className="text-xs text-muted-foreground truncate leading-none">
              {user.role}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function ServiceProviderSidebar({
  sections,
  pathname,
}: {
  sections: MenuSection[];
  pathname: string;
}) {
  const capacity = useCapacity();
  const updateCapacity = useUpdateCapacity();
  const overview = useProviderOverview();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    "Earnings & Payouts": pathname === "/dashboard/serviceprovider/earnings",
  });
  const available = capacity.data?.newOrderAvailability ?? true;
  const provider = overview.data?.provider;
  const unreadLeads = overview.data?.metrics.newLeads ?? 0;
  const activeProjects = overview.data?.metrics.activeEngagements ?? 0;
  const searchKey = searchParams.toString();

  useEffect(() => {
    const currentSearchParams = new URLSearchParams(searchKey);
    setExpanded(() => {
      const next: Record<string, boolean> = {};
      for (const section of sections) {
        for (const item of section.items) {
          if (item.children?.length) {
            next[item.label] = pathname === item.href.split("?")[0]
              || item.children.some((child) => isMenuHrefActive(child.href, pathname, currentSearchParams));
          }
        }
      }
      return next;
    });
  }, [pathname, searchKey, sections]);

  function toggleAvailability() {
    if (!capacity.data || updateCapacity.isPending) return;
    updateCapacity.mutate({
      maximumConcurrentOrders: capacity.data.maximumConcurrentOrders,
      newOrderAvailability: !capacity.data.newOrderAvailability,
      manualApprovalWhenCapacityLow: capacity.data.manualApprovalWhenCapacityLow,
    });
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-[#E5E7EB] bg-white">
      <SidebarHeader className="border-b border-[#E5E7EB] px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          <Link href="/dashboard/serviceprovider" className="flex min-w-0 items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#171717] text-sm font-semibold text-white">
              M
            </div>
            <span className="truncate font-heading text-xl font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              mondial.eco
            </span>
          </Link>
          <SidebarTrigger className="shrink-0 text-[#6B7280] group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>

      <div className="px-3 pt-4 group-data-[collapsible=icon]:hidden">
        <button
          type="button"
          role="switch"
          aria-checked={available}
          disabled={!capacity.data || updateCapacity.isPending}
          onClick={toggleAvailability}
          className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-left disabled:cursor-not-allowed disabled:opacity-75"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[#171717]">Available Now</span>
            <span className={`relative h-5 w-9 rounded-full transition-colors ${available ? "bg-[#0D9488]" : "bg-[#D1D5DB]"}`}>
              <span className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${available ? "translate-x-[18px]" : "translate-x-0.5"}`} />
            </span>
          </span>
          <span className="mt-1 block text-xs text-[#6B7280]">Improves your match priority.</span>
        </button>
      </div>

      <SidebarContent className="px-2 py-4">
        {sections.map((section) => (
          <SidebarGroup key={section.title} className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = !!item.children?.length;
                  const active = hasChildren
                    ? pathname === item.href.split("?")[0]
                    : isMenuHrefActive(item.href, pathname, searchParams);
                  const isExpanded = expanded[item.label] ?? false;
                  const badge = item.label === "Client Briefs" ? unreadLeads : item.label === "Active Projects" ? activeProjects : 0;

                  return (
                    <SidebarMenuItem key={item.href}>
                      <div className="relative">
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={item.label}
                          className={`h-11 rounded-lg px-3 text-[#4B5563] data-[active=true]:bg-[#EEF2FF] data-[active=true]:text-[#3C61DD] ${hasChildren ? "pr-9" : ""}`}
                        >
                          <Link href={item.href} className="flex items-center gap-3" onClick={() => hasChildren && setExpanded((current) => ({ ...current, [item.label]: true }))}>
                            {Icon && <Icon className="size-4.5" />}
                            <span className={active ? "font-semibold" : "font-medium"}>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                        {badge > 0 && (
                          <SidebarMenuBadge className={`${hasChildren ? "right-8" : "right-2"} rounded-full bg-[#3C61DD] text-white`}>{badge > 99 ? "99+" : badge}</SidebarMenuBadge>
                        )}
                        {hasChildren && (
                          <button
                            type="button"
                            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${item.label} submenu`}
                            aria-expanded={isExpanded}
                            onClick={() => setExpanded((current) => ({ ...current, [item.label]: !isExpanded }))}
                            className="absolute right-1.5 top-2 flex size-7 items-center justify-center rounded-md text-[#6B7280] hover:bg-[#E5E7EB] group-data-[collapsible=icon]:hidden"
                          >
                            <ChevronDown className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                          </button>
                        )}
                      </div>
                      {hasChildren && isExpanded && (
                        <SidebarMenuSub>
                          {item.children!.map((child) => {
                            const childActive = isMenuHrefActive(child.href, pathname, searchParams);
                            return (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton asChild isActive={childActive} className="text-[#6B7280] data-[active=true]:font-semibold data-[active=true]:text-[#3C61DD]">
                                  <Link href={child.href}>{child.label}</Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            );
                          })}
                        </SidebarMenuSub>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="mt-auto border-t border-[#E5E7EB] p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E8ECFF] text-xs font-bold text-[#3C61DD]">
            {provider?.initials ?? "SP"}
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-sm font-semibold text-[#171717]">{provider?.name ?? "Service Provider"}</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${provider?.verificationStatus === "Verified" ? "bg-[#DCFCE7] text-[#047857]" : provider?.verificationStatus === "Rejected" ? "bg-[#FDE8E8] text-[#C24141]" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
                {provider?.verificationStatus ?? "Pending"}
              </span>
              <span
                className="rounded-full bg-[#F3F4F6] px-2 py-0.5 text-[10px] font-semibold text-[#6B7280]"
                title="Affects match priority, not pricing"
              >
                {provider?.tierLabel ?? "Tier 1"}
              </span>
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function isMenuHrefActive(href: string, pathname: string, searchParams: URLSearchParams) {
  const [path, query = ""] = href.split("?");
  if (pathname !== path) return false;
  const expected = new URLSearchParams(query);
  if ([...expected.keys()].length === 0) return true;
  for (const [key, value] of expected.entries()) {
    const current = searchParams.get(key);
    if (current === value) continue;
    if (key === "view" && value === "leads" && current === "saved") continue;
    if (current === null && ((key === "view" && value === "leads") || (key === "view" && value === "active") || (key === "tab" && value === "activity"))) continue;
    return false;
  }
  return true;
}

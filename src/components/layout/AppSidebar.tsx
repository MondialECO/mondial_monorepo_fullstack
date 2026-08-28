"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/app/_providers/AuthProvider";
import { menu, type MenuSection, type MenuItem } from "@/lib/menu";
import { UserRole } from "@/lib/roles";
import { useProviderOverview } from "@/hooks/queries/analytics";
import { useProviderAvailabilityControl } from "@/hooks/useProviderAvailabilityControl";
import {
  getAllMenuHrefs,
  isMenuHrefActive,
  isMenuParentActive,
  isParentItemExpanded,
} from "@/lib/menu-navigation";

export { isMenuHrefActive, isMenuParentActive, isParentItemExpanded };

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
  useSidebar,
} from "@/components/ui/sidebar";

export default function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (!user) return null;

  const sections = menu[user.role] || [];

  if (user.role === UserRole.SERVICE_PROVIDER) {
    return (
      <ServiceProviderSidebar
        sections={sections}
        pathname={pathname}
        searchParams={searchParams}
      />
    );
  }

  return (
    <StandardRoleSidebar
      role={user.role}
      userName={user.name}
      sections={sections}
      pathname={pathname}
      searchParams={searchParams}
    />
  );
}

function StandardRoleSidebar({
  role,
  userName,
  sections,
  pathname,
  searchParams,
}: {
  role: UserRole;
  userName?: string;
  sections: MenuSection[];
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams>;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const [manualExpanded, setManualExpanded] = useState<Record<string, boolean>>({});

  const allHrefs = useMemo(() => getAllMenuHrefs(sections), [sections]);

  // Reset manual expansion on role change
  useEffect(() => {
    setManualExpanded({});
  }, [role]);

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const toggleExpand = (label: string, currentlyExpanded: boolean) => {
    setManualExpanded((prev) => ({
      ...prev,
      [label]: !currentlyExpanded,
    }));
  };

  return (
    <Sidebar>
      <SidebarHeader className="h-18 justify-center border-b border-sidebar-border mb-2">
        <div className="flex items-center justify-between px-4">
          <Link
            href={`/dashboard/${role.toLowerCase()}`}
            onClick={handleLinkClick}
            className="flex items-center gap-2"
          >
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-xl font-bold tracking-tight">Mondial</span>
          </Link>
          <SidebarTrigger className="shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
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
                  const hasChildren = !!item.children?.length;
                  const active = isMenuParentActive(item, pathname, searchParams, allHrefs);
                  const isExpanded = isParentItemExpanded(
                    item,
                    pathname,
                    searchParams,
                    manualExpanded[item.label],
                    allHrefs
                  );
                  const submenuId = `submenu-${item.label.toLowerCase().replace(/\s+/g, "-")}`;

                  return (
                    <SidebarMenuItem key={item.href}>
                      {hasChildren ? (
                        <SidebarMenuButton
                          type="button"
                          isActive={active}
                          onClick={() => toggleExpand(item.label, isExpanded)}
                          aria-expanded={isExpanded}
                          aria-controls={submenuId}
                          className="py-6 w-full justify-between cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
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
                          </div>
                          <ChevronDown
                            className={`size-4 text-muted-foreground transition-transform duration-200 group-data-[collapsible=icon]:hidden ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuButton
                          asChild
                          isActive={active && !hasChildren}
                          className="py-6"
                        >
                          <Link
                            href={item.href}
                            onClick={handleLinkClick}
                            className="flex items-center gap-3"
                          >
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
                      )}

                      {hasChildren && isExpanded && (
                        <SidebarMenuSub id={submenuId}>
                          {item.children!.map((child) => {
                            const childActive = isMenuHrefActive(
                              child.href,
                              pathname,
                              searchParams,
                              allHrefs
                            );
                            return (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={childActive}
                                  className="data-[active=true]:font-medium data-[active=true]:text-primary"
                                >
                                  <Link href={child.href} onClick={handleLinkClick}>
                                    {child.label}
                                  </Link>
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
              {userName?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
          <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold truncate leading-none mb-1">
              {userName || "User"}
            </span>
            <span className="text-xs text-muted-foreground truncate leading-none">
              {role}
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
  searchParams,
}: {
  sections: MenuSection[];
  pathname: string;
  searchParams: ReturnType<typeof useSearchParams>;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const overview = useProviderOverview();
  const availability = useProviderAvailabilityControl(
    overview.data?.provider.availableNow ?? true
  );

  const [manualExpanded, setManualExpanded] = useState<Record<string, boolean>>({});

  const allHrefs = useMemo(() => getAllMenuHrefs(sections), [sections]);
  const available = availability.available;
  const provider = overview.data?.provider;
  const unreadLeads = overview.data?.metrics.newLeads ?? 0;
  const activeProjects = overview.data?.metrics.activeEngagements ?? 0;

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const toggleExpand = (label: string, currentlyExpanded: boolean) => {
    setManualExpanded((prev) => ({
      ...prev,
      [label]: !currentlyExpanded,
    }));
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-[#E5E7EB] bg-white">
      <SidebarHeader className="border-b border-[#E5E7EB] px-4 py-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/dashboard/serviceprovider"
            onClick={handleLinkClick}
            className="flex min-w-0 items-center gap-2.5"
          >
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
          disabled={!availability.canUpdate || availability.pending}
          onClick={availability.toggle}
          className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 text-left disabled:cursor-not-allowed disabled:opacity-75"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[#171717]">
              {availability.pending ? "Updating…" : "Available Now"}
            </span>
            <span
              className={`relative h-5 w-9 rounded-full transition-colors ${
                available ? "bg-[#0D9488]" : "bg-[#D1D5DB]"
              }`}
            >
              <span
                className={`absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform ${
                  available ? "translate-x-[18px]" : "translate-x-0.5"
                }`}
              />
            </span>
          </span>
          <span className="mt-1 block text-xs text-[#6B7280]">
            Improves your match priority.
          </span>
        </button>
        {availability.feedback && (
          <p
            role={availability.feedback.status === "error" ? "alert" : "status"}
            className={`mt-2 px-1 text-xs leading-4 ${
              availability.feedback.status === "error"
                ? "text-[#B42318]"
                : "text-[#157A55]"
            }`}
          >
            {availability.feedback.message}
          </p>
        )}
      </div>

      <SidebarContent className="px-2 py-4">
        {sections.map((section) => (
          <SidebarGroup key={section.title} className="p-0">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = !!item.children?.length;
                  const active = isMenuParentActive(item, pathname, searchParams, allHrefs);
                  const isExpanded = isParentItemExpanded(
                    item,
                    pathname,
                    searchParams,
                    manualExpanded[item.label],
                    allHrefs
                  );
                  const submenuId = `submenu-${item.label.toLowerCase().replace(/\s+/g, "-")}`;
                  const badge =
                    item.label === "Client Briefs"
                      ? unreadLeads
                      : item.label === "Active Projects"
                      ? activeProjects
                      : 0;

                  return (
                    <SidebarMenuItem key={item.href}>
                      {hasChildren ? (
                        <SidebarMenuButton
                          type="button"
                          isActive={active}
                          tooltip={item.label}
                          onClick={() => toggleExpand(item.label, isExpanded)}
                          aria-expanded={isExpanded}
                          aria-controls={submenuId}
                          className={`h-11 w-full justify-between rounded-lg px-3 text-[#4B5563] cursor-pointer data-[active=true]:bg-[#EEF2FF] data-[active=true]:text-[#3C61DD] ${
                            active ? "font-semibold text-[#1F3FAF]" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {Icon && <Icon className="size-4.5 shrink-0" />}
                            <span
                              className={
                                active ? "font-semibold" : "font-medium"
                              }
                            >
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 group-data-[collapsible=icon]:hidden">
                            {badge > 0 && (
                              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3C61DD] px-1 text-[11px] font-medium text-white tabular-nums">
                                {badge > 99 ? "99+" : badge}
                              </span>
                            )}
                            <ChevronDown
                              className={`size-4 text-[#6B7280] transition-transform duration-200 ${
                                isExpanded ? "rotate-180" : ""
                              }`}
                            />
                          </div>
                        </SidebarMenuButton>
                      ) : (
                        <div className="relative">
                          <SidebarMenuButton
                            asChild
                            isActive={active && !hasChildren}
                            tooltip={item.label}
                            className="h-11 rounded-lg px-3 text-[#4B5563] data-[active=true]:bg-[#EEF2FF] data-[active=true]:text-[#3C61DD]"
                          >
                            <Link
                              href={item.href}
                              onClick={handleLinkClick}
                              className="flex items-center gap-3"
                            >
                              {Icon && <Icon className="size-4.5" />}
                              <span
                                className={
                                  active ? "font-semibold" : "font-medium"
                                }
                              >
                                {item.label}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                          {badge > 0 && (
                            <SidebarMenuBadge className="right-2 rounded-full bg-[#3C61DD] text-white">
                              {badge > 99 ? "99+" : badge}
                            </SidebarMenuBadge>
                          )}
                        </div>
                      )}

                      {hasChildren && isExpanded && (
                        <SidebarMenuSub id={submenuId}>
                          {item.children!.map((child) => {
                            const childActive = isMenuHrefActive(
                              child.href,
                              pathname,
                              searchParams,
                              allHrefs
                            );
                            return (
                              <SidebarMenuSubItem key={child.href}>
                                <SidebarMenuSubButton
                                  asChild
                                  isActive={childActive}
                                  className="text-[#6B7280] data-[active=true]:font-semibold data-[active=true]:text-[#3C61DD]"
                                >
                                  <Link href={child.href} onClick={handleLinkClick}>
                                    {child.label}
                                  </Link>
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
            <p className="truncate text-sm font-semibold text-[#171717]">
              {provider?.name ?? "Service Provider"}
            </p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  provider?.verificationStatus === "Verified"
                    ? "bg-[#DCFCE7] text-[#047857]"
                    : provider?.verificationStatus === "Rejected"
                    ? "bg-[#FDE8E8] text-[#C24141]"
                    : "bg-[#F3F4F6] text-[#6B7280]"
                }`}
              >
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

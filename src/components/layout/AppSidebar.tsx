"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/_providers/AuthProvider";
import { menu } from "@/lib/menu";
import { ROLE_DASHBOARD_ROUTES, UserRole } from "@/lib/roles";

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
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export default function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const sections = menu[user.role];
  const profileHref =
    user.role === UserRole.SERVICE_PROVIDER
      ? "/dashboard/serviceprovider/profile"
      : ROLE_DASHBOARD_ROUTES[user.role];

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
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 group-data-[collapsible=icon]:hidden">
          <p className="text-sm font-semibold text-foreground mb-2">
            Upgrade Now
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Get more views and reach more investors.
          </p>
          <Button size="sm" className="w-full text-xs font-semibold">
            Upgrade
          </Button>
        </div>

        <Link
          href={profileHref}
          className="flex items-center gap-3 border-t border-sidebar-border pt-4 py-2 rounded-lg transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          aria-label="Open profile"
        >
          <div className="h-10 w-10 min-w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
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
        </Link>
      </SidebarFooter>
    </Sidebar>
  );
}

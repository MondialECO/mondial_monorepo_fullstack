"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/_providers/AuthProvider";
import { menu } from "@/lib/menu";

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

export default function AppSidebar() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const sections = menu[user.role];

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
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-100 dark:border-blue-900/30 group-data-[collapsible=icon]:hidden">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Upgrade Now
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
            Get more views and reach more investors.
          </p>
          <button className="w-full py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors">
            Upgrade
          </button>
        </div>

        <div className="flex items-center gap-3 py-2 border-t border-sidebar-border pt-4">
          <div className="h-10 w-10 min-w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
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
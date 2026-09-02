import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AdminDashboard from '@/app/dashboard/admin/page';
import Topbar from '@/components/layout/Topbar';
import AppSidebar from '@/components/layout/AppSidebar';
import { UserRole } from '@/lib/roles';

// Mock router and path hooks
let mockPathname = '/dashboard/admin';
let mockUser: any = { id: 'admin-1', name: 'Demo Admin', role: UserRole.ADMIN, roles: [UserRole.ADMIN] };

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock('@/app/_providers/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
    token: 'mock-token',
    isAuthenticated: true,
    isLoading: false,
    isBackendVerified: true,
    logout: vi.fn(),
    login: vi.fn(),
    refreshAuthMe: vi.fn(),
  }),
}));

vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: any) => <div data-testid="sidebar-provider">{children}</div>,
  Sidebar: ({ children }: any) => <aside>{children}</aside>,
  SidebarContent: ({ children }: any) => <div>{children}</div>,
  SidebarHeader: ({ children }: any) => <div>{children}</div>,
  SidebarFooter: ({ children }: any) => <div>{children}</div>,
  SidebarGroup: ({ children }: any) => <div>{children}</div>,
  SidebarGroupLabel: ({ children }: any) => <div>{children}</div>,
  SidebarGroupContent: ({ children }: any) => <div>{children}</div>,
  SidebarMenu: ({ children }: any) => <ul>{children}</ul>,
  SidebarMenuItem: ({ children }: any) => <li>{children}</li>,
  SidebarMenuButton: ({ children }: any) => <div>{children}</div>,
  SidebarMenuBadge: ({ children }: any) => <span>{children}</span>,
  SidebarMenuSub: ({ children }: any) => <ul>{children}</ul>,
  SidebarMenuSubItem: ({ children }: any) => <li>{children}</li>,
  SidebarMenuSubButton: ({ children }: any) => <div>{children}</div>,
  SidebarTrigger: () => <button aria-label="Toggle sidebar">Trigger</button>,
  useSidebar: () => ({ isMobile: false, setOpenMobile: vi.fn() }),
}));

vi.mock('@/hooks/queries/chat', () => ({
  useConversations: () => ({ data: [] }),
}));

vi.mock('@/hooks/queries/notifications', () => ({
  useNotifications: () => ({ data: { unreadCount: 0, items: [] } }),
  useNotificationRealtime: vi.fn(),
  useMarkAllNotificationsRead: () => ({ mutate: vi.fn() }),
  useMarkNotificationRead: () => ({ mutate: vi.fn() }),
}));

describe('Admin Root Dashboard and Chrome Hotfix Tests', () => {
  it('renders Admin Root Dashboard workspace page successfully for Admin', () => {
    mockUser = { id: 'admin-1', name: 'Demo Admin', role: UserRole.ADMIN, roles: [UserRole.ADMIN] };
    mockPathname = '/dashboard/admin';

    render(<AdminDashboard />);

    expect(screen.getByText('Platform Operations Center')).toBeInTheDocument();
    expect(screen.getByText('User & Multi-Role Governance')).toBeInTheDocument();
    expect(screen.getByText('Unified Verification Hub')).toBeInTheDocument();
  });

  it('renders Admin Root Dashboard workspace page successfully for SuperAdmin', () => {
    mockUser = { id: 'superadmin-1', name: 'Super Admin User', role: UserRole.SUPERADMIN, roles: [UserRole.SUPERADMIN, UserRole.ADMIN] };
    mockPathname = '/dashboard/admin';

    render(<AdminDashboard />);

    expect(screen.getByText('Platform Operations Center')).toBeInTheDocument();
    expect(screen.getByText('Admin workspace')).toBeInTheDocument();
  });

  it('renders Topbar for SuperAdmin without throwing TypeError', () => {
    mockUser = { id: 'superadmin-1', name: 'Super Admin User', role: UserRole.SUPERADMIN, roles: [UserRole.SUPERADMIN, UserRole.ADMIN] };
    mockPathname = '/dashboard/admin';

    const { container } = render(<Topbar />);
    expect(container).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open account menu' })).toBeInTheDocument();
  });

  it('renders Topbar for normal Admin without error', () => {
    mockUser = { id: 'admin-1', name: 'Normal Admin', role: UserRole.ADMIN, roles: [UserRole.ADMIN] };
    mockPathname = '/dashboard/admin';

    const { container } = render(<Topbar />);
    expect(container).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open account menu' })).toBeInTheDocument();
  });

  it('renders AppSidebar for SuperAdmin including Platform Controls menu item', () => {
    mockUser = { id: 'superadmin-1', name: 'Super Admin User', role: UserRole.SUPERADMIN, roles: [UserRole.SUPERADMIN, UserRole.ADMIN] };
    mockPathname = '/dashboard/admin/system/controls';

    render(<AppSidebar />);
    expect(screen.getByText('Platform Controls')).toBeInTheDocument();
  });

  it('renders AppSidebar for normal Admin without Platform Controls menu item', () => {
    mockUser = { id: 'admin-1', name: 'Normal Admin', role: UserRole.ADMIN, roles: [UserRole.ADMIN] };
    mockPathname = '/dashboard/admin/system';

    render(<AppSidebar />);
    expect(screen.queryByText('Platform Controls')).not.toBeInTheDocument();
  });
});

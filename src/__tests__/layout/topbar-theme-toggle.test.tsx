import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import Topbar from "@/components/layout/Topbar";
import { SpDesktopTopbar } from "@/components/serviceprovider/SpDesktopTopbar";
import { SpMobileHeader } from "@/components/serviceprovider/SpMobileHeader";
import ThemeToggle from "@/components/ThemeToggle";
import { UserRole } from "@/lib/roles";

const mockSetTheme = vi.fn();
let mockCurrentTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockCurrentTheme,
    setTheme: mockSetTheme,
    resolvedTheme: mockCurrentTheme,
  }),
}));

let mockPathname = "/dashboard/creator";
let mockUser: any = { id: "1", name: "Alex Creator", role: UserRole.CREATOR, roles: [UserRole.CREATOR] };

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

vi.mock("@/app/_providers/AuthProvider", () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    logout: vi.fn(),
  }),
}));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarTrigger: () => <button aria-label="Toggle Sidebar">Toggle</button>,
}));

vi.mock("@/components/layout/AiCreditBadge", () => ({
  AiCreditBadge: () => <div data-testid="ai-credit-badge" />,
}));

vi.mock("@/components/entrepreneur/CompanySwitcher", () => ({
  CompanySwitcher: () => <div data-testid="company-switcher" />,
}));

vi.mock("@/components/notifications/NotificationBell", () => ({
  default: () => <button aria-label="Notifications">Notifications</button>,
}));

vi.mock("@/components/messages/MessageIcon", () => ({
  default: () => <button aria-label="Messages">Messages</button>,
}));

describe("Global Dashboard Topbar — Theme Toggle across roles", () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
    mockCurrentTheme = "light";
  });

  it("renders Theme Toggle for Creator role in standard Topbar", () => {
    mockPathname = "/dashboard/creator";
    mockUser = { id: "1", name: "Alex Creator", role: UserRole.CREATOR, roles: [UserRole.CREATOR] };
    render(<Topbar />);

    const toggleBtn = screen.getByRole("button", { name: /switch to dark theme/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it("renders Theme Toggle for Entrepreneur role in standard Topbar", () => {
    mockPathname = "/dashboard/entrepreneur";
    mockUser = { id: "2", name: "Sam Entrepreneur", role: UserRole.ENTREPRENEUR, roles: [UserRole.ENTREPRENEUR] };
    render(<Topbar />);

    const toggleBtn = screen.getByRole("button", { name: /switch to dark theme/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it("renders Theme Toggle for Investor role in standard Topbar", () => {
    mockPathname = "/dashboard/investor";
    mockUser = { id: "3", name: "Jordan Investor", role: UserRole.INVESTOR, roles: [UserRole.INVESTOR] };
    render(<Topbar />);

    const toggleBtn = screen.getByRole("button", { name: /switch to dark theme/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it("renders Theme Toggle in Phase 2 chrome Topbar", () => {
    mockPathname = "/dashboard/creator/phase-2/brand-studio";
    mockUser = { id: "1", name: "Alex Creator", role: UserRole.CREATOR, roles: [UserRole.CREATOR] };
    render(<Topbar />);

    const toggleBtn = screen.getByRole("button", { name: /switch to dark theme/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it("renders Theme Toggle in Service Provider desktop Topbar", () => {
    mockPathname = "/dashboard/serviceprovider";
    mockUser = { id: "4", name: "Maya Provider", role: UserRole.SERVICE_PROVIDER, roles: [UserRole.SERVICE_PROVIDER] };
    render(<SpDesktopTopbar />);

    const toggleBtn = screen.getByRole("button", { name: /switch to dark theme/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it("renders Theme Toggle in Service Provider mobile Header", () => {
    mockPathname = "/dashboard/serviceprovider";
    mockUser = { id: "4", name: "Maya Provider", role: UserRole.SERVICE_PROVIDER, roles: [UserRole.SERVICE_PROVIDER] };
    render(<SpMobileHeader />);

    const toggleBtn = screen.getByRole("button", { name: /switch to dark theme/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it("invokes setTheme('dark') when toggled from light mode", async () => {
    const user = userEvent.setup();
    mockCurrentTheme = "light";
    render(<ThemeToggle />);

    const toggleBtn = screen.getByRole("button", { name: "Switch to dark theme" });
    await user.click(toggleBtn);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("invokes setTheme('light') when toggled from dark mode", async () => {
    const user = userEvent.setup();
    mockCurrentTheme = "dark";
    render(<ThemeToggle />);

    const toggleBtn = screen.getByRole("button", { name: "Switch to light theme" });
    await user.click(toggleBtn);

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});

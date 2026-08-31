import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DashboardLayout from "@/app/dashboard/layout";
import { SpDesktopTopbar } from "@/components/serviceprovider/SpDesktopTopbar";
import {
  getServiceProviderPageTitle,
  SERVICE_PROVIDER_ROOT,
} from "@/lib/service-provider-navigation";

const navigation = vi.hoisted(() => ({
  pathname: "/dashboard/serviceprovider",
  searchParams: new URLSearchParams(),
}));

const logout = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => navigation.searchParams,
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: React.forwardRef<
      HTMLAnchorElement,
      React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
    >(function TestLink({ href, children, ...props }, ref) {
      return (
        <a ref={ref} href={href} {...props}>
          {children}
        </a>
      );
    }),
  };
});

vi.mock("@/app/_providers/AuthProvider", () => ({
  useAuth: () => ({
    user: { name: "Maya Rahman" },
    token: "test-token",
    logout,
  }),
}));

vi.mock("@/components/layout/AuthGuard", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/layout/AppSidebar", () => ({
  default: () => <aside data-testid="app-sidebar" />,
}));

vi.mock("@/components/layout/Topbar", () => ({
  default: () => <header data-testid="generic-topbar">Generic top bar</header>,
}));

vi.mock("@/components/messages/MessageIcon", () => ({
  default: () => <button aria-label="Messages" type="button" />,
}));

vi.mock("@/components/notifications/NotificationBell", () => ({
  default: () => <button aria-label="Notifications" type="button" />,
}));

vi.mock("@/components/ui/sidebar", () => ({
  SidebarProvider: ({ children }: { children: React.ReactNode }) => children,
  SidebarTrigger: ({ className }: { className?: string }) => (
    <button aria-label="Toggle Sidebar" className={className} type="button" />
  ),
}));

describe("Service Provider route titles", () => {
  it.each([
    [SERVICE_PROVIDER_ROOT, "", "Dashboard"],
    [`${SERVICE_PROVIDER_ROOT}/leads`, "view=leads", "Client Briefs"],
    [`${SERVICE_PROVIDER_ROOT}/leads`, "view=proposals", "Pipeline"],
    [`${SERVICE_PROVIDER_ROOT}/workroom`, "view=active", "Active Projects"],
    [`${SERVICE_PROVIDER_ROOT}/workroom`, "view=completed", "Completed Projects"],
    [`${SERVICE_PROVIDER_ROOT}/services`, "", "Service Catalog"],
    [`${SERVICE_PROVIDER_ROOT}/analytics`, "", "Analytics & Growth"],
    [`${SERVICE_PROVIDER_ROOT}/earnings`, "tab=activity", "Earnings Overview"],
    [`${SERVICE_PROVIDER_ROOT}/earnings`, "tab=payouts", "Payouts"],
    [`${SERVICE_PROVIDER_ROOT}/earnings`, "tab=settings", "Financial Settings"],
  ])("maps %s?%s to %s", (pathname, query, expected) => {
    expect(getServiceProviderPageTitle(pathname, new URLSearchParams(query))).toBe(
      expected,
    );
  });

  it("updates after query-backed navigation", () => {
    navigation.pathname = `${SERVICE_PROVIDER_ROOT}/leads`;
    navigation.searchParams = new URLSearchParams("view=proposals");
    const { rerender } = render(<SpDesktopTopbar />);
    expect(screen.getByText("Pipeline")).toBeInTheDocument();

    navigation.searchParams = new URLSearchParams("view=leads");
    rerender(<SpDesktopTopbar />);
    expect(screen.getByText("Client Briefs")).toBeInTheDocument();
  });
});

describe("Service Provider desktop top bar", () => {
  it("renders supported workspace controls without a theme toggle", () => {
    navigation.pathname = `${SERVICE_PROVIDER_ROOT}/earnings`;
    navigation.searchParams = new URLSearchParams("tab=payouts");
    render(<SpDesktopTopbar />);

    expect(screen.getByRole("navigation", { name: "Service Provider breadcrumb" })).toBeInTheDocument();
    expect(screen.getByText("Payouts")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Toggle Sidebar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Messages" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Notifications" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open account menu" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /theme/i })).not.toBeInTheDocument();
  });

  it("provides supported account destinations and closes on Escape", async () => {
    const user = userEvent.setup();
    navigation.pathname = SERVICE_PROVIDER_ROOT;
    navigation.searchParams = new URLSearchParams();
    render(<SpDesktopTopbar />);
    const trigger = screen.getByRole("button", { name: "Open account menu" });

    await user.click(trigger);
    expect(screen.getByRole("menuitem", { name: "Profile & Trust" })).toHaveAttribute(
      "href",
      "/dashboard/profile",
    );
    expect(
      screen.getByRole("menuitem", { name: "Identity & Account Verification" }),
    ).toHaveAttribute("href", "/dashboard/serviceprovider/phase-1");
    expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu", { name: "Service Provider account" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("uses mutually exclusive responsive header classes in the SP shell", () => {
    navigation.pathname = SERVICE_PROVIDER_ROOT;
    navigation.searchParams = new URLSearchParams();
    render(<DashboardLayout><p>Workspace</p></DashboardLayout>);

    const desktop = screen
      .getByRole("navigation", { name: "Service Provider breadcrumb" })
      .closest("header");
    const mobile = screen.getByText("mondial.eco").closest("header");

    expect(desktop).toHaveClass("hidden", "lg:flex");
    expect(mobile).toHaveClass("lg:hidden");
    expect(screen.queryByTestId("generic-topbar")).not.toBeInTheDocument();
  });

  it("leaves non-Service-Provider shell header behavior unchanged", () => {
    navigation.pathname = "/dashboard/creator";
    navigation.searchParams = new URLSearchParams();
    render(<DashboardLayout><p>Creator workspace</p></DashboardLayout>);

    expect(screen.getByTestId("generic-topbar")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Service Provider breadcrumb" })).not.toBeInTheDocument();
    expect(screen.queryByText("mondial.eco")).not.toBeInTheDocument();
  });
});

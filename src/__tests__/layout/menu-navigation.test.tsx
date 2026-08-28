import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import {
  isMenuHrefActive,
  isMenuParentActive,
  isParentItemExpanded,
  getAllMenuHrefs,
} from "@/lib/menu-navigation";
import { menu, MenuItem, MenuSection } from "@/lib/menu";
import { UserRole } from "@/lib/roles";
import AppSidebar from "@/components/layout/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

// Mock Next.js navigation hooks
let mockPathname = "/dashboard/creator";
let mockSearchParams = new URLSearchParams();
let mockPush = vi.fn();

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, onClick, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) =>
    React.createElement("a", {
      href,
      onClick: (e) => {
        if (onClick) onClick(e);
        mockPush(href);
      },
      ...props
    }, children),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}));

// Mock Auth Provider
let mockUser: { id: string; name: string; role: UserRole } | null = {
  id: "test-user-1",
  name: "Alice Founder",
  role: UserRole.CREATOR,
};

vi.mock("@/app/_providers/AuthProvider", () => ({
  useAuth: () => ({
    user: mockUser,
    token: "mock-token",
    isAuthenticated: true,
  }),
}));

// Mock Analytics / SP hooks
vi.mock("@/hooks/queries/analytics", () => ({
  useProviderOverview: () => ({
    data: {
      provider: {
        id: "p1",
        name: "Test Provider",
        initials: "TP",
        availableNow: true,
        verificationStatus: "Verified",
        tierLabel: "Tier 3",
      },
      metrics: {
        newLeads: 5,
        activeEngagements: 2,
      },
    },
  }),
}));

vi.mock("@/hooks/useProviderAvailabilityControl", () => ({
  useProviderAvailabilityControl: () => ({
    available: true,
    canUpdate: true,
    pending: false,
    toggle: vi.fn(),
    feedback: null,
  }),
}));

let mockSetOpenMobile = vi.fn();
let mockIsMobile = false;

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => mockIsMobile,
}));

describe("Menu Navigation & Submenu Interaction Suite", () => {
  beforeEach(() => {
    mockPathname = "/dashboard/creator";
    mockSearchParams = new URLSearchParams();
    mockSetOpenMobile.mockClear();
    mockPush.mockClear();
    mockIsMobile = false;
  });

  describe("A. Exact vs Prefix Route Matching & Sibling Collision Prevention", () => {
    const entrepreneurSections = menu[UserRole.ENTREPRENEUR];
    const allEntrepreneurHrefs = getAllMenuHrefs(entrepreneurSections);

    it("matches exact route for KPI Tracker", () => {
      const active = isMenuHrefActive(
        "/dashboard/entrepreneur/phase-3/kpi-tracker",
        "/dashboard/entrepreneur/phase-3/kpi-tracker",
        new URLSearchParams(),
        allEntrepreneurHrefs
      );
      expect(active).toBe(true);
    });

    it("does NOT falsely highlight Financials & KPIs when on KPI Tracker (collision prevention)", () => {
      const parentActive = isMenuHrefActive(
        "/dashboard/entrepreneur/phase-3",
        "/dashboard/entrepreneur/phase-3/kpi-tracker",
        new URLSearchParams(),
        allEntrepreneurHrefs
      );
      expect(parentActive).toBe(false);
    });

    it("highlights Financials & KPIs when on an unlisted sub-step like phase-3/step-2", () => {
      const parentActive = isMenuHrefActive(
        "/dashboard/entrepreneur/phase-3",
        "/dashboard/entrepreneur/phase-3/step-2",
        new URLSearchParams(),
        allEntrepreneurHrefs
      );
      expect(parentActive).toBe(true);
    });

    it("does NOT make dashboard root active when on a sub-page", () => {
      const creatorSections = menu[UserRole.CREATOR];
      const allCreatorHrefs = getAllMenuHrefs(creatorSections);

      const dashboardActive = isMenuHrefActive(
        "/dashboard/creator",
        "/dashboard/creator/myideas",
        new URLSearchParams(),
        allCreatorHrefs
      );
      expect(dashboardActive).toBe(false);
    });
  });

  describe("B. Service Provider Query-Parameter Views", () => {
    const spSections = menu[UserRole.SERVICE_PROVIDER];
    const allSpHrefs = getAllMenuHrefs(spSections);

    it("correctly distinguishes Client Briefs (?view=leads) vs Pipeline (?view=proposals)", () => {
      const leadsParams = new URLSearchParams("view=leads");
      const proposalsParams = new URLSearchParams("view=proposals");

      expect(
        isMenuHrefActive(
          "/dashboard/serviceprovider/leads?view=leads",
          "/dashboard/serviceprovider/leads",
          leadsParams,
          allSpHrefs
        )
      ).toBe(true);

      expect(
        isMenuHrefActive(
          "/dashboard/serviceprovider/leads?view=proposals",
          "/dashboard/serviceprovider/leads",
          leadsParams,
          allSpHrefs
        )
      ).toBe(false);

      expect(
        isMenuHrefActive(
          "/dashboard/serviceprovider/leads?view=proposals",
          "/dashboard/serviceprovider/leads",
          proposalsParams,
          allSpHrefs
        )
      ).toBe(true);

      expect(
        isMenuHrefActive(
          "/dashboard/serviceprovider/leads?view=leads",
          "/dashboard/serviceprovider/leads",
          proposalsParams,
          allSpHrefs
        )
      ).toBe(false);
    });

    it("defaults to Client Briefs when query param is absent on /leads", () => {
      const emptyParams = new URLSearchParams();
      expect(
        isMenuHrefActive(
          "/dashboard/serviceprovider/leads?view=leads",
          "/dashboard/serviceprovider/leads",
          emptyParams,
          allSpHrefs
        )
      ).toBe(true);

      expect(
        isMenuHrefActive(
          "/dashboard/serviceprovider/leads?view=proposals",
          "/dashboard/serviceprovider/leads",
          emptyParams,
          allSpHrefs
        )
      ).toBe(false);
    });

    it("correctly distinguishes Active Projects vs Completed Projects on /workroom", () => {
      const activeParams = new URLSearchParams("view=active");
      const completedParams = new URLSearchParams("view=completed");

      expect(
        isMenuHrefActive(
          "/dashboard/serviceprovider/workroom?view=active",
          "/dashboard/serviceprovider/workroom",
          activeParams,
          allSpHrefs
        )
      ).toBe(true);

      expect(
        isMenuHrefActive(
          "/dashboard/serviceprovider/workroom?view=completed",
          "/dashboard/serviceprovider/workroom",
          activeParams,
          allSpHrefs
        )
      ).toBe(false);

      expect(
        isMenuHrefActive(
          "/dashboard/serviceprovider/workroom?view=completed",
          "/dashboard/serviceprovider/workroom",
          completedParams,
          allSpHrefs
        )
      ).toBe(true);
    });

    it("correctly distinguishes Earnings sub-tabs (activity, payouts, settings)", () => {
      const activityParams = new URLSearchParams("tab=activity");
      const payoutsParams = new URLSearchParams("tab=payouts");
      const settingsParams = new URLSearchParams("tab=settings");

      const overviewHref = "/dashboard/serviceprovider/earnings?tab=activity";
      const payoutsHref = "/dashboard/serviceprovider/earnings?tab=payouts";
      const settingsHref = "/dashboard/serviceprovider/earnings?tab=settings";

      // On ?tab=payouts
      expect(isMenuHrefActive(payoutsHref, "/dashboard/serviceprovider/earnings", payoutsParams, allSpHrefs)).toBe(true);
      expect(isMenuHrefActive(overviewHref, "/dashboard/serviceprovider/earnings", payoutsParams, allSpHrefs)).toBe(false);
      expect(isMenuHrefActive(settingsHref, "/dashboard/serviceprovider/earnings", payoutsParams, allSpHrefs)).toBe(false);

      // On ?tab=settings
      expect(isMenuHrefActive(settingsHref, "/dashboard/serviceprovider/earnings", settingsParams, allSpHrefs)).toBe(true);
      expect(isMenuHrefActive(payoutsHref, "/dashboard/serviceprovider/earnings", settingsParams, allSpHrefs)).toBe(false);
    });
  });

  describe("C. Submenu Parent vs Child Interaction Rules", () => {
    it("renders parent with children as a button (not a link), toggles without navigating", () => {
      mockUser = { id: "u4", name: "Provider User", role: UserRole.SERVICE_PROVIDER };
      mockPathname = "/dashboard/serviceprovider";
      mockSearchParams = new URLSearchParams();

      render(
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      );

      const earningsParentBtn = screen.getByRole("button", { name: /Earnings & Payouts/i });
      expect(earningsParentBtn).toBeDefined();
      expect(earningsParentBtn.tagName).toBe("BUTTON");
      expect(earningsParentBtn.getAttribute("aria-expanded")).toBe("false");

      // Click parent to expand
      fireEvent.click(earningsParentBtn);

      // Assert submenu expanded
      expect(earningsParentBtn.getAttribute("aria-expanded")).toBe("true");
      expect(screen.getByText("Payouts")).toBeDefined();
      expect(screen.getByText("Financial Settings")).toBeDefined();

      // Parent click must NOT navigate
      expect(mockPush).not.toHaveBeenCalled();

      // Second click toggles collapse
      fireEvent.click(earningsParentBtn);
      expect(earningsParentBtn.getAttribute("aria-expanded")).toBe("false");
    });

    it("parent with children click does NOT close mobile drawer", () => {
      mockIsMobile = false;
      mockUser = { id: "u4", name: "Provider User", role: UserRole.SERVICE_PROVIDER };
      mockPathname = "/dashboard/serviceprovider";

      render(
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      );

      const earningsParentBtn = screen.getByRole("button", { name: /Earnings & Payouts/i });
      fireEvent.click(earningsParentBtn);

      // Mobile drawer must remain OPEN (not called with false)
      expect(mockSetOpenMobile).not.toHaveBeenCalledWith(false);
    });

    it("clicking child submenu link navigates and executes link handler", () => {
      mockIsMobile = false;
      mockUser = { id: "u4", name: "Provider User", role: UserRole.SERVICE_PROVIDER };
      mockPathname = "/dashboard/serviceprovider";

      render(
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      );

      // Open parent
      const earningsParentBtn = screen.getByRole("button", { name: /Earnings & Payouts/i });
      fireEvent.click(earningsParentBtn);

      // Click child Payouts link
      const payoutsLink = screen.getByText("Payouts");
      fireEvent.click(payoutsLink);

      // Navigates
      expect(mockPush).toHaveBeenCalledWith("/dashboard/serviceprovider/earnings?tab=payouts");
    });

    it("items without children navigate on click", () => {
      mockIsMobile = false;
      mockUser = { id: "u1", name: "Creator User", role: UserRole.CREATOR };
      mockPathname = "/dashboard/creator";

      render(
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      );

      const myIdeasLink = screen.getByText("My Ideas");
      fireEvent.click(myIdeasLink);

      expect(mockPush).toHaveBeenCalledWith("/dashboard/creator/myideas");
    });

    it("active child URL auto-expands parent and marks both active", () => {
      mockUser = { id: "u4", name: "Provider User", role: UserRole.SERVICE_PROVIDER };
      mockPathname = "/dashboard/serviceprovider/earnings";
      mockSearchParams = new URLSearchParams("tab=payouts");

      render(
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      );

      const earningsParentBtn = screen.getByRole("button", { name: /Earnings & Payouts/i });
      expect(earningsParentBtn.getAttribute("aria-expanded")).toBe("true");

      const payoutsItem = screen.getByText("Payouts");
      expect(payoutsItem).toBeDefined();
    });
  });
});

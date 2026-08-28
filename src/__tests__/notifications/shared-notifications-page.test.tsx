import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SharedNotificationsPage from "@/components/notifications/SharedNotificationsPage";
import type { AppNotification } from "@/types/notifications";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/dashboard/entrepreneur/notifications",
}));

const mockNotifications: AppNotification[] = Array.from({ length: 25 }, (_, i) => ({
  id: `notif-${i + 1}`,
  userId: "user-123",
  title: `Project Update ${i + 1}`,
  body: `Detailed activity message for event ${i + 1}`,
  type: i % 2 === 0 ? "Message" : "Investment",
  referenceId: null,
  link: `/dashboard/deals/deal-${i + 1}`,
  isRead: i >= 5, // 5 unread, 20 read
  createdAt: new Date(Date.now() - (i + 1) * 3600_000).toISOString(),
}));

const mockMarkRead = vi.fn();
const mockMarkAllRead = vi.fn();

let mockState = {
  notifications: mockNotifications,
  unreadCount: 5,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
};

vi.mock("@/hooks/queries/notifications", () => ({
  useNotifications: () => mockState,
  useMarkNotificationRead: () => ({ mutate: mockMarkRead }),
  useMarkAllNotificationsRead: () => ({ mutate: mockMarkAllRead, isPending: false }),
}));

describe("SharedNotificationsPage Component & UX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockState = {
      notifications: mockNotifications,
      unreadCount: 5,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    };
  });

  it("renders page header with Inter title and DM Sans subtitle", () => {
    render(<SharedNotificationsPage role="Entrepreneur" />);

    expect(screen.getByRole("heading", { level: 1, name: "Notifications" })).toBeInTheDocument();
    expect(
      screen.getByText("Stay updated on your projects, deals, messages, and platform activity.")
    ).toBeInTheDocument();
  });

  it("renders all notifications with initial page size limit and Load More button", () => {
    render(<SharedNotificationsPage role="Entrepreneur" />);

    // Initial page size is 20
    expect(screen.getByText("Project Update 1")).toBeInTheDocument();
    expect(screen.getByText("Project Update 20")).toBeInTheDocument();
    expect(screen.queryByText("Project Update 21")).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Load More Notifications/i })).toBeInTheDocument();
  });

  it("clicking Load More renders remaining notifications", async () => {
    const user = userEvent.setup();
    render(<SharedNotificationsPage role="Entrepreneur" />);

    const loadMoreBtn = screen.getByRole("button", { name: /Load More Notifications/i });
    await user.click(loadMoreBtn);

    expect(screen.getByText("Project Update 21")).toBeInTheDocument();
    expect(screen.getByText("Project Update 25")).toBeInTheDocument();
  });

  it("filters notifications by Unread tab", async () => {
    const user = userEvent.setup();
    render(<SharedNotificationsPage role="Entrepreneur" />);

    const unreadTab = screen.getByRole("button", { name: /Unread/i });
    await user.click(unreadTab);

    // Only unread notifications (1 to 5) should appear
    expect(screen.getByText("Project Update 1")).toBeInTheDocument();
    expect(screen.getByText("Project Update 5")).toBeInTheDocument();
    expect(screen.queryByText("Project Update 6")).not.toBeInTheDocument();
  });

  it("clicking a notification triggers markAsRead and navigates to its link", async () => {
    const user = userEvent.setup();
    render(<SharedNotificationsPage role="Entrepreneur" />);

    const firstCard = screen.getByText("Project Update 1");
    await user.click(firstCard);

    expect(mockMarkRead).toHaveBeenCalledWith("notif-1");
    expect(mockPush).toHaveBeenCalledWith("/dashboard/deals/deal-1");
  });

  it("clicking Mark all as read calls markAllAsRead mutation", async () => {
    const user = userEvent.setup();
    render(<SharedNotificationsPage role="Entrepreneur" />);

    const markAllBtn = screen.getByRole("button", { name: /Mark all as read/i });
    await user.click(markAllBtn);

    expect(mockMarkAllRead).toHaveBeenCalled();
  });

  it("renders empty state when no notifications exist", () => {
    mockState.notifications = [];
    mockState.unreadCount = 0;

    render(<SharedNotificationsPage role="Entrepreneur" />);

    expect(screen.getByText("No notifications yet")).toBeInTheDocument();
    expect(
      screen.getByText("Updates about your projects, deals, messages, and activity will appear here.")
    ).toBeInTheDocument();
  });

  it("renders error state with retry button on API failure", async () => {
    mockState.isError = true;
    mockState.notifications = [];

    const user = userEvent.setup();
    render(<SharedNotificationsPage role="Entrepreneur" />);

    expect(screen.getByText("Could not load notifications.")).toBeInTheDocument();
    const retryBtn = screen.getByRole("button", { name: /Try Again/i });
    await user.click(retryBtn);

    expect(mockState.refetch).toHaveBeenCalled();
  });
});

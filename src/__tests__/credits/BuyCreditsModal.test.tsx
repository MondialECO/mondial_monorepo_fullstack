import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AiCreditBadge } from "@/components/layout/AiCreditBadge";
import { BuyCreditsModal } from "@/components/credits/BuyCreditsModal";
import * as creatorAiQueries from "@/hooks/queries/creator-ai";

let mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}));

describe("AI Credit Purchase System V1 Frontend", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    );
  };

  it("renders the current balance and Buy button in AiCreditBadge", () => {
    vi.spyOn(creatorAiQueries, "useAiCredits").mockReturnValue({
      data: {
        balance: 66,
        lifetimeGranted: 200,
        lifetimeSpent: 134,
        costs: {},
      },
      isLoading: false,
    } as any);

    renderWithProviders(<AiCreditBadge />);

    expect(screen.getByText("66 credits")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buy ai credits/i })).toBeInTheDocument();
  });

  it("opens BuyCreditsModal when Buy button is clicked", async () => {
    const user = userEvent.setup();
    vi.spyOn(creatorAiQueries, "useAiCredits").mockReturnValue({
      data: { balance: 66, lifetimeGranted: 200, lifetimeSpent: 134, costs: {} },
      isLoading: false,
    } as any);

    vi.spyOn(creatorAiQueries, "useCreditPackages").mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(creatorAiQueries, "useCreditPurchases").mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    renderWithProviders(<AiCreditBadge />);

    const buyButton = screen.getByRole("button", { name: /buy ai credits/i });
    await user.click(buyButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Buy AI Credits")).toBeInTheDocument();
  });

  it("displays backend-configured credit packages and prices without hardcoding", () => {
    vi.spyOn(creatorAiQueries, "useCreditPackages").mockReturnValue({
      data: [
        { packageId: "pack_100", credits: 100, amountInCents: 1000, currency: "eur", displayName: "Starter Pack" },
        { packageId: "pack_250", credits: 250, amountInCents: 2000, currency: "eur", displayName: "Creator Pack" },
        { packageId: "pack_500", credits: 500, amountInCents: 3500, currency: "eur", displayName: "Pro Pack" },
      ],
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(creatorAiQueries, "useCreditPurchases").mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    renderWithProviders(<BuyCreditsModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("€10.00")).toBeInTheDocument();
    expect(screen.getByText("250")).toBeInTheDocument();
    expect(screen.getByText("€20.00")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("€35.00")).toBeInTheDocument();
  });

  it("shows informational message when packages are unpriced or not configured", () => {
    vi.spyOn(creatorAiQueries, "useCreditPackages").mockReturnValue({
      data: [], // empty / unconfigured
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(creatorAiQueries, "useCreditPurchases").mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    renderWithProviders(<BuyCreditsModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Pricing In Preparation")).toBeInTheDocument();
    expect(
      screen.getByText(/Package prices have not been finalized yet/i)
    ).toBeInTheDocument();
  });

  it("calls checkout mutation with packageId only and redirects on success", async () => {
    const user = userEvent.setup();
    const mutateAsyncMock = vi.fn().mockResolvedValue({
      checkoutUrl: "https://checkout.stripe.com/c/pay/cs_test_session_url",
    });

    vi.spyOn(creatorAiQueries, "useCreateCreditCheckout").mockReturnValue({
      mutateAsync: mutateAsyncMock,
      isPending: false,
    } as any);

    vi.spyOn(creatorAiQueries, "useCreditPackages").mockReturnValue({
      data: [
        { packageId: "pack_250", credits: 250, amountInCents: 2000, currency: "eur", displayName: "Creator Pack" },
      ],
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(creatorAiQueries, "useCreditPurchases").mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    const assignMock = vi.fn();
    Object.defineProperty(window.location, "assign", {
      writable: true,
      configurable: true,
      value: assignMock,
    });

    renderWithProviders(<BuyCreditsModal isOpen={true} onClose={vi.fn()} />);

    const checkoutButton = screen.getByRole("button", { name: /continue to checkout/i });
    await user.click(checkoutButton);

    expect(mutateAsyncMock).toHaveBeenCalledWith("pack_250");
    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith(
        "https://checkout.stripe.com/c/pay/cs_test_session_url"
      );
    });
  });

  it("displays pending state and prevents duplicate clicks while checkout mutation is pending", () => {
    vi.spyOn(creatorAiQueries, "useCreateCreditCheckout").mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true, // Pending!
    } as any);

    vi.spyOn(creatorAiQueries, "useCreditPackages").mockReturnValue({
      data: [
        { packageId: "pack_250", credits: 250, amountInCents: 2000, currency: "eur", displayName: "Creator Pack" },
      ],
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(creatorAiQueries, "useCreditPurchases").mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    renderWithProviders(<BuyCreditsModal isOpen={true} onClose={vi.fn()} />);

    const checkoutButton = screen.getByRole("button", { name: /connecting…/i });
    expect(checkoutButton).toBeDisabled();
  });

  it("shows checkout cancelled notice when returned with ?creditPurchase=cancelled", () => {
    mockSearchParams = new URLSearchParams("creditPurchase=cancelled");

    vi.spyOn(creatorAiQueries, "useCreditPackages").mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(creatorAiQueries, "useCreditPurchases").mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    renderWithProviders(<BuyCreditsModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/checkout was cancelled/i)).toBeInTheDocument();
  });

  it("invalidates queries when returned with ?creditPurchase=success", () => {
    mockSearchParams = new URLSearchParams("creditPurchase=success");
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    vi.spyOn(creatorAiQueries, "useCreditPackages").mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(creatorAiQueries, "useCreditPurchases").mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    renderWithProviders(<BuyCreditsModal isOpen={true} onClose={vi.fn()} />);

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["ai-credits"] });
    expect(screen.getByText(/payment received!/i)).toBeInTheDocument();
  });

  it("renders purchase history tab with status badges", async () => {
    const user = userEvent.setup();

    vi.spyOn(creatorAiQueries, "useCreditPackages").mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(creatorAiQueries, "useCreditPurchases").mockReturnValue({
      data: [
        {
          purchaseId: "p_1",
          packageId: "pack_250",
          credits: 250,
          amountInCents: 2000,
          currency: "eur",
          status: "succeeded",
          createdAt: new Date().toISOString(),
        },
      ],
      isLoading: false,
    } as any);

    renderWithProviders(<BuyCreditsModal isOpen={true} onClose={vi.fn()} />);

    const historyTab = screen.getByRole("button", { name: /history/i });
    await user.click(historyTab);

    expect(screen.getByText("+250 AI Credits")).toBeInTheDocument();
    expect(screen.getByText("succeeded")).toBeInTheDocument();
  });

  it("activates bounded polling (2500ms) while returned purchase is pending", () => {
    mockSearchParams = new URLSearchParams("creditPurchase=success");

    let capturedOptions: any = null;
    vi.spyOn(creatorAiQueries, "useCreditPurchases").mockImplementation((options) => {
      capturedOptions = options;
      return {
        data: [
          {
            purchaseId: "p_pending",
            packageId: "pack_250",
            credits: 250,
            amountInCents: 990,
            currency: "eur",
            status: "pending",
            createdAt: new Date().toISOString(),
          },
        ],
        isLoading: false,
      } as any;
    });

    renderWithProviders(<BuyCreditsModal isOpen={true} onClose={vi.fn()} />);

    expect(capturedOptions?.refetchInterval).toBe(2500);
    expect(screen.getByText(/Adding your credits/i)).toBeInTheDocument();
  });

  it("stops polling immediately when purchase status is succeeded", async () => {
    mockSearchParams = new URLSearchParams("creditPurchase=success");

    let capturedOptions: any = null;
    vi.spyOn(creatorAiQueries, "useCreditPurchases").mockImplementation((options) => {
      capturedOptions = options;
      return {
        data: [
          {
            purchaseId: "p_succ",
            packageId: "pack_250",
            credits: 250,
            amountInCents: 990,
            currency: "eur",
            status: "succeeded",
            createdAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          },
        ],
        isLoading: false,
      } as any;
    });

    renderWithProviders(<BuyCreditsModal isOpen={true} onClose={vi.fn()} />);

    // When latestStatus is succeeded, isFulfillmentComplete sets refetchInterval to false
    await waitFor(() => {
      expect(capturedOptions?.refetchInterval).toBe(false);
    });
    expect(screen.getByText(/Credits added successfully/i)).toBeInTheDocument();
  });

  it("stops polling immediately when purchase status is failed or expired", async () => {
    mockSearchParams = new URLSearchParams("creditPurchase=success");

    let capturedOptions: any = null;
    vi.spyOn(creatorAiQueries, "useCreditPurchases").mockImplementation((options) => {
      capturedOptions = options;
      return {
        data: [
          {
            purchaseId: "p_failed",
            packageId: "pack_250",
            credits: 250,
            amountInCents: 990,
            currency: "eur",
            status: "failed",
            createdAt: new Date().toISOString(),
          },
        ],
        isLoading: false,
      } as any;
    });

    renderWithProviders(<BuyCreditsModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(capturedOptions?.refetchInterval).toBe(false);
    });
    expect(screen.getByText(/Payment failed or could not be completed/i)).toBeInTheDocument();
  });
});


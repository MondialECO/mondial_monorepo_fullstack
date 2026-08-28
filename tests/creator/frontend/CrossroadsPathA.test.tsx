import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CrossroadsPathA } from "@/components/creator/phase5/CrossroadsPathA";

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const api = vi.hoisted(() => ({
  ipValuation: vi.fn(),
  publishMarketplace: vi.fn(),
  setMarketplaceStatus: vi.fn(),
  getInterests: vi.fn(),
  acceptInterest: vi.fn(),
  declineInterest: vi.fn(),
}));

const marketplaceProjectsMock = vi.hoisted(() => ({
  getMyDeal: vi.fn().mockResolvedValue({ deal: null }),
}));

vi.mock("@/lib/api-creator-journey", () => ({ creatorJourneyApi: api }));
vi.mock("@/lib/api-marketplace-projects", () => ({ marketplaceProjectsApi: marketplaceProjectsMock }));

describe("CrossroadsPathA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.publishMarketplace.mockResolvedValue({ isEmpty: true, matches: [], hasMatches: false });
    api.setMarketplaceStatus.mockResolvedValue({ listing: { status: "paused" } });
    api.getInterests.mockResolvedValue([]);
    marketplaceProjectsMock.getMyDeal.mockResolvedValue({ deal: null });
  });

  it("publishes to marketplace with deal modes, asking price and honest buyer empty state", async () => {
    render(<CrossroadsPathA ideaId="idea-a" onChanged={vi.fn()} />);
    expect(screen.queryByText(/license/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Your asking price"), { target: { value: "28000" } });
    fireEvent.click(screen.getByRole("button", { name: /publish to marketplace/i }));

    expect(await screen.findByText(/No automatic buyer matches yet/i)).toBeInTheDocument();
    expect(api.publishMarketplace).toHaveBeenCalledWith(
      expect.objectContaining({ askingPrice: 28000, ndaRequired: true, dealModes: ["full_buyout"] }),
      "idea-a",
    );
  });

  it("renders published summary card in State B and supports entering edit mode", async () => {
    render(
      <CrossroadsPathA
        ideaId="idea-a"
        initial={{
          marketplaceListing: {
            askingPrice: 125000,
            dealModes: ["full_buyout", "equity_partnership"],
            publishedAt: "2026-08-25T00:00:00Z",
            status: "available",
          },
        }}
        onChanged={vi.fn()}
      />
    );

    // Published summary card
    expect(screen.getByText("Marketplace Listing Active")).toBeInTheDocument();
    expect(screen.getByText("LIVE")).toBeInTheDocument();
    expect(screen.getByText("€125,000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit marketplace listing/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pause listing/i })).toBeInTheDocument();
    expect(screen.getByText(/view public listing/i)).toBeInTheDocument();

    // Click Edit Marketplace Listing
    fireEvent.click(screen.getByRole("button", { name: /edit marketplace listing/i }));

    // Editor appears with live context indicator
    expect(screen.getByText("Editing Live Listing")).toBeInTheDocument();
    expect(screen.getByText(/Changes update the public listing only/i)).toBeInTheDocument();
    const input = screen.getByLabelText("Your asking price") as HTMLInputElement;
    expect(input.value).toBe("125000");
    expect(screen.getByRole("button", { name: /save & update listing/i })).toBeInTheDocument();
  });

  it("saves edited listing and shows feedback message", async () => {
    const onChanged = vi.fn();
    render(
      <CrossroadsPathA
        ideaId="idea-a"
        initial={{
          marketplaceListing: {
            askingPrice: 125000,
            dealModes: ["full_buyout"],
            publishedAt: "2026-08-25T00:00:00Z",
            status: "available",
          },
        }}
        onChanged={onChanged}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /edit marketplace listing/i }));

    const input = screen.getByLabelText("Your asking price");
    fireEvent.change(input, { target: { value: "150000" } });

    fireEvent.click(screen.getByRole("button", { name: /save & update listing/i }));

    await waitFor(() => {
      expect(api.publishMarketplace).toHaveBeenCalledWith(
        expect.objectContaining({ askingPrice: 150000, dealModes: ["full_buyout"] }),
        "idea-a",
      );
      expect(screen.getByText("Marketplace listing updated.")).toBeInTheDocument();
      expect(onChanged).toHaveBeenCalled();
    });
  });

  it("toggles listing status between pause and resume", async () => {
    const onChanged = vi.fn();
    render(
      <CrossroadsPathA
        ideaId="idea-a"
        initial={{
          marketplaceListing: {
            askingPrice: 100000,
            dealModes: ["full_buyout"],
            publishedAt: "2026-08-25T00:00:00Z",
            status: "available",
          },
        }}
        onChanged={onChanged}
      />
    );

    const pauseBtn = screen.getByRole("button", { name: /pause listing/i });
    fireEvent.click(pauseBtn);

    await waitFor(() => {
      expect(api.setMarketplaceStatus).toHaveBeenCalledWith("paused", "idea-a");
      expect(screen.getByText("PAUSED")).toBeInTheDocument();
      expect(screen.getByText("Marketplace listing paused.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /resume listing/i })).toBeInTheDocument();
    });
  });

  it("safely isolates asking price between idea switches in edit mode", async () => {
    // 1. Idea A loaded fresh (not published)
    const { rerender } = render(
      <CrossroadsPathA
        ideaId="idea-a"
        initial={{ marketplaceListing: { askingPrice: 125000, publishedAt: null } }}
        onChanged={vi.fn()}
      />
    );
    const inputA = screen.getByLabelText("Your asking price") as HTMLInputElement;
    expect(inputA.value).toBe("125000");

    // 2. Switch to idea B (fetching/undefined initial data)
    rerender(<CrossroadsPathA ideaId="idea-b" initial={undefined} onChanged={vi.fn()} />);
    const inputBEmpty = screen.getByLabelText("Your asking price") as HTMLInputElement;
    expect(inputBEmpty.value).toBe("");

    // 3. Idea B data arrives with 50000
    rerender(
      <CrossroadsPathA
        ideaId="idea-b"
        initial={{ marketplaceListing: { askingPrice: 50000, publishedAt: null } }}
        onChanged={vi.fn()}
      />
    );
    const inputB = screen.getByLabelText("Your asking price") as HTMLInputElement;
    expect(inputB.value).toBe("50000");

    // 4. User makes an unsaved edit on idea B (60000)
    fireEvent.change(inputB, { target: { value: "60000" } });
    expect(inputB.value).toBe("60000");

    // 5. Same-idea background refresh occurs (new initial object reference for idea B)
    rerender(
      <CrossroadsPathA
        ideaId="idea-b"
        initial={{ marketplaceListing: { askingPrice: 50000, publishedAt: null } }}
        onChanged={vi.fn()}
      />
    );
    expect(inputB.value).toBe("60000");

    // 6. Switch back to idea A
    rerender(
      <CrossroadsPathA
        ideaId="idea-a"
        initial={{ marketplaceListing: { askingPrice: 125000, publishedAt: null } }}
        onChanged={vi.fn()}
      />
    );
    const inputABack = screen.getByLabelText("Your asking price") as HTMLInputElement;
    expect(inputABack.value).toBe("125000");
  });

  it("reverts changes and exits edit mode on Cancel", async () => {
    render(
      <CrossroadsPathA
        ideaId="idea-a"
        initial={{
          marketplaceListing: {
            askingPrice: 125000,
            dealModes: ["full_buyout"],
            publishedAt: "2026-08-25T00:00:00Z",
            status: "available",
          },
        }}
        onChanged={vi.fn()}
      />
    );

    // Enter edit mode
    fireEvent.click(screen.getByRole("button", { name: /edit marketplace listing/i }));
    const input = screen.getByLabelText("Your asking price") as HTMLInputElement;
    expect(input.value).toBe("125000");

    // Modify asking price
    fireEvent.change(input, { target: { value: "199000" } });
    expect(input.value).toBe("199000");

    // Notice material change warning
    expect(screen.getByText(/You are editing a live marketplace listing/i)).toBeInTheDocument();

    // Click Cancel
    fireEvent.click(screen.getAllByRole("button", { name: /cancel/i })[0]);

    // Back to published summary card with original price
    expect(screen.getByText("Marketplace Listing Active")).toBeInTheDocument();
    expect(screen.getByText("€125,000")).toBeInTheDocument();
    expect(screen.queryByText("Editing Live Listing")).not.toBeInTheDocument();
  });

  it("disables marketplace push management when project is SOLD", async () => {
    render(
      <CrossroadsPathA
        ideaId="idea-a"
        initial={{
          projectOutcome: "SOLD",
          marketplaceListing: {
            askingPrice: 125000,
            dealModes: ["full_buyout"],
            publishedAt: "2026-08-25T00:00:00Z",
            status: "closed",
          },
        }}
        onChanged={vi.fn()}
      />
    );

    // The project is marked SOLD / Closed
    expect(screen.getByText(/^SOLD$/i)).toBeInTheDocument();
    expect(screen.getByText(/This project has been sold via Full Buyout/i)).toBeInTheDocument();
    // Edit CTA is not available
    expect(screen.queryByRole("button", { name: /edit marketplace listing/i })).not.toBeInTheDocument();
  });
});


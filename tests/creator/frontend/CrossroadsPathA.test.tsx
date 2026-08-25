import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CrossroadsPathA } from "@/components/creator/phase5/CrossroadsPathA";

const api = vi.hoisted(() => ({ ipValuation: vi.fn(), publishMarketplace: vi.fn() }));
vi.mock("@/lib/api-creator-journey", () => ({ creatorJourneyApi: api }));

describe("CrossroadsPathA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.publishMarketplace.mockResolvedValue({ isEmpty: true, matches: [], hasMatches: false });
  });

  it("publishes only a Full Buyout with the creator asking price and an honest buyer empty state", async () => {
    render(<CrossroadsPathA ideaId="idea-a" onChanged={vi.fn()} />);
    expect(screen.queryByText(/license/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Your asking price"), { target: { value: "28000" } });
    fireEvent.click(screen.getByRole("button", { name: "Publish Full Buyout Listing" }));

    expect(await screen.findByText(/No buyer matches yet/i)).toBeInTheDocument();
    expect(api.publishMarketplace).toHaveBeenCalledWith(
      expect.objectContaining({ askingPrice: 28000, ndaRequired: true }),
      "idea-a",
    );
  });

  it("hydrates persisted asking price when initial data arrives asynchronously", async () => {
    const { rerender } = render(<CrossroadsPathA ideaId="idea-a" onChanged={vi.fn()} />);
    const input = screen.getByLabelText("Your asking price") as HTMLInputElement;
    expect(input.value).toBe("");

    rerender(
      <CrossroadsPathA
        ideaId="idea-a"
        initial={{ marketplaceListing: { askingPrice: 125000, publishedAt: "2026-08-25T00:00:00Z" } }}
        onChanged={vi.fn()}
      />
    );
    expect(input.value).toBe("125000");
  });

  it("safely isolates asking price between idea switches and protects unsaved user edits", async () => {
    // 1. Idea A loaded with 125000
    const { rerender } = render(
      <CrossroadsPathA
        ideaId="idea-a"
        initial={{ marketplaceListing: { askingPrice: 125000, publishedAt: "2026-08-25T00:00:00Z" } }}
        onChanged={vi.fn()}
      />
    );
    const input = screen.getByLabelText("Your asking price") as HTMLInputElement;
    expect(input.value).toBe("125000");

    // 2. Switch to idea B (fetching/undefined initial data)
    rerender(<CrossroadsPathA ideaId="idea-b" initial={undefined} onChanged={vi.fn()} />);
    expect(input.value).toBe("");

    // 3. Idea B data arrives with 50000
    rerender(
      <CrossroadsPathA
        ideaId="idea-b"
        initial={{ marketplaceListing: { askingPrice: 50000, publishedAt: "2026-08-25T00:00:00Z" } }}
        onChanged={vi.fn()}
      />
    );
    expect(input.value).toBe("50000");

    // 4. User makes an unsaved edit on idea B (60000)
    fireEvent.change(input, { target: { value: "60000" } });
    expect(input.value).toBe("60000");

    // 5. Same-idea background refresh occurs (new initial object reference for idea B)
    rerender(
      <CrossroadsPathA
        ideaId="idea-b"
        initial={{ marketplaceListing: { askingPrice: 50000, publishedAt: "2026-08-25T00:00:00Z" } }}
        onChanged={vi.fn()}
      />
    );
    expect(input.value).toBe("60000");

    // 6. Switch back to idea A
    rerender(
      <CrossroadsPathA
        ideaId="idea-a"
        initial={{ marketplaceListing: { askingPrice: 125000, publishedAt: "2026-08-25T00:00:00Z" } }}
        onChanged={vi.fn()}
      />
    );
    expect(input.value).toBe("125000");
  });
});

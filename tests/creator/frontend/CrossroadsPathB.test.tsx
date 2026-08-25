import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CrossroadsPathB } from "@/components/creator/phase5/CrossroadsPathB";

vi.mock("@/lib/api-creator-journey", () => ({ creatorJourneyApi: {} }));

describe("CrossroadsPathB", () => {
  it("does not present generic ownership or €150k as creator decisions", () => {
    render(<CrossroadsPathB ideaId="idea-a" onChanged={vi.fn()} />);

    expect(screen.getByLabelText("Your funding target")).toHaveValue(null);
    expect(screen.queryByDisplayValue("150000")).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText("Holder")).toHaveValue("");
    expect(screen.getByText(/enter your intended split/i)).toBeInTheDocument();
  });
});

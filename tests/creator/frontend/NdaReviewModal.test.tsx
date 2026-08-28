import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NdaReviewModal } from "@/components/marketplace/NdaReviewModal";
import { NdaStatus } from "@/lib/api-marketplace-projects";

describe("NdaReviewModal", () => {
  const mockNdaStatus: NdaStatus = {
    ideaId: "idea_123",
    projectName: "Autonomous Logistics Drone",
    creatorName: "Sarah Connor",
    entrepreneurName: "John Doe",
    interestId: "interest_456",
    interestStatus: "accepted",
    ndaRequired: true,
    ndaSigned: false,
    ndaVersion: "1.0",
    accessGranted: false,
  };

  it("renders modal with project, creator, entrepreneur and standard clauses", () => {
    render(
      <NdaReviewModal
        isOpen={true}
        onClose={vi.fn()}
        ndaStatus={mockNdaStatus}
        onSign={vi.fn()}
      />
    );

    expect(screen.getByText(/Project Non-Disclosure Agreement/i)).toBeInTheDocument();
    expect(screen.getByText("Autonomous Logistics Drone")).toBeInTheDocument();
    expect(screen.getByText("Sarah Connor")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText(/Mondial Platform Standard Confidentiality Terms/i)).toBeInTheDocument();
  });

  it("disables sign button until acknowledgement checkbox is checked", async () => {
    const onSign = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <NdaReviewModal
        isOpen={true}
        onClose={onClose}
        ndaStatus={mockNdaStatus}
        onSign={onSign}
      />
    );

    const signBtn = screen.getByRole("button", { name: /accept & sign nda/i });
    expect(signBtn).toBeDisabled();

    const checkbox = screen.getByRole("checkbox");
    fireEvent.click(checkbox);
    expect(signBtn).not.toBeDisabled();

    fireEvent.click(signBtn);
    await waitFor(() => {
      expect(onSign).toHaveBeenCalledWith(
        "I accept the terms of the Non-Disclosure Agreement"
      );
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("renders gracefully with fallback values when ndaStatus is null", () => {
    render(
      <NdaReviewModal
        isOpen={true}
        onClose={vi.fn()}
        ndaStatus={null}
        projectName="Fallback Drone Project"
        onSign={vi.fn()}
      />
    );

    expect(screen.getByText(/Project Non-Disclosure Agreement/i)).toBeInTheDocument();
    expect(screen.getByText("Fallback Drone Project")).toBeInTheDocument();
  });

  it("does not render when isOpen is false", () => {
    const { container } = render(
      <NdaReviewModal
        isOpen={false}
        onClose={vi.fn()}
        ndaStatus={mockNdaStatus}
        onSign={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});

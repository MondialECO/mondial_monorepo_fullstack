import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EquityOfferForm } from "@/components/marketplace/EquityOfferForm";
import { EquityOfferReviewModal } from "@/components/marketplace/EquityOfferReviewModal";
import { EquityDeal } from "@/lib/api-marketplace-projects";

vi.mock("next/link", () => ({
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("MarketplacePhase3EquityOffer", () => {
  const mockDeal: EquityDeal = {
    id: "deal_123",
    ideaId: "idea_abc",
    projectName: "Autonomous Fleet Orchestrator",
    dealType: "EQUITY_PARTNERSHIP",
    dealStage: "OFFER_NEGOTIATION",
    status: "initiated",
    creatorId: "creator_1",
    creatorName: "Sarah Connor",
    entrepreneurId: "ent_1",
    entrepreneurName: "John Doe",
    conversationId: "convo_123",
    currentTurn: "creator",
    currentRevisionNumber: 1,
    acceptedRevisionNumber: null,
    acceptedAt: null,
    activeTerms: {
      equityPercentage: 15,
      creatorRole: "Co-founder",
      cashComponent: 5000,
      vestingEnabled: true,
      vestingMonths: 48,
      cliffMonths: 12,
      responsibilities: ["Architecture handover", "Technical roadmap"],
      timeCommitment: "10 hours / week",
      expiresAt: new Date(Date.now() + 864000000).toISOString(),
      notes: "Excited to partner on this!",
    },
    revisions: [
      {
        revisionNumber: 1,
        offeredByRole: "entrepreneur",
        offeredByUserId: "ent_1",
        status: "pending",
        terms: {
          equityPercentage: 15,
          creatorRole: "Co-founder",
          cashComponent: 5000,
          vestingEnabled: true,
          vestingMonths: 48,
          cliffMonths: 12,
          responsibilities: ["Architecture handover", "Technical roadmap"],
          timeCommitment: "10 hours / week",
        },
        createdAt: "2026-08-25T10:00:00Z",
      },
    ],
    createdAt: "2026-08-25T10:00:00Z",
    updatedAt: "2026-08-25T10:00:00Z",
  };

  describe("EquityOfferForm", () => {
    it("renders form fields for formulating initial offer", () => {
      render(
        <EquityOfferForm
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          projectName="Autonomous Fleet Orchestrator"
          creatorName="Sarah Connor"
          isCounter={false}
          currentRevisionNumber={1}
        />
      );

      expect(screen.getByText(/Send Co-founder \/ Equity Offer/i)).toBeInTheDocument();
      expect(screen.getByText(/Creator Equity Percentage/i)).toBeInTheDocument();
      expect(screen.getByText(/Creator Role in Project/i)).toBeInTheDocument();
      expect(screen.getByText(/Vesting Schedule/i)).toBeInTheDocument();
    });

    it("submits valid offer payload when form is completed", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <EquityOfferForm
          isOpen={true}
          onClose={onClose}
          onSubmit={onSubmit}
          projectName="Autonomous Fleet Orchestrator"
          creatorName="Sarah Connor"
          isCounter={false}
          currentRevisionNumber={1}
        />
      );

      const submitBtn = screen.getByRole("button", { name: /send equity offer/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            equityPercentage: 15,
            creatorRole: "Co-founder",
            vestingEnabled: true,
          })
        );
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe("EquityOfferReviewModal (Screen 01)", () => {
    it("renders offer details, terms breakdown, and creator actions on Creator's turn", () => {
      render(
        <EquityOfferReviewModal
          isOpen={true}
          onClose={vi.fn()}
          deal={mockDeal}
          isCreator={true}
          onAccept={vi.fn()}
          onCounter={vi.fn()}
          onReject={vi.fn()}
        />
      );

      expect(screen.getByText("Autonomous Fleet Orchestrator")).toBeInTheDocument();
      expect(screen.getByText("Sarah Connor")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("15%")).toBeInTheDocument();
      expect(screen.getByText("Your Turn to Respond")).toBeInTheDocument();

      // Action buttons visible for creator
      expect(screen.getByRole("button", { name: /accept offer/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /counter offer/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /reject/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /ask question/i })).toBeInTheDocument();
    });

    it("calls onAccept when Creator clicks Accept Offer", async () => {
      const onAccept = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <EquityOfferReviewModal
          isOpen={true}
          onClose={onClose}
          deal={mockDeal}
          isCreator={true}
          onAccept={onAccept}
          onCounter={vi.fn()}
          onReject={vi.fn()}
        />
      );

      const acceptBtn = screen.getByRole("button", { name: /accept offer/i });
      fireEvent.click(acceptBtn);

      await waitFor(() => {
        expect(onAccept).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("shows confirm reject before triggering onReject", async () => {
      const onReject = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <EquityOfferReviewModal
          isOpen={true}
          onClose={onClose}
          deal={mockDeal}
          isCreator={true}
          onAccept={vi.fn()}
          onCounter={vi.fn()}
          onReject={onReject}
        />
      );

      const rejectBtn = screen.getByRole("button", { name: /^reject$/i });
      fireEvent.click(rejectBtn);

      const confirmBtn = screen.getByRole("button", { name: /confirm reject/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(onReject).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("renders waiting turn state for Entrepreneur when turn is Creator", () => {
      render(
        <EquityOfferReviewModal
          isOpen={true}
          onClose={vi.fn()}
          deal={mockDeal}
          isCreator={false} // Entrepreneur viewing
          onAccept={vi.fn()}
          onCounter={vi.fn()}
          onReject={vi.fn()}
        />
      );

      expect(screen.getByText("Waiting for creator")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /accept offer/i })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
    });
  });
});

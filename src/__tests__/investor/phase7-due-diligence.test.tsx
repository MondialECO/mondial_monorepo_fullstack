import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DataRoomPage from "@/app/dashboard/investor/discovery/[companyId]/dataroom/page";
import * as oppHooks from "@/hooks/queries/investor-opportunities";
import * as diligenceApi from "@/lib/api-investor-diligence";
import type { OpportunityDetail } from "@/types/investor/opportunities";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const mockOpportunity: OpportunityDetail = {
  companyId: "comp-123",
  companyName: "Hyperion Solar",
  tagline: "Next-gen solar panels",
  industry: "CleanTech",
  country: "Ireland",
  fundingRoundType: "seed",
  fundingAskAmount: 500_000,
  equityOfferedPercent: 10,
  preMoneyValuation: 4_500_000,
  valuation: 5_000_000,
  trustScore: 88,
  isInvestorReady: true,
  matchScore: 92,
  matchStatus: "reviewing",
  ndaRequired: true,
  ndaAccepted: true,
  documentsCount: 2,
};

const mockDocs = {
  items: [
    {
      documentId: "doc-1",
      title: "Seed Pitch Deck",
      fileName: "deck.pdf",
      category: "pitch_deck",
      fileSize: 2048000,
      uploadedAt: "2026-08-01T12:00:00Z",
      status: "published",
    },
    {
      documentId: "doc-2",
      title: "Financial Projections 2026-2028",
      fileName: "financials.xlsx",
      category: "financial",
      fileSize: 1024000,
      uploadedAt: "2026-08-01T12:00:00Z",
      status: "published",
    },
  ],
  totalCount: 2,
};

const mockSummary: diligenceApi.DiligenceSummary = {
  companyId: "comp-123",
  investorId: "inv-456",
  status: "in_progress",
  percentComplete: 50,
  totalDocuments: 2,
  reviewedDocuments: 1,
  openQuestionsCount: 0,
  needsAttentionCount: 0,
  checklistCompletedCount: 1,
  totalChecklistCategories: 2,
  canComplete: true,
  blockedReason: null,
  ndaAccepted: true,
  ndaRequired: true,
  checklist: [
    {
      categoryKey: "pitch_deck",
      title: "Pitch Deck",
      status: "complete",
      totalDocuments: 1,
      reviewedDocuments: 1,
      needsAttentionDocuments: 0,
      isMandatory: true,
    },
    {
      categoryKey: "financials",
      title: "Financials & Forecasts",
      status: "not_started",
      totalDocuments: 1,
      reviewedDocuments: 0,
      needsAttentionDocuments: 0,
      isMandatory: true,
    },
  ],
  reviews: [
    {
      documentId: "doc-1",
      status: "reviewed",
      reviewedAt: "2026-08-02T10:00:00Z",
      notesCount: 1,
    },
    {
      documentId: "doc-2",
      status: "not_reviewed",
      notesCount: 0,
    },
  ],
  questions: [
    {
      id: "q-1",
      companyId: "comp-123",
      investorId: "inv-456",
      documentId: "doc-1",
      documentTitle: "Seed Pitch Deck",
      question: "What is your target CAC for Q4?",
      askedByUserId: "user-1",
      askedAt: "2026-08-02T11:00:00Z",
      founderResponse: "We target 45 EUR CAC by Q4.",
      respondedAt: "2026-08-02T14:00:00Z",
      status: "answered",
    },
  ],
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={<div>Loading...</div>}>
        <DataRoomPage params={{ companyId: "comp-123" }} />
      </React.Suspense>
    </QueryClientProvider>
  );
}

describe("Investor Due Diligence Workflow (Phase 7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(oppHooks, "useOpportunity").mockReturnValue({
      data: mockOpportunity,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    vi.spyOn(oppHooks, "useOpportunityDocuments").mockReturnValue({
      data: mockDocs,
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(oppHooks, "useInvestorSession").mockReturnValue({
      data: {
        sessionId: "sess-1",
        startedAt: "2026-08-01T10:00:00Z",
        totalTimeMinutes: 24,
        documentsViewed: 2,
        documentsDownloaded: 1,
        lastAccessAt: "2026-08-02T10:00:00Z",
        reviewedDocuments: 1,
      },
      isLoading: false,
      isError: false,
    } as any);

    vi.spyOn(diligenceApi, "getDiligenceSummary").mockResolvedValue(mockSummary);
    vi.spyOn(diligenceApi, "updateDocumentReviewStatus").mockResolvedValue({
      documentId: "doc-2",
      status: "reviewed",
      notesCount: 0,
    });
    vi.spyOn(diligenceApi, "getPrivateNotes").mockResolvedValue([]);
    vi.spyOn(diligenceApi, "createPrivateNote").mockResolvedValue({
      id: "note-1",
      investorId: "inv-456",
      companyId: "comp-123",
      content: "Solid financial margins.",
      createdByUserId: "user-1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    vi.spyOn(diligenceApi, "getDiligenceQuestions").mockResolvedValue(mockSummary.questions);
    vi.spyOn(diligenceApi, "askFounderQuestion").mockResolvedValue({
      id: "q-2",
      companyId: "comp-123",
      investorId: "inv-456",
      question: "What is your churn rate?",
      askedByUserId: "user-1",
      askedAt: new Date().toISOString(),
      status: "open",
    });
    vi.spyOn(diligenceApi, "completeDiligence").mockResolvedValue({
      ...mockSummary,
      status: "completed",
      percentComplete: 100,
    });
  });

  it("renders data room header, documents, and diligence checklist progress", async () => {
    renderPage();

    expect(await screen.findByText(/Hyperion Solar · Data Room/i)).toBeInTheDocument();
    expect(await screen.findByText(/Seed Pitch Deck/i)).toBeInTheDocument();
    expect(await screen.findByText(/Financial Projections 2026-2028/i)).toBeInTheDocument();
    expect(await screen.findByText(/Due Diligence Checklist/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/50%/i)).length).toBeGreaterThan(0);
  });

  it("displays review status badges and action buttons for documents", async () => {
    renderPage();

    expect(await screen.findByText(/50%/i)).toBeInTheDocument();
    expect(screen.getAllByText("Reviewed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Not Reviewed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Mark Reviewed").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Needs Attention").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Note").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ask Founder").length).toBeGreaterThan(0);
  });

  it("allows updating document review status to reviewed", async () => {
    renderPage();

    expect(await screen.findByText(/50%/i)).toBeInTheDocument();
    expect(screen.getAllByText("Reviewed").length).toBeGreaterThan(0);

    const markReviewedButtons = screen.getAllByText("Mark Reviewed");
    fireEvent.click(markReviewedButtons[0]);

    await waitFor(() => {
      expect(diligenceApi.updateDocumentReviewStatus).toHaveBeenCalledWith(
        "comp-123",
        "doc-2",
        "reviewed"
      );
    });
  });

  it("opens private note modal and saves a note", async () => {
    renderPage();

    const noteButtons = await screen.findAllByText("Note");
    fireEvent.click(noteButtons[0]);

    expect(await screen.findByText("Private Investor Note")).toBeInTheDocument();
    expect(screen.getByText(/The founder will never see them/i)).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/Write your private observation/i);
    fireEvent.change(textarea, { target: { value: "Solid financial margins." } });

    const addNoteBtn = screen.getByText("Add Note");
    fireEvent.click(addNoteBtn);

    await waitFor(() => {
      expect(diligenceApi.createPrivateNote).toHaveBeenCalledWith(
        "comp-123",
        "doc-1",
        "Solid financial margins."
      );
    });
  });

  it("opens ask founder modal and sends a diligence question", async () => {
    renderPage();

    const askFounderButtons = await screen.findAllByText("Ask Founder");
    fireEvent.click(askFounderButtons[0]);

    expect(await screen.findByText("Ask Founder a Question")).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText(/What assumptions support/i);
    fireEvent.change(textarea, { target: { value: "What is your churn rate?" } });

    const sendBtn = screen.getByText("Send Question");
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(diligenceApi.askFounderQuestion).toHaveBeenCalledWith(
        "comp-123",
        "doc-1",
        "Seed Pitch Deck",
        "What is your churn rate?"
      );
    });
  });

  it("opens the founder Q&A ledger drawer and shows answered questions", async () => {
    renderPage();

    const qaButton = await screen.findByText("Open Questions");
    fireEvent.click(qaButton);

    expect(await screen.findByText("Founder Q&A Ledger")).toBeInTheDocument();

    const answeredTab = screen.getByText(/Answered/i);
    fireEvent.click(answeredTab);

    expect(await screen.findByText(/What is your target CAC for Q4?/i)).toBeInTheDocument();
    expect(await screen.findByText(/We target 45 EUR CAC by Q4./i)).toBeInTheDocument();
  });

  it("allows completing due diligence when criteria are satisfied", async () => {
    renderPage();

    const completeBtn = await screen.findByText("Mark Due Diligence Complete");
    fireEvent.click(completeBtn);

    expect(await screen.findByText("Complete Due Diligence?")).toBeInTheDocument();

    const confirmBtn = screen.getByText("Confirm Completion");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(diligenceApi.completeDiligence).toHaveBeenCalledWith("comp-123");
    });
  });

  it("renders NDA locked screen when NDA is required and not signed", async () => {
    vi.spyOn(oppHooks, "useOpportunity").mockReturnValue({
      data: {
        ...mockOpportunity,
        ndaRequired: true,
        ndaAccepted: false,
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    renderPage();

    expect(await screen.findByText(/The Data Room is NDA-Protected/i)).toBeInTheDocument();
    expect(screen.queryByText(/Seed Pitch Deck/i)).not.toBeInTheDocument();
  });

  it("shows incomplete diligence warning modal when clicking Make Offer while diligence is in progress", async () => {
    renderPage();

    // Wait for diligence checklist to load first
    expect(await screen.findByText(/Due Diligence Checklist/i)).toBeInTheDocument();

    const makeOfferBtn = screen.getByText("Make Offer / Term Sheet");
    fireEvent.click(makeOfferBtn);

    expect(await screen.findByText("Due Diligence In Progress")).toBeInTheDocument();
    expect(screen.getByText(/Proceed to Offer/i)).toBeInTheDocument();
    expect(screen.getByText(/Continue Reviewing/i)).toBeInTheDocument();
  });
});

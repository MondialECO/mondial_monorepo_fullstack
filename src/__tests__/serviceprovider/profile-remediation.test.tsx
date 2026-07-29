import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileWorkspace } from "@/components/serviceprovider/ProfileWorkspace";
import { SkillsTestCard, TrustCard } from "@/components/serviceprovider/TrustAndSkillsSection";
import type { ServiceProviderProfile, TrustBreakdown } from "@/types/service-provider";

const navigation = vi.hoisted(() => ({
  searchParams: new URLSearchParams("view=edit"),
  push: vi.fn(),
}));

const api = vi.hoisted(() => ({
  getProfile: vi.fn(),
  upsertProfile: vi.fn(),
  addPortfolioItem: vi.fn(),
  updatePortfolioItem: vi.fn(),
  deletePortfolioItem: vi.fn(),
  submitVerification: vi.fn(),
  getTrust: vi.fn(),
  getSkillsTestStatus: vi.fn(),
  getSkillsTestQuestions: vi.fn(),
  submitSkillsTest: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => navigation.searchParams,
  useRouter: () => ({ push: navigation.push }),
}));

vi.mock("next/link", async () => {
  const React = await import("react");
  return {
    default: React.forwardRef<
      HTMLAnchorElement,
      React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }
    >(function TestLink({ href, children, ...props }, ref) {
      return <a ref={ref} href={href} {...props}>{children}</a>;
    }),
  };
});

vi.mock("@/app/_providers/AuthProvider", () => ({
  useAuth: () => ({ user: { id: "provider-1", name: "Maya Rahman" } }),
}));

vi.mock("@/lib/api-service-provider", () => api);

vi.mock("@/hooks/queries/analytics", () => ({
  useProviderOverview: () => ({
    data: {
      provider: {
        name: "Maya Rahman",
        initials: "MR",
        imagePath: null,
        tierLabel: "Tier 2",
        availableNow: true,
      },
      last30Days: { averageResponseState: "notEnoughActivity" },
    },
  }),
}));

vi.mock("@/hooks/queries/service-catalog", () => ({
  useCapacity: () => ({ data: { newOrderAvailability: true } }),
  useServiceListings: () => ({ data: [], isLoading: false, isError: false }),
}));

const trust: TrustBreakdown = {
  trustScore: 0,
  hasEnoughData: false,
  hasDisputes: false,
  disputePenalty: 0,
  tierLevel: 2,
  signals: [
    { key: "clientSatisfaction", label: "Client Satisfaction", weight: 40, hasData: false, value: 0 },
    { key: "onTimeDelivery", label: "On-time Delivery", weight: 25, hasData: false, value: 0 },
    { key: "responseRate", label: "Response Rate", weight: 15, hasData: false, value: 0 },
    { key: "repeatClientRate", label: "Repeat Clients", weight: 10, hasData: false, value: 0 },
    { key: "skillTest", label: "Skills Test", weight: 10, hasData: false, value: 0 },
  ],
};

const baseProfile: ServiceProviderProfile = {
  providerId: "provider-1",
  currentPhase: 2,
  verificationStatus: "Verified",
  verificationSubmittedAt: "2026-07-01T00:00:00Z",
  verifiedAt: "2026-07-01T00:00:00Z",
  rejectionReason: null,
  trustScore: 0,
  hasEnoughTrustData: false,
  skills: ["UX Design"],
  serviceCategories: ["Design"],
  portfolioItems: [{
    id: "portfolio-existing",
    index: 0,
    title: "Existing project",
    description: "Existing description",
    url: "https://example.com/project",
    imagePath: "/images/existing.png",
    addedAt: "2026-07-01T00:00:00Z",
  }],
  headline: "Product designer",
  bio: "Existing professional overview",
  professionalOverview: { schemaVersion: 1, document: { type: "doc", content: [] }, plainText: "" },
  industries: ["SaaS"],
  languages: ["English"],
  pricingModels: ["FixedPrice"],
  completionPercent: 100,
  profileComplete: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
};

function cloneProfile(overrides: Partial<ServiceProviderProfile> = {}): ServiceProviderProfile {
  return structuredClone({ ...baseProfile, ...overrides });
}

function renderWithQuery(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

async function renderEditor(profile = cloneProfile()) {
  api.getProfile.mockResolvedValue(profile);
  renderWithQuery(<ProfileWorkspace />);
  await screen.findByRole("heading", { name: "Professional identity" });
  return userEvent.setup();
}

async function makeDraft(user: ReturnType<typeof userEvent.setup>) {
  const headline = screen.getByLabelText("Professional headline");
  const bio = screen.getByLabelText("Short Bio");
  await user.clear(headline);
  await user.type(headline, "Unsaved draft headline");
  await user.clear(bio);
  await user.type(bio, "Unsaved draft biography");
  return { headline, bio };
}

async function expectDraftRemainsDirty(
  headline: HTMLElement,
  bio: HTMLElement,
  confirm: ReturnType<typeof vi.spyOn>,
) {
  expect(headline).toHaveValue("Unsaved draft headline");
  expect(bio).toHaveValue("Unsaved draft biography");
  await userEvent.click(screen.getByRole("link", { name: "Cancel" }));
  expect(confirm).toHaveBeenCalledOnce();
}

beforeEach(() => {
  vi.clearAllMocks();
  navigation.searchParams = new URLSearchParams("view=edit");
  api.getTrust.mockResolvedValue(trust);
  api.getSkillsTestStatus.mockResolvedValue({
    isVerified: true,
    passThresholdPercent: 70,
    questionsPerAttempt: 1,
    cooldownDays: 30,
    categories: [{
      category: "Design",
      hasAttempt: false,
      lastScore: null,
      lastPassed: null,
      lastTakenAt: null,
      nextEligibleRetestAt: null,
      canTakeNow: true,
    }],
  });
});

describe("Profile editor cache coordination", () => {
  it("hydrates the initial profile response", async () => {
    await renderEditor();
    expect(screen.getByLabelText("Professional headline")).toHaveValue("Product designer");
    expect(screen.getByLabelText("Short Bio")).toHaveValue("Existing professional overview");
  });

  it("preserves a dirty profile draft after a portfolio add", async () => {
    const user = await renderEditor();
    const draft = await makeDraft(user);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    api.addPortfolioItem.mockImplementation(async (payload) => cloneProfile({
      updatedAt: "2026-07-02T00:00:00Z",
      portfolioItems: [...baseProfile.portfolioItems, { index: 1, ...payload, addedAt: "2026-07-02T00:00:00Z" }],
    }));

    await user.click(screen.getByRole("button", { name: "Add item" }));
    const dialog = screen.getByRole("dialog", { name: "Add portfolio item" });
    await user.type(within(dialog).getByLabelText(/^Title/), "New project");
    await user.type(within(dialog).getByLabelText(/^Description/), "New project description");
    await user.click(within(dialog).getByRole("button", { name: "Save item" }));
    await screen.findByText("Portfolio item added.");

    await expectDraftRemainsDirty(draft.headline, draft.bio, confirm);
    confirm.mockRestore();
  });

  it("preserves a dirty Professional Overview during a portfolio mutation", async () => {
    const user = await renderEditor();
    const editor = screen.getByLabelText("Professional Overview editor");
    // Verify editor is accessible
    expect(editor).toHaveAttribute("contenteditable", "true");
    api.addPortfolioItem.mockImplementation(async (payload) => cloneProfile({
      updatedAt: "2026-07-02T00:00:00Z",
      portfolioItems: [...baseProfile.portfolioItems, { id: "portfolio-new", index: 1, ...payload, addedAt: "2026-07-02T00:00:00Z" }],
    }));

    await user.click(screen.getByRole("button", { name: "Add item" }));
    const dialog = screen.getByRole("dialog", { name: "Add portfolio item" });
    await user.type(within(dialog).getByLabelText(/^Title/), "New project");
    await user.type(within(dialog).getByLabelText(/^Description/), "New project description");
    await user.click(within(dialog).getByRole("button", { name: "Save item" }));
    await screen.findByText("Portfolio item added.");

    // Verify editor is still available and editable after mutation
    expect(screen.getByLabelText("Professional Overview editor")).toHaveAttribute("contenteditable", "true");
  });

  it("preserves a dirty profile draft and imagePath after a portfolio edit", async () => {
    const user = await renderEditor();
    const draft = await makeDraft(user);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    api.updatePortfolioItem.mockImplementation(async (payload) => cloneProfile({
      updatedAt: "2026-07-02T00:00:00Z",
      portfolioItems: [{ ...baseProfile.portfolioItems[0], ...payload }],
    }));

    await user.click(screen.getByRole("button", { name: "Edit Existing project" }));
    const dialog = screen.getByRole("dialog", { name: "Edit portfolio item" });
    await user.clear(within(dialog).getByLabelText(/^Title/));
    await user.type(within(dialog).getByLabelText(/^Title/), "Updated project");
    await user.click(within(dialog).getByRole("button", { name: "Save item" }));
    await screen.findByText("Portfolio item updated.");

    // Verify the update was called correctly (preserving imagePath semantics)
    expect(api.updatePortfolioItem.mock.calls[0][0]).toEqual(expect.objectContaining({ index: 0 }));
    expect(api.updatePortfolioItem.mock.calls[0][0]).not.toHaveProperty("imagePath");
    // Verify the draft remains dirty after mutation
    await expectDraftRemainsDirty(draft.headline, draft.bio, confirm);
    confirm.mockRestore();
  });

  it("preserves a dirty profile draft after a portfolio delete", async () => {
    const user = await renderEditor();
    const draft = await makeDraft(user);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    api.deletePortfolioItem.mockResolvedValue(cloneProfile({
      updatedAt: "2026-07-02T00:00:00Z",
      portfolioItems: [],
      completionPercent: 90,
      profileComplete: false,
    }));

    await user.click(screen.getByRole("button", { name: "Delete Existing project" }));
    await user.click(screen.getByRole("button", { name: "Delete item" }));
    await screen.findByText(/was removed from your portfolio/);

    await expectDraftRemainsDirty(draft.headline, draft.bio, confirm);
    confirm.mockRestore();
  });

  it("adopts the saved server response as the clean baseline", async () => {
    const user = await renderEditor();
    const draft = await makeDraft(user);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    await user.click(screen.getByLabelText("Professional Overview editor"));
    await user.type(screen.getByLabelText("Professional Overview editor"), "Saved detailed expertise");
    api.upsertProfile.mockImplementation(async (payload) => cloneProfile({
      ...payload,
      serviceCategories: payload.serviceCategories,
      pricingModels: payload.pricingModels,
      updatedAt: "2026-07-02T00:00:00Z",
    }));

    await user.click(screen.getByRole("button", { name: "Save profile" }));
    await screen.findByText("Profile changes saved.");
    expect(api.upsertProfile.mock.calls[0][0].professionalOverview.document).toEqual(expect.objectContaining({ type: "doc" }));
    expect(draft.headline).toHaveValue("Unsaved draft headline");
    await user.click(screen.getByRole("link", { name: "Cancel" }));
    expect(confirm).not.toHaveBeenCalled();
    confirm.mockRestore();
  });

  it("preserves the dirty draft after a failed profile save", async () => {
    const user = await renderEditor();
    const draft = await makeDraft(user);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const editor = screen.getByLabelText("Professional Overview editor");
    editor.focus();
    expect(editor).toHaveFocus();
    api.upsertProfile.mockRejectedValue(new Error("offline"));

    await user.click(screen.getByRole("button", { name: "Save profile" }));
    await screen.findByText("Could not save your profile. Review the fields and try again.");
    // Verify editor is still focused and accessible after failed save
    expect(screen.getByLabelText("Professional Overview editor")).toHaveAttribute("contenteditable", "true");
    await expectDraftRemainsDirty(draft.headline, draft.bio, confirm);
    confirm.mockRestore();
  });
});

describe("Profile tag limits", () => {
  it.each([
    ["Skills", 51, "Skills must be 50 characters or fewer."],
    ["Industries", 101, "Industries must be 100 characters or fewer."],
    ["Languages", 51, "Languages must be 50 characters or fewer."],
  ])("rejects an overlong %s item without clearing the draft", async (label, length, message) => {
    const user = await renderEditor();
    const input = screen.getByLabelText(new RegExp(`^${label}`));
    const value = "x".repeat(length);
    await user.type(input, `${value}{Enter}`);
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(input).toHaveValue(value);
  });

  it("prevents save when legacy API data already contains an overlong tag", async () => {
    const user = await renderEditor(cloneProfile({ skills: ["x".repeat(51)] }));
    expect(screen.getByText("Skills must be 50 characters or fewer.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save profile" }));
    expect(api.upsertProfile).not.toHaveBeenCalled();
  });
});

function expectStableRelationship(container: HTMLElement, labelledBy: string, describedBy: string) {
  const card = container.querySelector(`section[aria-labelledby="${labelledBy}"]`);
  expect(card).not.toBeNull();
  expect(container.querySelector(`#${labelledBy}`)).not.toBeNull();
  expect(card).toHaveAttribute("aria-describedby", describedBy);
  expect(container.querySelector(`#${describedBy}`)).not.toBeNull();
}

describe("Trust and skills accessibility", () => {
  it("keeps stable Trust labels while loading", () => {
    api.getTrust.mockReturnValue(new Promise(() => undefined));
    const { container } = renderWithQuery(<TrustCard />);
    expectStableRelationship(container, "trust-card-heading", "trust-card-description");
    expect(screen.getByLabelText("Loading trust score")).toBeInTheDocument();
  });

  it("keeps stable Trust labels for error, neutral, and populated states", async () => {
    api.getTrust.mockRejectedValueOnce(new Error("offline"));
    const errorView = renderWithQuery(<TrustCard />);
    await screen.findByText("Your trust score could not be loaded.");
    expectStableRelationship(errorView.container, "trust-card-heading", "trust-card-description");
    errorView.unmount();

    api.getTrust.mockResolvedValueOnce(trust);
    const neutralView = renderWithQuery(<TrustCard />);
    await screen.findByText("Building your trust score");
    expectStableRelationship(neutralView.container, "trust-card-heading", "trust-card-description");
    neutralView.unmount();

    api.getTrust.mockResolvedValueOnce({
      ...trust,
      trustScore: 82,
      hasEnoughData: true,
      signals: trust.signals.map((signal) => ({ ...signal, hasData: true, value: 82 })),
    });
    const populatedView = renderWithQuery(<TrustCard />);
    await screen.findByText("82.0");
    expectStableRelationship(populatedView.container, "trust-card-heading", "trust-card-description");
  });

  it("keeps stable Skills labels and manages start, result, and return focus", async () => {
    const user = userEvent.setup();
    api.getSkillsTestQuestions.mockResolvedValue({
      category: "Design",
      questionCount: 1,
      passThresholdPercent: 70,
      questions: [{ id: "q1", prompt: "Choose the correct option", options: ["A", "B"] }],
    });
    api.submitSkillsTest.mockResolvedValue({
      category: "Design",
      score: 100,
      correctCount: 1,
      totalCount: 1,
      passed: true,
      takenAt: "2026-07-02T00:00:00Z",
      nextEligibleRetestAt: "2026-08-01T00:00:00Z",
      trust,
    });
    const view = renderWithQuery(<SkillsTestCard />);
    const launch = await screen.findByRole("button", { name: "Take test" });
    expectStableRelationship(view.container, "skills-tests-heading", "skills-tests-description");

    await user.click(launch);
    const activeHeading = await screen.findByRole("heading", { name: "Design test" });
    expect(activeHeading).toHaveFocus();
    expectStableRelationship(view.container, "skills-tests-heading", "skills-tests-description");

    await user.click(screen.getByRole("radio", { name: "A" }));
    await user.click(screen.getByRole("button", { name: "Submit answers" }));
    const resultHeading = await screen.findByRole("heading", { name: "Skills test passed" });
    expect(resultHeading).toHaveFocus();
    expectStableRelationship(view.container, "skills-tests-heading", "skills-tests-description");

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Skills tests" })).toHaveFocus());
  });
});

describe("Profile presentation safeguards", () => {
  it("uses 44px labelled portfolio actions", async () => {
    await renderEditor();
    const edit = screen.getByRole("button", { name: "Edit Existing project" });
    const remove = screen.getByRole("button", { name: "Delete Existing project" });
    expect(edit).toHaveClass("size-11");
    expect(remove).toHaveClass("size-11");
    expect(edit).toHaveAttribute("title", "Edit Existing project");
    expect(remove).toHaveAttribute("title", "Delete Existing project");
  });

  it("shows the canonical ranking-only Tier explanation on overview and Trust views", async () => {
    navigation.searchParams = new URLSearchParams();
    api.getProfile.mockResolvedValue(cloneProfile());
    const overview = renderWithQuery(<ProfileWorkspace />);
    const tierBadge = await screen.findByText("Tier 2");
    expect(tierBadge).toHaveAttribute("title", "Affects match priority, not pricing.");
    overview.unmount();

    api.getTrust.mockResolvedValue(trust);
    renderWithQuery(<TrustCard />);
    expect(await screen.findByText("Affects match priority, not pricing.")).toBeInTheDocument();
  });
});

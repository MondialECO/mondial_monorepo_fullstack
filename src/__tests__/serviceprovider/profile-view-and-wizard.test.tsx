import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileView } from "@/components/serviceprovider/profile/ProfileView";
import { ProfileEditorWorkspace } from "@/components/serviceprovider/profile/editor/ProfileEditorWorkspace";
import type {
  ProfileDraftResponse,
  ServiceProviderProfile,
} from "@/types/service-provider";

const navigation = vi.hoisted(() => ({
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn(),
}));

const api = vi.hoisted(() => ({
  getProfile: vi.fn(),
  upsertProfile: vi.fn(),
  addPortfolioItem: vi.fn(),
  updatePortfolioItem: vi.fn(),
  deletePortfolioItem: vi.fn(),
  uploadProfileImage: vi.fn(),
  removeProfileImage: vi.fn(),
  uploadCoverImage: vi.fn(),
  removeCoverImage: vi.fn(),
  uploadPortfolioImage: vi.fn(),
  removePortfolioImage: vi.fn(),
  submitVerification: vi.fn(),
  getTrust: vi.fn(),
  getSkillsTestStatus: vi.fn(),
  getSkillsTestQuestions: vi.fn(),
  submitSkillsTest: vi.fn(),
  getProfileDraft: vi.fn(),
  saveProfileDraft: vi.fn(),
  discardProfileDraft: vi.fn(),
  submitProfileEditor: vi.fn(),
  upsertCredential: vi.fn(),
  uploadCredentialDocument: vi.fn(),
  deleteCredential: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => navigation.searchParams,
  useRouter: () => ({ push: navigation.push, replace: navigation.replace }),
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

let mockUser: { id: string; name: string; role?: string; roles?: string[] } = {
  id: "provider-1",
  name: "Maya Rahman",
  role: "ServiceProvider",
  roles: ["ServiceProvider"],
};

vi.mock("@/app/_providers/AuthProvider", () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock("@/lib/api-service-provider", () => api);

vi.mock("@/lib/axios", () => ({
  default: {
    get: vi.fn(async (url: string) => {
      if (url === "/profile/me") return { data: { success: true, data: await api.getProfile() } };
      if (url === "/profile/editor/draft") return { data: { success: true, data: await api.getProfileDraft() } };
      return { data: {} };
    }),
    put: vi.fn(async (url: string, payload: any) => {
      if (url === "/profile/editor/draft") return { data: { success: true, data: await api.saveProfileDraft(payload) } };
      return { data: {} };
    }),
    post: vi.fn(async (url: string, payload: any) => {
      if (url === "/profile/editor/submit") return { data: { success: true, data: await api.submitProfileEditor(payload) } };
      return { data: {} };
    }),
    delete: vi.fn(async (url: string) => {
      if (url === "/profile/editor/draft") return { data: { success: true, data: await api.discardProfileDraft() } };
      return { data: {} };
    }),
  },
}));

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

// The Tiptap editor needs a real DOM range API; the overview surface has its own
// dedicated suite, so it is stubbed to keep this file focused on the wizard.
vi.mock("@/components/serviceprovider/ProfessionalOverviewEditor", () => ({
  ProfessionalOverviewEditor: () => <div data-testid="overview-editor" />,
}));

const baseProfile: ServiceProviderProfile = {
  providerId: "provider-1",
  currentPhase: 2,
  verificationStatus: "Verified",
  trustScore: 0,
  hasEnoughTrustData: false,
  skills: ["UI Design"],
  serviceCategories: ["Design"],
  portfolioItems: [],
  headline: "Senior UI/UX Designer",
  bio: "Short bio",
  professionalOverview: { schemaVersion: 1, document: { type: "doc", content: [] }, plainText: "" },
  industries: ["SaaS"],
  languages: ["English"],
  pricingModels: ["Hourly"],
  experiences: [
    {
      id: "exp-1",
      jobTitle: "Senior Product Designer",
      companyName: "NovaTech",
      startDate: "2022-01",
      endDate: "2025-03",
      isCurrent: false,
      description: null,
    },
  ],
  education: [
    {
      id: "edu-1",
      institution: "Dhaka University",
      degree: "B.Sc. Computer Science",
      fieldOfStudy: null,
      startYear: 2019,
      endYear: 2023,
      description: null,
    },
  ],
  languageProficiencies: [{ id: "lang-1", language: "English", proficiency: "Fluent" }],
  credentials: [
    { id: "cred-verified", kind: "Certification", title: "UX Certification", status: "Verified" },
    {
      id: "cred-pending",
      kind: "License",
      title: "Pending licence",
      status: "PendingReview",
      credentialNumber: "SECRET-123",
      documentUrl: "/uploads/service-provider/credentials/doc.pdf",
      documentFileName: "licence.pdf",
    },
  ],
  profileVersion: 3,
  completionPercent: 90,
  profileComplete: false,
  createdAt: "2025-03-01T00:00:00Z",
  updatedAt: "2026-07-01T00:00:00Z",
};

const baseDraft: ProfileDraftResponse = {
  hasDraft: false,
  basedOnVersion: 3,
  lastStep: 1,
  isStale: false,
  headline: "Senior UI/UX Designer",
  bio: "Short bio",
  professionalOverview: { schemaVersion: 1, document: { type: "doc", content: [] }, plainText: "" },
  skills: ["UI Design"],
  serviceCategories: ["Design"],
  industries: ["SaaS"],
  pricingModels: ["Hourly"],
  experiences: [],
  education: [],
  languageProficiencies: [],
  updatedAt: "2026-07-29T00:00:00Z",
};

function renderWith(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = {
    id: "provider-1",
    name: "Maya Rahman",
    role: "ServiceProvider",
    roles: ["ServiceProvider"],
  };
  navigation.searchParams = new URLSearchParams();
  api.getProfile.mockResolvedValue(baseProfile);
  api.getTrust.mockResolvedValue({
    trustScore: 0,
    hasEnoughData: false,
    signals: [],
    hasDisputes: false,
    disputePenalty: 0,
    tierLevel: 2,
  });
  api.getProfileDraft.mockResolvedValue(baseDraft);
  api.saveProfileDraft.mockImplementation(async (payload) => ({ ...baseDraft, ...payload, hasDraft: true }));
  api.submitProfileEditor.mockResolvedValue({
    outcome: "ProfileUpdated",
    profile: baseProfile,
    credentialsPendingReview: 0,
  });
});

describe("Profile View", () => {
  it("renders published data read-only with no inline editing form", async () => {
    renderWith(<ProfileView mode="owner" />);

    expect(await screen.findByRole("heading", { name: "Maya Rahman", level: 1 })).toBeVisible();
    expect(screen.getByText("Senior UI/UX Designer")).toBeVisible();
    expect(screen.getByText("Senior Product Designer")).toBeVisible();
    expect(screen.getByText("B.Sc. Computer Science")).toBeVisible();

    // The whole editing form must not be inline on the view page.
    expect(screen.queryByRole("button", { name: /Next step/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Submit Profile/i })).toBeNull();
  });

  it("shows the ranking-only tier explanation and separates it from verification", async () => {
    renderWith(<ProfileView mode="owner" />);
    await screen.findByRole("heading", { name: "Maya Rahman", level: 1 });

    expect(screen.getAllByText("Affects match priority, not pricing.").length).toBeGreaterThan(0);

    // Verification and tier are two separate badges, never one combined claim.
    // "Verified" also labels a credential, so scope to the profile header.
    const header = screen.getByRole("heading", { name: "Maya Rahman", level: 1 }).closest("div")!;
    expect(within(header).getByText("Verified")).toBeVisible();

    // The tier badge is server-sourced (trust projection), so wait for it.
    await waitFor(() => expect(within(header).getByText("Tier 2")).toBeVisible());

    // Tier must never be presented as a pricing or commission signal.
    expect(screen.queryByText(/commission/i)).toBeNull();
  });

  it("hides the trust score until the server reports enough data", async () => {
    renderWith(<ProfileView mode="owner" />);
    await screen.findByRole("heading", { name: "Maya Rahman", level: 1 });

    expect(screen.getByText("Not enough data")).toBeVisible();
    expect(screen.getByText("No reviews yet")).toBeVisible();
  });

  it("points each section edit action at the step that owns it", async () => {
    renderWith(<ProfileView mode="owner" />);
    await screen.findByRole("heading", { name: "Maya Rahman", level: 1 });

    expect(screen.getByRole("link", { name: /Edit Profile/i })).toHaveAttribute(
      "href",
      expect.stringContaining("step=1")
    );
    expect(screen.getByRole("link", { name: /Edit about/i })).toHaveAttribute(
      "href",
      expect.stringContaining("focus=overview")
    );
    expect(screen.getByRole("link", { name: /Edit experience/i })).toHaveAttribute(
      "href",
      expect.stringContaining("step=2")
    );
    expect(screen.getByRole("link", { name: /Edit skills/i })).toHaveAttribute(
      "href",
      expect.stringContaining("step=3")
    );
    expect(screen.getByRole("link", { name: /Edit credentials/i })).toHaveAttribute(
      "href",
      expect.stringContaining("step=4")
    );
  });

  it("public mode hides every edit action and all private credential data", async () => {
    renderWith(<ProfileView mode="public" />);
    await screen.findByRole("heading", { name: "Maya Rahman", level: 1 });

    expect(screen.queryByRole("link", { name: /Edit Profile/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /Edit about/i })).toBeNull();

    // Portfolio edit and delete buttons must not appear: they would mutate the
    // authenticated provider's profile, not the viewed one.
    expect(screen.queryByRole("button", { name: /Edit Existing project/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Delete Existing project/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /Add item/i })).toBeNull();

    // Verified credential is shown; the pending one and its private fields are not.
    expect(screen.getByText("UX Certification")).toBeVisible();
    expect(screen.queryByText("Pending licence")).toBeNull();
    expect(screen.queryByText("SECRET-123")).toBeNull();
    expect(screen.queryByText("licence.pdf")).toBeNull();
  });

  it("owner mode shows credential review status and filename", async () => {
    renderWith(<ProfileView mode="owner" />);
    await screen.findByRole("heading", { name: "Maya Rahman", level: 1 });

    expect(screen.getByText("Pending Review")).toBeVisible();
    expect(screen.getByText("licence.pdf")).toBeVisible();
  });

  it("renders a legacy cover at the shared 4:1 rule so header height stays consistent", async () => {
    // Uploaded before the 4:1 rule. The header height must not vary per
    // provider, so this is rendered at 4:1 rather than at its stored 1600x540.
    api.getProfile.mockResolvedValue({
      ...baseProfile,
      coverImage: {
        id: "cover-legacy",
        url: "/uploads/service-provider/cover/legacy.jpg",
        contentType: "image/jpeg",
        width: 1600,
        height: 540,
        bytes: 1234,
        uploadedAt: "2026-01-01T00:00:00Z",
      },
    });
    renderWith(<ProfileView mode="owner" />);
    await screen.findByRole("heading", { name: "Maya Rahman", level: 1 });

    expect(screen.getByTestId("profile-cover").style.aspectRatio).toBe("1600 / 400");
  });

  it("renders a current-rule cover at 4:1", async () => {
    api.getProfile.mockResolvedValue({
      ...baseProfile,
      coverImage: {
        id: "cover-new",
        url: "/uploads/service-provider/cover/new.jpg",
        contentType: "image/jpeg",
        width: 1600,
        height: 400,
        bytes: 1234,
        uploadedAt: "2026-07-01T00:00:00Z",
      },
    });
    renderWith(<ProfileView mode="owner" />);
    await screen.findByRole("heading", { name: "Maya Rahman", level: 1 });

    expect(screen.getByTestId("profile-cover").style.aspectRatio).toBe("1600 / 400");
  });

  it("falls back to the cover rule when stored dimensions are unusable", async () => {
    api.getProfile.mockResolvedValue({
      ...baseProfile,
      coverImage: {
        id: "cover-broken",
        url: "/uploads/service-provider/cover/broken.jpg",
        contentType: "image/jpeg",
        width: 0,
        height: 0,
        bytes: 1234,
        uploadedAt: "2026-07-01T00:00:00Z",
      },
    });
    renderWith(<ProfileView mode="owner" />);
    await screen.findByRole("heading", { name: "Maya Rahman", level: 1 });

    expect(screen.getByTestId("profile-cover").style.aspectRatio).toBe("1600 / 400");
  });

  it("normalises the legacy inline-edit link to the separate editor route", async () => {
    navigation.searchParams = new URLSearchParams("view=edit");
    renderWith(<ProfileView mode="owner" />);

    await waitFor(() =>
      expect(navigation.replace).toHaveBeenCalledWith(
        expect.stringContaining("/profile/edit")
      )
    );
  });
});

describe("Profile editor wizard", () => {
  it("opens on step 1 and performs no write merely because it mounted", async () => {
    navigation.searchParams = new URLSearchParams("step=1");
    renderWith(<ProfileEditorWorkspace />);

    expect(await screen.findByRole("heading", { name: "Identity & Overview", level: 1 })).toBeVisible();
    expect(api.getProfileDraft).toHaveBeenCalled();
    expect(api.saveProfileDraft).not.toHaveBeenCalled();
    expect(api.submitProfileEditor).not.toHaveBeenCalled();
    expect(api.upsertProfile).not.toHaveBeenCalled();
  });

  it("hydrates published values into the draft", async () => {
    navigation.searchParams = new URLSearchParams("step=1");
    renderWith(<ProfileEditorWorkspace />);

    const headline = await screen.findByLabelText(/Professional headline/i);
    expect(headline).toHaveValue("Senior UI/UX Designer");
  });

  it("resolves a direct deep link to a later step", async () => {
    navigation.searchParams = new URLSearchParams("step=3");
    renderWith(<ProfileEditorWorkspace />);

    expect(await screen.findByRole("heading", { name: "Skills & Languages", level: 1 })).toBeVisible();
  });

  it("normalises an invalid step instead of failing", async () => {
    navigation.searchParams = new URLSearchParams("step=99");
    renderWith(<ProfileEditorWorkspace />);

    expect(await screen.findByRole("heading", { name: "Credentials", level: 1 })).toBeVisible();
  });

  it("blocks Next and shows a validation summary when step 1 is invalid", async () => {
    const user = userEvent.setup();
    navigation.searchParams = new URLSearchParams("step=1");
    api.getProfileDraft.mockResolvedValue({ ...baseDraft, headline: "" });
    renderWith(<ProfileEditorWorkspace />);

    await screen.findByRole("heading", { name: "Identity & Overview", level: 1 });
    await user.click(screen.getByRole("button", { name: /Next step/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Fix 1 issue/i);
    expect(api.saveProfileDraft).not.toHaveBeenCalled();
    expect(navigation.push).not.toHaveBeenCalled();
  });

  it("saves the draft before advancing and publishes nothing", async () => {
    const user = userEvent.setup();
    navigation.searchParams = new URLSearchParams("step=1");
    renderWith(<ProfileEditorWorkspace />);

    await screen.findByRole("heading", { name: "Identity & Overview", level: 1 });
    await user.click(screen.getByRole("button", { name: /Next step/i }));

    await waitFor(() => expect(api.saveProfileDraft).toHaveBeenCalledTimes(1));
    expect(api.saveProfileDraft.mock.calls[0][0].lastStep).toBe(2);
    // A draft save must never publish.
    expect(api.submitProfileEditor).not.toHaveBeenCalled();
    expect(api.upsertProfile).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(navigation.push).toHaveBeenCalledWith(expect.stringContaining("step=2"))
    );
  });

  it("submits with the version it opened from and never sends server-controlled fields", async () => {
    const user = userEvent.setup();
    navigation.searchParams = new URLSearchParams("step=4");
    renderWith(<ProfileEditorWorkspace />);

    await screen.findByRole("heading", { name: "Credentials", level: 1 });
    await user.click(screen.getByRole("button", { name: /Submit Profile/i }));

    await waitFor(() => expect(api.submitProfileEditor).toHaveBeenCalledTimes(1));
    const payload = api.submitProfileEditor.mock.calls[0][0];
    expect(payload.basedOnVersion).toBe(3);
    expect(payload.draft).not.toHaveProperty("providerTier");
    expect(payload.draft).not.toHaveProperty("verificationStatus");
    expect(payload.draft).not.toHaveProperty("trustScore");
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/dashboard/profile"));
  });

  it("surfaces a stale-version conflict without discarding the draft", async () => {
    const user = userEvent.setup();
    navigation.searchParams = new URLSearchParams("step=4");
    api.submitProfileEditor.mockRejectedValue({ response: { status: 409 } });
    renderWith(<ProfileEditorWorkspace />);

    await screen.findByRole("heading", { name: "Credentials", level: 1 });
    await user.click(screen.getByRole("button", { name: /Submit Profile/i }));

    expect(
      await screen.findByText("Your profile was updated in another session.")
    ).toBeVisible();
    expect(screen.getByRole("link", { name: /Review latest profile/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /Keep my current draft/i })).toBeVisible();
    // Still on step 4 with the draft intact — nothing was cleared.
    expect(screen.getByRole("heading", { name: "Credentials", level: 1 })).toBeVisible();
    expect(navigation.push).not.toHaveBeenCalledWith("/dashboard/profile");
  });
  it("keeps the draft and shows a retryable error when submit fails", async () => {
    const user = userEvent.setup();
    navigation.searchParams = new URLSearchParams("step=4");
    api.submitProfileEditor.mockRejectedValue({ response: { status: 500 } });
    renderWith(<ProfileEditorWorkspace />);

    await screen.findByRole("heading", { name: "Credentials", level: 1 });
    await user.click(screen.getByRole("button", { name: /Submit Profile/i }));

    expect(await screen.findByText(/could not be submitted/i)).toBeVisible();
    expect(screen.getByRole("button", { name: /Submit Profile/i })).toBeEnabled();
    expect(navigation.push).not.toHaveBeenCalledWith("/dashboard/profile");
  });

  it("keeps the scanner disclosure visible on the credentials step", async () => {
    navigation.searchParams = new URLSearchParams("step=4");
    renderWith(<ProfileEditorWorkspace />);

    expect(
      await screen.findByText(
        "Basic file validation is active. Production security scanning is not yet enabled."
      )
    ).toBeVisible();
    expect(
      screen.getByText(/Uploading a document does not verify it and does not change your tier./i)
    ).toBeVisible();
  });

  it("exposes an accessible step indicator that does not rely on colour alone", async () => {
    navigation.searchParams = new URLSearchParams("step=2");
    renderWith(<ProfileEditorWorkspace />);

    await screen.findByRole("heading", { name: "Experience & Education", level: 1 });
    const progress = screen.getByRole("navigation", { name: /Profile editor progress/i });
    expect(progress).toHaveTextContent(/Step 1 of 4: Identity & Overview\. Completed\./);
    expect(progress).toHaveTextContent(/Step 2 of 4: Experience & Education\. Current step\./);
  });

  it("maintains input focus and stable state during continuous typing in bio and headline", async () => {
    const user = userEvent.setup();
    navigation.searchParams = new URLSearchParams("step=1");
    renderWith(<ProfileEditorWorkspace />);

    await screen.findByRole("heading", { name: "Identity & Overview", level: 1 });

    const headlineInput = screen.getByLabelText(/Professional headline/i);
    await user.clear(headlineInput);
    await user.type(headlineInput, "Principal Architect & Lead Engineer");
    expect(headlineInput).toHaveValue("Principal Architect & Lead Engineer");
    expect(headlineInput).toHaveFocus();

    const bioTextarea = screen.getByLabelText(/Short bio/i);
    await user.clear(bioTextarea);
    await user.type(
      bioTextarea,
      "I specialize in scalable cloud architectures, distributed systems, and modern web application development."
    );
    expect(bioTextarea).toHaveValue(
      "I specialize in scalable cloud architectures, distributed systems, and modern web application development."
    );
    expect(bioTextarea).toHaveFocus();
  });

  it("renders Service category selector on Step 1 for ServiceProvider", async () => {
    navigation.searchParams = new URLSearchParams("step=1");
    renderWith(<ProfileEditorWorkspace />);

    await screen.findByRole("heading", { name: "Identity & Overview", level: 1 });
    expect(screen.getByRole("heading", { name: "Service category" })).toBeVisible();
    expect(screen.getByText("Select the primary category clients will find you under.")).toBeVisible();
  });

  it("hides Service category selector for non-ServiceProvider roles (Creator, Entrepreneur, Investor)", async () => {
    mockUser = {
      id: "user-creator",
      name: "Alice Creator",
      role: "Creator",
      roles: ["Creator"],
    };
    api.getProfile.mockResolvedValue({
      ...baseProfile,
      roles: ["Creator"],
    });
    navigation.searchParams = new URLSearchParams("step=1");
    renderWith(<ProfileEditorWorkspace />);

    await screen.findByRole("heading", { name: "Identity & Overview", level: 1 });
    expect(screen.queryByRole("heading", { name: "Service category" })).not.toBeInTheDocument();
  });
});

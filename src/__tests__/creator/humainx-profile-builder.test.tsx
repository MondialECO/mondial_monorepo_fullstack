import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HumainXDashboardCard } from "@/components/creator/dashboard/HumainXDashboardCard";
import { Phase4ProfileGuard } from "@/components/creator/phase4/Phase4ProfileGuard";
import {
  calculateLocalCompleteness,
  prepareHumainXPayload,
  creatorProfileApi,
} from "@/lib/api-creator-profile";
import type {
  HumainXFormData,
  HumainXSkill,
} from "@/types/creator/profile";

// Mock next/navigation
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
};

let mockSearchParamString = "ideaId=idea-456";

vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(mockSearchParamString),
  usePathname: () => "/dashboard/creator/phase-4",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// Mock CreatorProgressProvider
const mockCreatorState = {
  activeIdeaId: "idea-456",
  journeyState: {
    phase3: { status: "completed" },
  } as any,
  phases: {
    3: { status: "completed" },
  } as any,
};

vi.mock("@/providers/CreatorProgressProvider", () => ({
  useCreatorProgress: () => ({
    state: mockCreatorState,
    isLoading: false,
  }),
}));

// Mock api client
vi.mock("@/lib/api-creator-profile", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api-creator-profile")>();
  return {
    ...actual,
    creatorProfileApi: {
      getCompleteness: vi.fn(),
      getMyProfile: vi.fn(),
      getPhase4Readiness: vi.fn(),
      saveHumainXProfile: vi.fn(),
    },
  };
});

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

describe("HumainX Profile Completeness Logic", () => {
  const baseForm: HumainXFormData = {
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    ventureContext: {
      currentSituation: "",
      weeklyAvailability: "",
      region: "",
      previousEntrepreneurialExperience: "",
      learningPreference: "",
      delegationPreference: "",
    },
  };

  it("identifies missing required fields for Phase 4 readiness", () => {
    const completeness = calculateLocalCompleteness(baseForm);
    expect(completeness.phase4Ready).toBe(false);
    expect(completeness.missingForPhase4).toEqual([
      "Skills",
      "CurrentSituation",
      "WeeklyAvailability",
      "Region",
      "ProgressPreference",
    ]);
    expect(completeness.profileCompletion).toBe(0);
  });

  it("marks phase4Ready when 5 core fields are satisfied, even if experiences and education are empty", () => {
    const readyForm: HumainXFormData = {
      ...baseForm,
      ventureContext: {
        currentSituation: "EmployedFullTime",
        weeklyAvailability: "10to20Hours",
        region: "Ile-de-France",
        previousEntrepreneurialExperience: "",
        learningPreference: "HandsOn",
        delegationPreference: "",
      },
      skills: [{ name: "Product Design", level: "Expert", source: "SelfDeclared" }],
    };

    const completeness = calculateLocalCompleteness(readyForm);
    expect(completeness.phase4Ready).toBe(true);
    expect(completeness.missingForPhase4).toEqual([]);
    // Has 5 core fields out of 8 completeness criteria -> 63%
    expect(completeness.profileCompletion).toBeGreaterThanOrEqual(60);
    expect(completeness.profileCompletion).toBeLessThan(100);
  });

  it("calculates 100% completion when all fields including optional experiences, education, and languages are provided", () => {
    const fullForm: HumainXFormData = {
      ventureContext: {
        currentSituation: "EmployedFullTime",
        weeklyAvailability: "10to20Hours",
        region: "Ile-de-France",
        previousEntrepreneurialExperience: "FirstTimeFounder",
        learningPreference: "HandsOn",
        delegationPreference: "WantsAgency",
      },
      skills: [{ name: "Product Design", level: "Expert", source: "SelfDeclared" }],
      experiences: [
        {
          id: "exp-1",
          roleOrProjectTitle: "Senior Designer",
          organizationOrProjectName: "Acme Corp",
          isCurrent: true,
          startDate: "2022-01",
          endDate: undefined,
          experienceType: "Job",
          skillsUsed: ["Design System"],
        },
      ],
      education: [
        {
          id: "edu-1",
          institution: "Sorbonne",
          qualification: "Master",
          subjectOrField: "Computer Science",
          startYear: 2018,
          completionYear: 2020,
        },
      ],
      languages: [
        {
          id: "lang-1",
          language: "French",
          level: "Native",
        },
      ],
    };

    const completeness = calculateLocalCompleteness(fullForm);
    expect(completeness.phase4Ready).toBe(true);
    expect(completeness.missingForPhase4).toEqual([]);
    expect(completeness.profileCompletion).toBe(100);
  });
});

describe("Skill Metadata Round-Trip & Preservation", () => {
  it("preserves legacy skill with level: null and keeps existing verification intact", () => {
    const existingSkills: HumainXSkill[] = [
      { name: "Legacy Skill", level: null, source: "LegacyMigration", verification: { score: 100 } },
      { name: "React", level: "Comfortable", source: "SelfDeclared", verification: null },
    ];

    const form: HumainXFormData = {
      ventureContext: {
        currentSituation: "Employed",
        weeklyAvailability: "20Hours",
        region: "Paris",
        previousEntrepreneurialExperience: "",
        learningPreference: "Reading",
        delegationPreference: "",
      },
      skills: [
        { name: "Legacy Skill", level: null },
        { name: "React", level: "Comfortable" },
      ],
      experiences: [],
      education: [],
      languages: [],
    };

    const payload = prepareHumainXPayload(form, existingSkills);
    expect(payload.skills).toHaveLength(2);
    expect(payload.skills[0]).toEqual({
      name: "Legacy Skill",
      level: null,
      source: "LegacyMigration",
      verification: { score: 100 },
    });
    expect(payload.skills[1]).toEqual({
      name: "React",
      level: "Comfortable",
      source: "SelfDeclared",
      verification: null,
    });
  });

  it("sets source to SelfDeclared when a brand new skill is added", () => {
    const form: HumainXFormData = {
      ventureContext: {
        currentSituation: "",
        weeklyAvailability: "",
        region: "",
        previousEntrepreneurialExperience: "",
        learningPreference: "",
        delegationPreference: "",
      },
      skills: [{ name: "TypeScript", level: "Expert" } as any],
      experiences: [],
      education: [],
      languages: [],
    };

    const payload = prepareHumainXPayload(form, []);
    expect(payload.skills[0].name).toBe("TypeScript");
    expect(payload.skills[0].level).toBe("Expert");
    expect(payload.skills[0].source).toBe("SelfDeclared");
  });
});

describe("HumainXDashboardCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders not started state (0%) with 'Build My Profile' CTA", async () => {
    vi.mocked(creatorProfileApi.getCompleteness).mockResolvedValueOnce({
      profileCompletion: 0,
      phase4Ready: false,
      missingForPhase4: ["Skills", "CurrentSituation", "WeeklyAvailability", "Region", "ProgressPreference"],
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXDashboardCard ideaId="idea-123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Build your professional profile")).toBeDefined();
      expect(screen.getByText("Build My Profile")).toBeDefined();
      expect(screen.getByText("0% complete")).toBeDefined();
    });

    const cta = screen.getByText("Build My Profile").closest("a");
    expect(cta?.getAttribute("href")).toBe("/dashboard/creator/profile?ideaId=idea-123");
  });

  it("renders in-progress state (45%) with 'Continue My Profile' CTA", async () => {
    vi.mocked(creatorProfileApi.getCompleteness).mockResolvedValueOnce({
      profileCompletion: 45,
      phase4Ready: false,
      missingForPhase4: ["Skills", "ProgressPreference"],
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXDashboardCard ideaId="idea-123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Continue My Profile")).toBeDefined();
      expect(screen.getByText("45% complete")).toBeDefined();
    });
  });

  it("renders completed state (100%) with 'View My Profile' CTA pointing to mode=view", async () => {
    vi.mocked(creatorProfileApi.getCompleteness).mockResolvedValueOnce({
      profileCompletion: 100,
      phase4Ready: true,
      missingForPhase4: [],
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <HumainXDashboardCard ideaId="idea-123" />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("View My Profile")).toBeDefined();
      expect(screen.getByText("Phase 4 Ready")).toBeDefined();
    });

    const cta = screen.getByText("View My Profile").closest("a");
    expect(cta?.getAttribute("href")).toBe("/dashboard/creator/profile?mode=view&ideaId=idea-123");
  });
});

describe("Phase4ProfileGuard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Phase 3 incomplete barrier when journeyState.phase3.status is not completed", async () => {
    mockCreatorState.journeyState.phase3.status = "in_progress";
    vi.mocked(creatorProfileApi.getCompleteness).mockResolvedValueOnce({
      phase4Ready: true,
      missingForPhase4: [],
      profileCompletion: 80,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <Phase4ProfileGuard>
          <div>Protected Phase 4 Content</div>
        </Phase4ProfileGuard>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Phase 3 Must Be Completed First/i)).toBeDefined();
      expect(screen.queryByText("Protected Phase 4 Content")).toBeNull();
    });

    const cta = screen.getByText("Return to Phase 3").closest("a");
    expect(cta?.getAttribute("href")).toContain("/dashboard/creator/phase-3");
    expect(creatorProfileApi.getPhase4Readiness).not.toHaveBeenCalled();
  });

  it("shows Profile Incomplete gate when phase 3 is completed but phase4Ready is false", async () => {
    mockCreatorState.journeyState.phase3.status = "completed";
    vi.mocked(creatorProfileApi.getCompleteness).mockResolvedValueOnce({
      phase4Ready: false,
      missingForPhase4: ["Skills", "ProgressPreference"],
      profileCompletion: 40,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <Phase4ProfileGuard>
          <div>Protected Phase 4 Content</div>
        </Phase4ProfileGuard>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Personalize your construction plan/i)).toBeDefined();
      expect(screen.getAllByText("Skills").length).toBeGreaterThan(0);
      expect(screen.getByText("Progress preference (learning or delegation)")).toBeDefined();
      expect(screen.queryByText("Protected Phase 4 Content")).toBeNull();
    });

    const cta = screen.getByText("Complete My Profile").closest("a");
    expect(cta?.getAttribute("href")).toContain("/dashboard/creator/profile");
    expect(cta?.getAttribute("href")).toContain("ideaId=idea-456");
    expect(creatorProfileApi.getPhase4Readiness).not.toHaveBeenCalled();
  });

  it("redirects to HumainX profile builder when phase4Ready is true but profileCompletion < 100", async () => {
    mockCreatorState.journeyState.phase3.status = "completed";
    vi.mocked(creatorProfileApi.getCompleteness).mockResolvedValueOnce({
      phase4Ready: true,
      missingForPhase4: [],
      profileCompletion: 70,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <Phase4ProfileGuard>
          <div>Protected Phase 4 Content</div>
        </Phase4ProfileGuard>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining("/dashboard/creator/profile")
      );
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining("ideaId=idea-456")
      );
      expect(mockRouter.replace).toHaveBeenCalledWith(
        expect.stringContaining("returnTo=%2Fdashboard%2Fcreator%2Fphase-4%3FideaId%3Didea-456")
      );
      expect(screen.queryByText("Protected Phase 4 Content")).toBeNull();
    });
    expect(creatorProfileApi.getPhase4Readiness).not.toHaveBeenCalled();
  });

  it("renders protected Phase 4 children when phase 3 is completed, phase4Ready is true, and profileCompletion is 100", async () => {
    mockCreatorState.journeyState.phase3.status = "completed";
    vi.mocked(creatorProfileApi.getCompleteness).mockResolvedValueOnce({
      phase4Ready: true,
      missingForPhase4: [],
      profileCompletion: 100,
    });

    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <Phase4ProfileGuard>
          <div>Protected Phase 4 Content</div>
        </Phase4ProfileGuard>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Protected Phase 4 Content")).toBeDefined();
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(creatorProfileApi.getPhase4Readiness).not.toHaveBeenCalled();
  });
});

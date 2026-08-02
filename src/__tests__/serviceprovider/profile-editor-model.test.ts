import { describe, expect, it } from "vitest";
import {
  CREDENTIAL_FILE,
  EDITOR_LIMITS,
  draftModelFromResponse,
  draftRequestFromModel,
  hasDuplicate,
  newEducation,
  newExperience,
  newLanguage,
  validateAll,
  validateStep1,
  validateStep2,
  validateStep3,
  type EditorDraftModel,
} from "@/lib/service-provider/profile-editor";
import type { ProfileDraftResponse } from "@/types/service-provider";

const draftResponse = (overrides: Partial<ProfileDraftResponse> = {}): ProfileDraftResponse => ({
  hasDraft: true,
  basedOnVersion: 3,
  lastStep: 2,
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
  ...overrides,
});

const model = (overrides: Partial<EditorDraftModel> = {}): EditorDraftModel => ({
  ...draftModelFromResponse(draftResponse(), 1),
  ...overrides,
});

describe("profile editor draft model", () => {
  it("hydrates the editable model from the server response", () => {
    const hydrated = draftModelFromResponse(draftResponse(), 2);
    expect(hydrated.basedOnVersion).toBe(3);
    expect(hydrated.headline).toBe("Senior UI/UX Designer");
    expect(hydrated.primaryCategory).toBe("Design");
    expect(hydrated.skills).toEqual(["UI Design"]);
    expect(hydrated.industries).toEqual(["SaaS"]);
  });

  it("preserves industries and pricing models through a round trip", () => {
    const request = draftRequestFromModel(model());
    expect(request.industries).toEqual(["SaaS"]);
    expect(request.pricingModels).toEqual(["Hourly"]);
    expect(request.serviceCategories).toEqual(["Design"]);
  });

  it("sends locally-created records without an id so the server mints a stable one", () => {
    const request = draftRequestFromModel(
      model({
        experiences: [{ ...newExperience(), jobTitle: "Dev", companyName: "Acme", startDate: "2024-01" }],
        education: [{ ...newEducation(), institution: "Uni", degree: "BSc" }],
        languages: [{ ...newLanguage(), language: "English" }],
      })
    );
    expect(request.experiences[0].id).toBeNull();
    expect(request.education[0].id).toBeNull();
    expect(request.languageProficiencies[0].id).toBeNull();
  });

  it("keeps a server id when one already exists", () => {
    const request = draftRequestFromModel(
      model({
        experiences: [
          { id: "server-id-1", jobTitle: "Dev", companyName: "Acme", startDate: "2024-01", isCurrent: true, endDate: "" },
        ],
      })
    );
    expect(request.experiences[0].id).toBe("server-id-1");
  });

  it("never sends server-controlled fields", () => {
    const request = draftRequestFromModel(model()) as Record<string, unknown>;
    expect(request).not.toHaveProperty("providerTier");
    expect(request).not.toHaveProperty("verificationStatus");
    expect(request).not.toHaveProperty("trustScore");
    expect(request).not.toHaveProperty("credentials");
  });
});

describe("step 1 validation", () => {
  it("requires a headline and a primary category", () => {
    const errors = validateStep1(model({ headline: "  ", primaryCategory: null }));
    expect(errors.map((error) => error.field)).toEqual(
      expect.arrayContaining(["headline", "category"])
    );
  });

  it("enforces the 70-character headline limit", () => {
    const errors = validateStep1(model({ headline: "x".repeat(EDITOR_LIMITS.headline + 1) }));
    expect(EDITOR_LIMITS.headline).toBe(70);
    expect(errors.some((error) => error.field === "headline")).toBe(true);
  });

  it("passes a complete step 1", () => {
    expect(validateStep1(model())).toEqual([]);
  });
});

describe("step 2 validation", () => {
  const experience = (overrides = {}) => ({
    ...newExperience(),
    jobTitle: "Designer",
    companyName: "Acme",
    startDate: "2022-01",
    endDate: "2023-01",
    isCurrent: false,
    ...overrides,
  });

  it("rejects an end date before the start date", () => {
    const errors = validateStep2(
      model({ experiences: [experience({ startDate: "2024-01", endDate: "2023-01" })] })
    );
    expect(errors.some((error) => error.message.includes("End date cannot be before"))).toBe(true);
  });

  it("rejects an end date on a current role", () => {
    const errors = validateStep2(
      model({ experiences: [experience({ isCurrent: true, endDate: "2025-01" })] })
    );
    expect(errors.some((error) => error.message.includes("current role cannot have an end date"))).toBe(true);
  });

  it("accepts a current role with no end date", () => {
    expect(validateStep2(model({ experiences: [experience({ isCurrent: true, endDate: "" })] }))).toEqual([]);
  });

  it("requires job title and company on an entered record", () => {
    const errors = validateStep2(model({ experiences: [experience({ jobTitle: "", companyName: "" })] }));
    expect(errors).toHaveLength(2);
  });

  it("treats empty experience and education as valid — skipping is allowed", () => {
    expect(validateStep2(model({ experiences: [], education: [] }))).toEqual([]);
  });

  it("rejects an education end year before the start year", () => {
    const errors = validateStep2(
      model({ education: [{ ...newEducation(), institution: "Uni", degree: "BSc", startYear: 2020, endYear: 2018 }] })
    );
    expect(errors.some((error) => error.message.includes("End year cannot be before"))).toBe(true);
  });
});

describe("step 3 validation", () => {
  it("requires at least one skill", () => {
    expect(validateStep3(model({ skills: [] })).some((error) => error.field === "skills")).toBe(true);
  });

  it("enforces the 15-skill maximum without truncating", () => {
    const skills = Array.from({ length: 16 }, (_, index) => `Skill ${index}`);
    const errors = validateStep3(model({ skills }));
    expect(EDITOR_LIMITS.skills).toBe(15);
    expect(errors.some((error) => error.message.includes("at most 15 skills"))).toBe(true);
  });

  it("enforces the 50-character skill limit", () => {
    const errors = validateStep3(model({ skills: ["x".repeat(51)] }));
    expect(errors.some((error) => error.message.includes("50 characters"))).toBe(true);
  });

  it("rejects duplicate languages case-insensitively", () => {
    const errors = validateStep3(
      model({
        languages: [
          { ...newLanguage(), language: "English" },
          { ...newLanguage(), language: "english" },
        ],
      })
    );
    expect(errors.some((error) => error.message.includes("Duplicate languages"))).toBe(true);
  });

  it("detects duplicates case-insensitively for skills too", () => {
    expect(hasDuplicate(["UI Design"], "ui design")).toBe(true);
    expect(hasDuplicate(["UI Design"], "UX Research")).toBe(false);
  });
});

describe("cross-step validation and credential policy", () => {
  it("collects blocking errors from every step for the final submit", () => {
    const errors = validateAll(model({ headline: "", skills: [] }));
    expect(errors.some((error) => error.step === 1)).toBe(true);
    expect(errors.some((error) => error.step === 3)).toBe(true);
  });

  it("matches the backend credential file policy exactly", () => {
    expect(CREDENTIAL_FILE.maxBytes).toBe(10 * 1024 * 1024);
    expect(CREDENTIAL_FILE.extensions).toEqual([".pdf", ".png", ".jpg", ".jpeg"]);
  });

  it("mirrors the backend record limits", () => {
    expect(EDITOR_LIMITS.experiences).toBe(20);
    expect(EDITOR_LIMITS.educationRecords).toBe(10);
    expect(EDITOR_LIMITS.credentials).toBe(20);
    expect(EDITOR_LIMITS.overviewPlainText).toBe(5000);
  });
});

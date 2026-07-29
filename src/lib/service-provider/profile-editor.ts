import { EMPTY_PROFESSIONAL_OVERVIEW, professionalOverviewPlainText } from "./professional-overview";
import type {
  LanguageProficiency,
  ProfileDraftRequest,
  ProfileDraftResponse,
  ProviderEducation,
  ProviderExperience,
  ProviderLanguage,
  ServiceProviderProfile,
  TiptapJson,
} from "@/types/service-provider";
import type { ProfileEditorStep } from "./profile-navigation";

// Editor limits mirrored from the committed backend validators
// (ServiceProviderLimits). Kept in one place so the frontend can never disagree
// with server-side validation.
export const EDITOR_LIMITS = {
  headline: 70,
  bio: 3000,
  overviewPlainText: 5000,
  skills: 15,
  skillLength: 50,
  industries: 20,
  industryLength: 100,
  languages: 20,
  languageLength: 50,
  experiences: 20,
  educationRecords: 10,
  credentials: 20,
  jobTitle: 150,
  companyName: 150,
  experienceDescription: 1000,
  institution: 150,
  degree: 150,
  fieldOfStudy: 150,
  credentialTitle: 150,
  issuer: 150,
  credentialNumber: 100,
  minEducationYear: 1900,
} as const;

/** Credential document policy — matches the backend folder policy exactly. */
export const CREDENTIAL_FILE = {
  maxBytes: 10 * 1024 * 1024,
  accept: ".pdf,.png,.jpg,.jpeg",
  acceptLabel: "PDF, PNG or JPG up to 10 MB",
  extensions: [".pdf", ".png", ".jpg", ".jpeg"],
} as const;

/** Local, editable shape of the four-step draft. Ids stay stable across edits. */
export interface EditorDraftModel {
  basedOnVersion: number;
  lastStep: ProfileEditorStep;
  headline: string;
  bio: string;
  professionalOverview: TiptapJson;
  primaryCategory: string | null;
  skills: string[];
  industries: string[];
  pricingModels: string[];
  experiences: ProviderExperience[];
  education: ProviderEducation[];
  languages: ProviderLanguage[];
}

const maxEducationYear = () => new Date().getFullYear() + 10;

/** Client-side id for a not-yet-persisted child record. */
export const localId = () => `local-${Math.random().toString(36).slice(2, 10)}`;

/**
 * Builds the editable model from the server's editor response. A stored draft
 * wins; otherwise the response is already seeded from the published profile.
 * Categories/pricing come from the SP record via the same response.
 */
export function draftModelFromResponse(
  draft: ProfileDraftResponse,
  step: ProfileEditorStep
): EditorDraftModel {
  return {
    basedOnVersion: draft.basedOnVersion,
    lastStep: step,
    headline: draft.headline ?? "",
    bio: draft.bio ?? "",
    professionalOverview: draft.professionalOverview?.document ?? EMPTY_PROFESSIONAL_OVERVIEW,
    primaryCategory: draft.serviceCategories[0] ?? null,
    skills: [...draft.skills],
    industries: [...draft.industries],
    pricingModels: [...draft.pricingModels],
    experiences: draft.experiences.map((item) => ({ ...item })),
    education: draft.education.map((item) => ({ ...item })),
    languages: draft.languageProficiencies.map((item) => ({ ...item })),
  };
}

/** Serializes the model for a draft save or the final submit. */
export function draftRequestFromModel(model: EditorDraftModel): ProfileDraftRequest {
  return {
    basedOnVersion: model.basedOnVersion,
    lastStep: model.lastStep,
    headline: model.headline.trim() || null,
    bio: model.bio.trim() || null,
    professionalOverview: {
      schemaVersion: 1,
      document: model.professionalOverview,
    },
    skills: model.skills,
    // The editor collects a single primary category; the contract is a list.
    serviceCategories: model.primaryCategory ? [model.primaryCategory] : [],
    industries: model.industries,
    pricingModels: model.pricingModels,
    // A locally-minted id is sent as null so the server assigns a stable one.
    experiences: model.experiences.map(({ id, ...rest }) => ({
      ...rest,
      id: id.startsWith("local-") ? null : id,
    })),
    education: model.education.map(({ id, ...rest }) => ({
      ...rest,
      id: id.startsWith("local-") ? null : id,
    })),
    languageProficiencies: model.languages.map(({ id, ...rest }) => ({
      ...rest,
      id: id.startsWith("local-") ? null : id,
    })),
  };
}

export interface FieldError {
  /** DOM id of the offending control, for the validation summary + focus. */
  field: string;
  message: string;
  step: ProfileEditorStep;
}

const NORMALIZE = (value: string) => value.trim().toLowerCase();

/** Case-insensitive duplicate check used by skills and languages. */
export function hasDuplicate(values: string[], candidate: string) {
  const normalized = NORMALIZE(candidate);
  return values.some((value) => NORMALIZE(value) === normalized);
}

function monthValue(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : null;
}

/** Step 1 — required before the provider can continue or submit. */
export function validateStep1(model: EditorDraftModel): FieldError[] {
  const errors: FieldError[] = [];
  const headline = model.headline.trim();

  if (!headline) {
    errors.push({ field: "headline", message: "Professional headline is required.", step: 1 });
  } else if (headline.length > EDITOR_LIMITS.headline) {
    errors.push({
      field: "headline",
      message: `Professional headline must be ${EDITOR_LIMITS.headline} characters or fewer.`,
      step: 1,
    });
  }

  if (model.bio.trim().length > EDITOR_LIMITS.bio) {
    errors.push({
      field: "bio",
      message: `Short bio must be ${EDITOR_LIMITS.bio} characters or fewer.`,
      step: 1,
    });
  }

  if (!model.primaryCategory) {
    errors.push({ field: "category", message: "Select your primary expertise category.", step: 1 });
  }

  if (professionalOverviewPlainText(model.professionalOverview).length > EDITOR_LIMITS.overviewPlainText) {
    errors.push({
      field: "overview",
      message: `Professional Overview must be ${EDITOR_LIMITS.overviewPlainText.toLocaleString()} characters or fewer.`,
      step: 1,
    });
  }

  return errors;
}

/** Step 2 — optional records, but every entered record must be valid. */
export function validateStep2(model: EditorDraftModel): FieldError[] {
  const errors: FieldError[] = [];

  if (model.experiences.length > EDITOR_LIMITS.experiences) {
    errors.push({
      field: "experience",
      message: `You can list at most ${EDITOR_LIMITS.experiences} experience records.`,
      step: 2,
    });
  }

  model.experiences.forEach((item) => {
    const prefix = `experience-${item.id}`;
    if (!item.jobTitle.trim()) {
      errors.push({ field: `${prefix}-jobTitle`, message: "Job title is required.", step: 2 });
    }
    if (!item.companyName.trim()) {
      errors.push({ field: `${prefix}-companyName`, message: "Company name is required.", step: 2 });
    }

    const start = monthValue(item.startDate);
    if (!start) {
      errors.push({
        field: `${prefix}-startDate`,
        message: "Start date must be a valid month in YYYY-MM format.",
        step: 2,
      });
    }

    if (item.isCurrent) {
      if (item.endDate) {
        errors.push({
          field: `${prefix}-endDate`,
          message: "A current role cannot have an end date.",
          step: 2,
        });
      }
    } else {
      const end = monthValue(item.endDate ?? "");
      if (!end) {
        errors.push({
          field: `${prefix}-endDate`,
          message: "End date is required unless this is your current role.",
          step: 2,
        });
      } else if (start && end < start) {
        errors.push({
          field: `${prefix}-endDate`,
          message: "End date cannot be before the start date.",
          step: 2,
        });
      }
    }
  });

  if (model.education.length > EDITOR_LIMITS.educationRecords) {
    errors.push({
      field: "education",
      message: `You can list at most ${EDITOR_LIMITS.educationRecords} education records.`,
      step: 2,
    });
  }

  model.education.forEach((item) => {
    const prefix = `education-${item.id}`;
    if (!item.institution.trim()) {
      errors.push({
        field: `${prefix}-institution`,
        message: "School or university is required.",
        step: 2,
      });
    }
    if (!item.degree.trim()) {
      errors.push({ field: `${prefix}-degree`, message: "Degree is required.", step: 2 });
    }

    const maxYear = maxEducationYear();
    if (item.startYear < EDITOR_LIMITS.minEducationYear || item.startYear > maxYear) {
      errors.push({
        field: `${prefix}-startYear`,
        message: `Start year must be between ${EDITOR_LIMITS.minEducationYear} and ${maxYear}.`,
        step: 2,
      });
    }

    if (item.endYear != null) {
      if (item.endYear < EDITOR_LIMITS.minEducationYear || item.endYear > maxYear) {
        errors.push({
          field: `${prefix}-endYear`,
          message: `End year must be between ${EDITOR_LIMITS.minEducationYear} and ${maxYear}.`,
          step: 2,
        });
      } else if (item.endYear < item.startYear) {
        errors.push({
          field: `${prefix}-endYear`,
          message: "End year cannot be before the start year.",
          step: 2,
        });
      }
    }
  });

  return errors;
}

/** Step 3 — at least one skill is required by the final submit. */
export function validateStep3(model: EditorDraftModel): FieldError[] {
  const errors: FieldError[] = [];

  if (model.skills.length === 0) {
    errors.push({ field: "skills", message: "Add at least one skill.", step: 3 });
  }
  if (model.skills.length > EDITOR_LIMITS.skills) {
    errors.push({
      field: "skills",
      message: `You can list at most ${EDITOR_LIMITS.skills} skills.`,
      step: 3,
    });
  }
  if (model.skills.some((skill) => skill.length > EDITOR_LIMITS.skillLength)) {
    errors.push({
      field: "skills",
      message: `Each skill must be ${EDITOR_LIMITS.skillLength} characters or fewer.`,
      step: 3,
    });
  }

  if (model.languages.length > EDITOR_LIMITS.languages) {
    errors.push({
      field: "languages",
      message: `You can list at most ${EDITOR_LIMITS.languages} languages.`,
      step: 3,
    });
  }

  const seen = new Set<string>();
  model.languages.forEach((entry) => {
    const key = NORMALIZE(entry.language);
    if (!entry.language.trim()) {
      errors.push({
        field: `language-${entry.id}`,
        message: "Language is required.",
        step: 3,
      });
      return;
    }
    if (seen.has(key)) {
      errors.push({
        field: `language-${entry.id}`,
        message: "Duplicate languages are not allowed.",
        step: 3,
      });
    }
    seen.add(key);
  });

  if (model.industries.some((industry) => industry.length > EDITOR_LIMITS.industryLength)) {
    errors.push({
      field: "industries",
      message: `Each industry must be ${EDITOR_LIMITS.industryLength} characters or fewer.`,
      step: 3,
    });
  }

  return errors;
}

export function validateStep(step: ProfileEditorStep, model: EditorDraftModel): FieldError[] {
  if (step === 1) return validateStep1(model);
  if (step === 2) return validateStep2(model);
  if (step === 3) return validateStep3(model);
  return []; // Step 4 credentials persist independently and validate per record.
}

/** Every blocking error across the wizard, used to gate the final submit. */
export function validateAll(model: EditorDraftModel): FieldError[] {
  return [...validateStep1(model), ...validateStep2(model), ...validateStep3(model)];
}

export function newExperience(): ProviderExperience {
  return {
    id: localId(),
    jobTitle: "",
    companyName: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  };
}

export function newEducation(): ProviderEducation {
  return {
    id: localId(),
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startYear: new Date().getFullYear(),
    endYear: null,
    description: "",
  };
}

export function newLanguage(proficiency: LanguageProficiency = "Conversational"): ProviderLanguage {
  return { id: localId(), language: "", proficiency };
}

/**
 * Read-only projection of the published profile for the Profile View. Kept here
 * so both surfaces derive "is this section empty" the same way.
 */
export function hasPublishedSection(profile: ServiceProviderProfile) {
  return {
    about: !!profile.bio?.trim() || professionalOverviewPlainText(
      profile.professionalOverview?.document ?? EMPTY_PROFESSIONAL_OVERVIEW
    ).length > 0,
    experience: profile.experiences.length > 0,
    education: profile.education.length > 0,
    skills: profile.skills.length > 0,
    languages: profile.languageProficiencies.length > 0 || profile.languages.length > 0,
    industries: profile.industries.length > 0,
    credentials: profile.credentials.length > 0,
    portfolio: profile.portfolioItems.length > 0,
  };
}

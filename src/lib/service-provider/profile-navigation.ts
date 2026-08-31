import { SERVICE_PROVIDER_ROOT } from "@/lib/service-provider-navigation";

// Canonical source of truth for Universal Profile routing. Profile View and
// the four-step editor are separate routes; every link, redirect and focus
// target is built here so no component hardcodes a path.

export const PROFILE_VIEW_ROUTE = "/dashboard/profile";
export const PROFILE_EDITOR_ROUTE = "/dashboard/profile/edit";
export const LEGACY_SP_PROFILE_VIEW_ROUTE = `${SERVICE_PROVIDER_ROOT}/profile`;
export const LEGACY_SP_PROFILE_EDITOR_ROUTE = `${SERVICE_PROVIDER_ROOT}/profile/edit`;
export const PORTFOLIO_MANAGER_ROUTE = `${PROFILE_VIEW_ROUTE}?section=portfolio`;
export const SERVICE_CATALOG_ROUTE = `${SERVICE_PROVIDER_ROOT}/services`;

export const PROFILE_EDITOR_STEPS = [
  { step: 1, label: "Identity & Overview", heading: "Identity & Overview" },
  { step: 2, label: "Experience & Education", heading: "Experience & Education" },
  { step: 3, label: "Skills & Languages", heading: "Skills & Languages" },
  { step: 4, label: "Credentials", heading: "Credentials" },
] as const;

export type ProfileEditorStep = 1 | 2 | 3 | 4;

export const FIRST_STEP: ProfileEditorStep = 1;
export const LAST_STEP: ProfileEditorStep = 4;

/**
 * Focus targets a section-level Edit action can request. The step owning each
 * target is fixed here so callers never pair a focus id with the wrong step.
 */
export type ProfileEditorFocus =
  | "media"
  | "headline"
  | "overview"
  | "experience"
  | "education"
  | "skills"
  | "languages"
  | "credentials";

const FOCUS_STEP: Record<ProfileEditorFocus, ProfileEditorStep> = {
  media: 1,
  headline: 1,
  overview: 1,
  experience: 2,
  education: 2,
  skills: 3,
  languages: 3,
  credentials: 4,
};

/** DOM id of the element a focus target scrolls to and focuses. */
export const focusElementId = (focus: ProfileEditorFocus) => `sp-editor-focus-${focus}`;

/** Normalizes any untrusted step value (query string, storage) to a valid step. */
export function normalizeStep(value: string | number | null | undefined): ProfileEditorStep {
  const parsed = typeof value === "number" ? value : Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return FIRST_STEP;
  if (parsed < FIRST_STEP) return FIRST_STEP;
  if (parsed > LAST_STEP) return LAST_STEP;
  return parsed as ProfileEditorStep;
}

export function isValidFocus(value: string | null | undefined): value is ProfileEditorFocus {
  return !!value && value in FOCUS_STEP;
}

/** Builds an editor URL. A focus target selects its own owning step. */
export function editorHref(options?: {
  step?: ProfileEditorStep | number;
  focus?: ProfileEditorFocus;
  result?: boolean;
}) {
  const params = new URLSearchParams();

  if (options?.result) {
    params.set("state", "result");
    return `${PROFILE_EDITOR_ROUTE}?${params.toString()}`;
  }

  const step = options?.focus
    ? FOCUS_STEP[options.focus]
    : normalizeStep(options?.step ?? FIRST_STEP);

  params.set("step", String(step));
  if (options?.focus) params.set("focus", options.focus);
  return `${PROFILE_EDITOR_ROUTE}?${params.toString()}`;
}

/** Where each Profile View section's Edit action goes. */
export const SECTION_EDIT_HREF = {
  profile: () => editorHref({ step: 1 }),
  media: () => editorHref({ focus: "media" }),
  about: () => editorHref({ focus: "overview" }),
  experience: () => editorHref({ focus: "experience" }),
  education: () => editorHref({ focus: "education" }),
  skills: () => editorHref({ focus: "skills" }),
  languages: () => editorHref({ focus: "languages" }),
  credentials: () => editorHref({ focus: "credentials" }),
  portfolio: () => PORTFOLIO_MANAGER_ROUTE,
  services: () => SERVICE_CATALOG_ROUTE,
} as const;

/**
 * Backward compatibility for links minted before the split. The old page put the
 * whole editor behind `?view=edit`; those links now land on the wizard instead
 * of an inline form. `?view=trust` stays on the read-only page.
 */
export function legacyProfileRedirect(view: string | null | undefined): string | null {
  return view === "edit" ? editorHref({ step: FIRST_STEP }) : null;
}

import { FRENCH_REGIONS } from '@/types/creator/profile';

export interface HumainXQuickStartSkill {
  name: string;
  level: 'Beginner' | 'Comfortable' | 'Advanced';
}

export interface HumainXQuickStartData {
  region: string;
  currentSituation: string;
  weeklyAvailability: string;
  skills: HumainXQuickStartSkill[];
  previousEntrepreneurialExperience: string;
  progressPreference: string;
}

export interface HumainXQuickStartState {
  isLoading: boolean;
  isComplete: boolean;
  currentStep: number;
  missingFields: string[];
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  profile: any | null;
}

// ==========================================
// CANONICAL CONSTANTS & OPTIONS
// ==========================================

export const SUGGESTED_SKILLS = [
  'Sales',
  'Marketing',
  'Social media',
  'Graphic design',
  'Coding',
  'Web design',
  'Writing',
  'Video editing',
  'Photography',
  'Customer service',
  'Accounting',
  'Project management',
  'Public speaking',
  'Research',
  'Teaching',
  'Cooking',
  'Event planning',
  'Languages',
] as const;

export const SKILL_LEVELS = ['Beginner', 'Comfortable', 'Advanced'] as const;

export const CURRENT_SITUATION_UI_OPTIONS = [
  { id: 'employed', label: 'Employed', canonical: 'Employed' },
  { id: 'self-employed', label: 'Self-employed or freelance', canonical: 'Self-employed / Freelance' },
  { id: 'looking', label: 'Looking for work', canonical: 'Looking for work' },
  { id: 'student', label: 'Student', canonical: 'Student' },
  { id: 'training', label: 'In training', canonical: 'In training' },
  { id: 'existing-business', label: 'Already running a business', canonical: 'Already running a business' },
  { id: 'other', label: 'Something else', canonical: 'Other' },
] as const;

export const WEEKLY_AVAILABILITY_UI_OPTIONS = [
  { id: 'under-5', label: 'Under 5 hrs', canonical: 'Less than 5 hours/week' },
  { id: '5-10', label: '5–10 hrs', canonical: '5–10 hours/week' },
  { id: '10-20', label: '10–20 hrs', canonical: '10–20 hours/week' },
  { id: '20-30', label: '20–30 hrs', canonical: '20–30 hours/week' },
  { id: '30-plus', label: '30+ hrs', canonical: '30+ hours/week' },
  { id: 'full-time', label: 'Full-time', canonical: 'Full-time' },
  { id: 'not-sure', label: 'Not sure yet', canonical: 'Not sure yet' },
] as const;

export const PREVIOUS_EXPERIENCE_UI_OPTIONS = [
  {
    id: 'first-time',
    title: 'This is my first time',
    description: "Starting from scratch, and that's fine.",
    canonical: 'No, this is my first project',
  },
  {
    id: 'explored-idea',
    title: "I've explored an idea",
    description: "I've thought one through but never launched it.",
    canonical: 'I have explored a business idea before',
  },
  {
    id: 'business-project',
    title: "I've worked on a business project",
    description: 'I helped build or run something.',
    canonical: 'I have worked on a business project',
  },
  {
    id: 'freelanced',
    title: "I've freelanced",
    description: 'I\'ve sold my own skills or services.',
    canonical: 'I have freelanced / worked independently',
  },
  {
    id: 'company-before',
    title: "I've created a company before",
    description: "I've registered and run one.",
    canonical: 'I have previously created a company',
  },
  {
    id: 'run-now',
    title: 'I run something right now',
    description: 'I already have an activity going.',
    canonical: 'I currently run another activity',
  },
] as const;

export const PROGRESS_PREFERENCE_UI_OPTIONS = [
  {
    id: 'learn',
    title: "I'd rather learn it",
    description: "Teach me and I'll pick it up.",
    learningPreference: 'I want to learn them myself',
    delegationPreference: 'Minimal delegation — self-reliant learning',
  },
  {
    id: 'delegate',
    title: "I'd rather hand it off",
    description: 'Let a specialist handle it.',
    learningPreference: 'Focus on core strengths only',
    delegationPreference: 'I prefer to delegate when possible',
  },
  {
    id: 'mixed',
    title: 'A bit of both',
    description: 'Learn what matters, delegate the rest.',
    learningPreference: 'A mix of learning and delegation',
    delegationPreference: 'A mix of learning and delegation',
  },
  {
    id: 'help-me-decide',
    title: 'Help me decide',
    description: 'Recommend what fits each situation.',
    learningPreference: "I'm not sure — recommend the best option",
    delegationPreference: "I'm not sure — recommend the best option",
  },
] as const;

export { FRENCH_REGIONS };

// ==========================================
// VALUE RESOLVERS & MAPPERS
// ==========================================

export function mapSituationToCanonical(val: string): string {
  if (!val) return '';
  const match = CURRENT_SITUATION_UI_OPTIONS.find(
    (o) => o.label.toLowerCase() === val.toLowerCase() || o.canonical.toLowerCase() === val.toLowerCase()
  );
  return match ? match.canonical : val;
}

export function mapSituationFromCanonical(val: string): string {
  if (!val) return '';
  const match = CURRENT_SITUATION_UI_OPTIONS.find(
    (o) => o.canonical.toLowerCase() === val.toLowerCase() || o.label.toLowerCase() === val.toLowerCase()
  );
  return match ? match.label : val;
}

export function mapAvailabilityToCanonical(val: string): string {
  if (!val) return '';
  const match = WEEKLY_AVAILABILITY_UI_OPTIONS.find(
    (o) => o.label.toLowerCase() === val.toLowerCase() || o.canonical.toLowerCase() === val.toLowerCase()
  );
  return match ? match.canonical : val;
}

export function mapAvailabilityFromCanonical(val: string): string {
  if (!val) return '';
  const clean = val.toLowerCase();
  if (clean.includes('<5') || clean.includes('less than 5') || clean.includes('under 5')) return 'Under 5 hrs';
  if (clean.includes('5–10') || clean.includes('5-10')) return '5–10 hrs';
  if (clean.includes('10–20') || clean.includes('10-20')) return '10–20 hrs';
  if (clean.includes('20–30') || clean.includes('20-30')) return '20–30 hrs';
  if (clean.includes('30+') || clean.includes('30 +')) return '30+ hrs';
  if (clean.includes('full-time') || clean.includes('full time')) return 'Full-time';
  if (clean.includes('not sure')) return 'Not sure yet';
  return val;
}

export function mapExperienceToCanonical(val: string): string {
  if (!val) return '';
  const match = PREVIOUS_EXPERIENCE_UI_OPTIONS.find(
    (o) => o.title.toLowerCase() === val.toLowerCase() || o.canonical.toLowerCase() === val.toLowerCase()
  );
  return match ? match.canonical : val;
}

export function mapExperienceFromCanonical(val: string): string {
  if (!val) return '';
  const match = PREVIOUS_EXPERIENCE_UI_OPTIONS.find(
    (o) => o.canonical.toLowerCase() === val.toLowerCase() || o.title.toLowerCase() === val.toLowerCase()
  );
  return match ? match.title : val;
}

export function mapProgressPreferenceToCanonical(val: string): { learningPreference: string; delegationPreference: string } {
  const match = PROGRESS_PREFERENCE_UI_OPTIONS.find(
    (o) =>
      o.title.toLowerCase() === val.toLowerCase() ||
      o.id.toLowerCase() === val.toLowerCase() ||
      o.learningPreference.toLowerCase() === val.toLowerCase() ||
      o.delegationPreference.toLowerCase() === val.toLowerCase()
  );
  if (match) {
    return {
      learningPreference: match.learningPreference,
      delegationPreference: match.delegationPreference,
    };
  }
  return {
    learningPreference: val || "I'm not sure — recommend the best option",
    delegationPreference: val || "I'm not sure — recommend the best option",
  };
}

export function deriveProgressPreference(learningPref?: string | null, delegationPref?: string | null): string {
  const lp = (learningPref || '').toLowerCase();
  const dp = (delegationPref || '').toLowerCase();

  if (lp.includes('myself') || dp.includes('minimal delegation') || lp.includes('learn it')) {
    return "I'd rather learn it";
  }
  if (lp.includes('strengths') || dp.includes('prefer to delegate') || lp.includes('hand it off')) {
    return "I'd rather hand it off";
  }
  if (lp.includes('mix') || dp.includes('mix') || lp.includes('bit of both')) {
    return 'A bit of both';
  }
  if (lp.includes('not sure') || dp.includes('not sure') || lp.includes('recommend') || lp.includes('help me decide')) {
    return 'Help me decide';
  }

  if (learningPref?.trim()) {
    return learningPref.trim();
  }
  if (delegationPref?.trim()) {
    return delegationPref.trim();
  }
  return '';
}

// ==========================================
// VALIDATION & COMPLETION LOGIC
// ==========================================

export function getProfileVentureContext(profile: any) {
  return profile?.ventureContext || profile?.VentureContext || {};
}

export function getProfileSkills(profile: any): any[] {
  const raw = profile?.skills || profile?.Skills;
  return Array.isArray(raw) ? raw : [];
}

export function isValidSkillLevel(level: unknown): boolean {
  if (typeof level !== 'string') return false;
  const normalized = level.trim().toLowerCase();
  return normalized === 'beginner' || normalized === 'comfortable' || normalized === 'advanced';
}

export function isStep1Complete(profile: any): boolean {
  if (!profile) return false;
  const vc = getProfileVentureContext(profile);
  const region = (vc.region || vc.Region || '').trim();
  const situation = (vc.currentSituation || vc.CurrentSituation || '').trim();
  const availability = (vc.weeklyAvailability || vc.WeeklyAvailability || '').trim();

  return Boolean(region && situation && availability);
}

export function isStep2Complete(profile: any): boolean {
  if (!profile) return false;
  const skills = getProfileSkills(profile);
  if (!skills || skills.length === 0) return false;

  // Filter out any completely empty skill records
  const validSkills = skills.filter((s) => (s?.name || s?.Name || '').trim().length > 0);
  if (validSkills.length === 0) return false;

  // EVERY selected skill must have a valid level
  return validSkills.every((s) => isValidSkillLevel(s?.level || s?.Level));
}

export function isStep3Complete(profile: any): boolean {
  if (!profile) return false;
  const vc = getProfileVentureContext(profile);
  const experience = (vc.previousEntrepreneurialExperience || vc.PreviousEntrepreneurialExperience || '').trim();
  const learningPref = (vc.learningPreference || vc.LearningPreference || '').trim();
  const delegationPref = (vc.delegationPreference || vc.DelegationPreference || '').trim();

  const hasExperience = Boolean(experience);
  const hasProgressPreference = Boolean(deriveProgressPreference(learningPref, delegationPref));

  return hasExperience && hasProgressPreference;
}

export function isQuickStartComplete(profile: any): boolean {
  return isStep1Complete(profile) && isStep2Complete(profile) && isStep3Complete(profile);
}

export function getFirstIncompleteStep(profile: any): 1 | 2 | 3 | null {
  if (!isStep1Complete(profile)) return 1;
  if (!isStep2Complete(profile)) return 2;
  if (!isStep3Complete(profile)) return 3;
  return null;
}

// ==========================================
// FRONTEND JOURNEY STATE & COMPLETION (v1)
// ==========================================

export interface HumainXJourneyState {
  step1Confirmed: boolean;
  step2Confirmed: boolean;
  step3Confirmed: boolean;
  completed: boolean;
}

export function getQuickStartStorageKey(userId: string): string {
  return `creatorHumainxQuickStart:v1:${userId}`;
}

export function getQuickStartJourneyState(userId?: string | null): HumainXJourneyState {
  const defaultState: HumainXJourneyState = {
    step1Confirmed: false,
    step2Confirmed: false,
    step3Confirmed: false,
    completed: false,
  };

  if (!userId || typeof window === 'undefined') return defaultState;

  try {
    const raw = localStorage.getItem(getQuickStartStorageKey(userId));
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw);
    return {
      step1Confirmed: Boolean(parsed?.step1Confirmed),
      step2Confirmed: Boolean(parsed?.step2Confirmed),
      step3Confirmed: Boolean(parsed?.step3Confirmed),
      completed: Boolean(parsed?.completed),
    };
  } catch {
    return defaultState;
  }
}

export function saveQuickStartJourneyState(
  userId: string,
  state: Partial<HumainXJourneyState>
): HumainXJourneyState {
  const defaultState: HumainXJourneyState = {
    step1Confirmed: false,
    step2Confirmed: false,
    step3Confirmed: false,
    completed: false,
  };

  if (!userId || typeof window === 'undefined') return defaultState;

  try {
    const current = getQuickStartJourneyState(userId);
    const updated: HumainXJourneyState = {
      ...current,
      ...state,
    };
    localStorage.setItem(getQuickStartStorageKey(userId), JSON.stringify(updated));
    return updated;
  } catch {
    return defaultState;
  }
}

export function resetQuickStartJourneyState(userId: string): void {
  if (!userId || typeof window === 'undefined') return;
  try {
    localStorage.removeItem(getQuickStartStorageKey(userId));
  } catch {
    // ignore storage exceptions
  }
}

export function isQuickStartJourneyComplete(userId?: string | null): boolean {
  if (!userId) return false;
  const state = getQuickStartJourneyState(userId);
  return state.completed && state.step1Confirmed && state.step2Confirmed && state.step3Confirmed;
}

export function getNextQuickStartJourneyStep(journeyState: HumainXJourneyState): 1 | 2 | 3 | null {
  if (!journeyState.step1Confirmed) return 1;
  if (!journeyState.step2Confirmed) return 2;
  if (!journeyState.completed) return 3;
  return null;
}

export function resolveTargetQuickStartStep(profile: any, journeyState: HumainXJourneyState): 1 | 2 | 3 {
  // If step 1 is not confirmed in journey OR profile data for step 1 is incomplete, must do step 1
  if (!journeyState.step1Confirmed || !isStep1Complete(profile)) return 1;

  // If step 2 is not confirmed in journey OR profile data for step 2 is incomplete, must do step 2
  if (!journeyState.step2Confirmed || !isStep2Complete(profile)) return 2;

  // If journey not finalized with "Start my project" OR profile data for step 3 is incomplete, must do step 3
  if (!journeyState.completed || !isStep3Complete(profile)) return 3;

  return 1;
}

export function getMissingFields(profile: any): string[] {
  const missing: string[] = [];
  const vc = getProfileVentureContext(profile);

  if (!(vc.region || vc.Region || '').trim()) missing.push('Region');
  if (!(vc.currentSituation || vc.CurrentSituation || '').trim()) missing.push('CurrentSituation');
  if (!(vc.weeklyAvailability || vc.WeeklyAvailability || '').trim()) missing.push('WeeklyAvailability');

  const skills = getProfileSkills(profile).filter((s) => (s?.name || s?.Name || '').trim().length > 0);
  if (skills.length === 0) {
    missing.push('Skills');
  } else if (!skills.every((s) => isValidSkillLevel(s?.level || s?.Level))) {
    missing.push('SkillLevels');
  }

  if (!(vc.previousEntrepreneurialExperience || vc.PreviousEntrepreneurialExperience || '').trim()) {
    missing.push('PreviousEntrepreneurialExperience');
  }

  const learningPref = (vc.learningPreference || vc.LearningPreference || '').trim();
  const delegationPref = (vc.delegationPreference || vc.DelegationPreference || '').trim();
  if (!deriveProgressPreference(learningPref, delegationPref)) {
    missing.push('ProgressPreference');
  }

  return missing;
}

export function buildSavePayloadFromQuickStart(
  profile: any,
  data: Partial<HumainXQuickStartData>
) {
  const existingSkills = profile?.skills || profile?.Skills || [];
  const existingByName = new Map<string, any>();
  for (const s of existingSkills) {
    const n = (s?.name || s?.Name || '').trim();
    if (n) existingByName.set(n.toLowerCase(), s);
  }

  const rawSkills = data.skills ?? (existingSkills.map((s: any) => ({
    name: s?.name || s?.Name || '',
    level: s?.level || s?.Level || 'Comfortable',
  })));

  const mergedSkills = rawSkills
    .filter((s: any) => (s?.name || '').trim().length > 0)
    .map((qs: any) => {
      const existing = existingByName.get(qs.name.trim().toLowerCase());
      return {
        name: qs.name.trim(),
        level: qs.level || existing?.level || existing?.Level || 'Comfortable',
        source: existing?.source || existing?.Source || 'SelfDeclared',
        verification: existing?.verification ?? existing?.Verification ?? null,
      };
    });

  const vc = getProfileVentureContext(profile);
  const currentRegion = data.region !== undefined ? data.region : (vc.region || vc.Region || '');
  const currentSituation = data.currentSituation !== undefined ? mapSituationToCanonical(data.currentSituation) : (vc.currentSituation || vc.CurrentSituation || '');
  const currentAvailability = data.weeklyAvailability !== undefined ? mapAvailabilityToCanonical(data.weeklyAvailability) : (vc.weeklyAvailability || vc.WeeklyAvailability || '');
  const currentExperience = data.previousEntrepreneurialExperience !== undefined ? mapExperienceToCanonical(data.previousEntrepreneurialExperience) : (vc.previousEntrepreneurialExperience || vc.PreviousEntrepreneurialExperience || '');

  let currentLearningPref = vc.learningPreference || vc.LearningPreference || null;
  let currentDelegationPref = vc.delegationPreference || vc.DelegationPreference || null;

  if (data.progressPreference !== undefined) {
    const progress = mapProgressPreferenceToCanonical(data.progressPreference);
    currentLearningPref = progress.learningPreference;
    currentDelegationPref = progress.delegationPreference;
  }

  return {
    skills: mergedSkills,
    experiences: (profile?.experiences || profile?.Experiences || []).map((e: any) => ({
      id: e.id || e.Id,
      jobTitle: e.jobTitle || e.JobTitle || e.roleOrProjectTitle || '',
      companyName: e.companyName || e.CompanyName || e.organizationOrProjectName || '',
      experienceType: e.experienceType || e.ExperienceType || 'Other',
      skillsUsed: e.skillsUsed || e.SkillsUsed || [],
      startDate: e.startDate || e.StartDate,
      endDate: e.endDate || e.EndDate,
      isCurrent: e.isCurrent ?? e.IsCurrent ?? false,
      description: e.description || e.Description,
    })),
    education: (profile?.education || profile?.Education || []).map((ed: any) => ({
      id: ed.id || ed.Id,
      institution: ed.institution || ed.Institution || '',
      fieldOfStudy: ed.fieldOfStudy || ed.FieldOfStudy || ed.subjectOrField || '',
      degree: ed.degree || ed.Degree || ed.qualification || '',
      startYear: ed.startYear || ed.StartYear || new Date().getFullYear(),
      endYear: ed.endYear || ed.EndYear || ed.completionYear,
      description: ed.description || ed.Description,
    })),
    languageProficiencies: (profile?.languageProficiencies || profile?.LanguageProficiencies || []).map((l: any) => ({
      id: l.id || l.Id,
      language: l.language || l.Language || '',
      proficiency: l.proficiency || l.Proficiency || l.level || 'Professional',
    })),
    ventureContext: {
      region: currentRegion || null,
      currentSituation: currentSituation || null,
      weeklyAvailability: currentAvailability || null,
      previousEntrepreneurialExperience: currentExperience || null,
      learningPreference: currentLearningPref,
      delegationPreference: currentDelegationPref,
    },
  };
}

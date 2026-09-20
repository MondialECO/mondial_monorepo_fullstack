export interface ProfileCompletenessResponse {
  profileCompletion: number;
  phase4Ready: boolean;
  missingForPhase4: string[];
}

export interface Phase4ReadinessResponse {
  phase3Complete: boolean;
  phase4Ready: boolean;
  ready: boolean;
  missingForPhase4: string[];
  profileCompletion: number;
}

export type ExperienceType =
  | 'Job'
  | 'Internship'
  | 'Freelance'
  | 'School Project'
  | 'Personal Project'
  | 'Volunteer'
  | 'Association'
  | 'Previous Business'
  | 'Other';

export interface HumainXExperience {
  id?: string;
  experienceType: ExperienceType | string;
  roleOrProjectTitle: string;
  organizationOrProjectName: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  description?: string;
  skillsUsed?: string[];
}

export interface HumainXEducation {
  id?: string;
  institution: string;
  subjectOrField: string;
  level?: string;
  startYear?: number;
  completionYear?: number;
  qualification?: string;
}

export type SkillLevel = 'Beginner' | 'Comfortable' | 'Advanced';

export interface HumainXSkill {
  name: string;
  level?: SkillLevel | string | null;
  source?: string | null;
  verification?: unknown;
}

export type LanguageLevel = 'Basic' | 'Conversational' | 'Professional' | 'Fluent' | 'Native';

export interface HumainXLanguage {
  id?: string;
  language: string;
  level: LanguageLevel | string;
}

export interface HumainXVentureContext {
  currentSituation?: string;
  weeklyAvailability?: string;
  region?: string;
  previousEntrepreneurialExperience?: string;
  learningPreference?: string;
  delegationPreference?: string;
}

export interface HumainXFormData {
  experiences: HumainXExperience[];
  education: HumainXEducation[];
  skills: HumainXSkill[];
  languages: HumainXLanguage[];
  ventureContext: HumainXVentureContext;
}

export const CURRENT_SITUATION_OPTIONS = [
  'Employed',
  'Self-employed / Freelance',
  'Looking for work',
  'Student',
  'In training',
  'Already running a business',
  'Other',
] as const;

export const WEEKLY_AVAILABILITY_OPTIONS = [
  'Less than 5 hours/week',
  '5–10 hours/week',
  '10–20 hours/week',
  '20–30 hours/week',
  '30+ hours/week',
  'Full-time',
  'Not sure yet',
] as const;

export const PREVIOUS_EXPERIENCE_OPTIONS = [
  'No, this is my first project',
  'I have explored a business idea before',
  'I have worked on a business project',
  'I have freelanced / worked independently',
  'I have previously created a company',
  'I currently run another activity',
] as const;

export const PROGRESS_PREFERENCE_OPTIONS = [
  {
    label: 'I want to learn them myself',
    learning: 'I want to learn them myself',
    delegation: 'Minimal delegation — self-reliant learning',
  },
  {
    label: 'I prefer to delegate when possible',
    learning: 'Focus on core strengths only',
    delegation: 'I prefer to delegate when possible',
  },
  {
    label: 'A mix of learning and delegation',
    learning: 'A mix of learning and delegation',
    delegation: 'A mix of learning and delegation',
  },
  {
    label: "I'm not sure — recommend the best option",
    learning: "I'm not sure — recommend the best option",
    delegation: "I'm not sure — recommend the best option",
  },
] as const;

export const FRENCH_REGIONS = [
  'Auvergne-Rhône-Alpes',
  'Bourgogne-Franche-Comté',
  'Bretagne',
  'Centre-Val de Loire',
  'Corse',
  'Grand Est',
  'Hauts-de-France',
  'Île-de-France',
  'Normandie',
  'Nouvelle-Aquitaine',
  'Occitanie',
  'Pays de la Loire',
  'Provence-Alpes-Côte d’Azur',
  'Guadeloupe',
  'Martinique',
  'Guyane',
  'La Réunion',
  'Mayotte',
  'International / Other',
] as const;

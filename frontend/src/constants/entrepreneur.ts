export const COUNTRIES = [
  'France',
  'Germany',
  'Spain',
  'Italy',
  'Netherlands',
  'Belgium',
  'Luxembourg',
  'Austria',
  'Poland',
  'Sweden',
] as const;

export const LEGAL_FORMS = [
  'SAS / SASU',
  'SARL / EURL',
  'SA',
  'Micro-entrepreneur',
  'Auto-entrepreneur',
  'Cooperative',
] as const;

export const PHASE_2_STEPS = [
  {
    step: 1 as const,
    title: 'Legal Identity',
    subtitle: 'Enter company info',
  },
  {
    step: 2 as const,
    title: 'Required Documentation',
    subtitle: 'Upload documents',
  },
  {
    step: 3 as const,
    title: 'Ownership & KYC',
    subtitle: 'Verify owners',
  },
  {
    step: 4 as const,
    title: 'Financial Preview',
    subtitle: 'Review summary',
  },
] as const;

export interface LaunchAssetSection {
  key: string;
  title: string;
  statusBadge: string;
  isIncluded: boolean;
  isRequired: boolean;
  headline?: string;
  description?: string;
  buttonLabel?: string;
  buttonDestinationType?: 'Email' | 'Link' | 'NotSet' | string;
  buttonDestinationValue?: string;
  exclusionReason?: string;
  actionLabel?: string;
  actionRoute?: string;
}

export interface LaunchWorkflowStep {
  stepNumber: number;
  title: string;
  description: string;
  tag: string;
}

export interface LaunchSolutionCard {
  title: string;
  description: string;
  icon: string;
}

export interface LaunchWorkflowDetailedItem {
  stepNumber: number;
  title: string;
  description: string;
}

export interface LaunchFaqItem {
  question: string;
  answer: string;
}

export interface LaunchPricingExclusion {
  excluded: boolean;
  chosenPrice?: number | null;
  priceStatus?: 'Unconfirmed' | 'ConfirmedZero' | 'ConfirmedPositive' | 'InvalidNegative' | string;
  selectedOfferId?: string;
  selectedOfferName?: string;
  billingPeriod: string;
  unit: string;
  currency: string;
  reason: string;
  actionLabel: string;
  actionRoute: string;
}

export interface LaunchProofExclusion {
  excluded: boolean;
  proofNeeded: boolean;
  reason: string;
  actionLabel: string;
  actionRoute: string;
}

export interface LaunchAssetsPlanSnapshot {
  version: number;
  releaseTag: string;
  status: string;
  savedAt: string;
  headline: string;
  description: string;
  buttonLabel: string;
  buttonDestinationType: string;
  buttonDestinationValue: string;
  problemEyebrow: string;
  problemStatement: string;
  operationalMomentumStatement: string;
  solutionHeader: string;
  solutionSubheader: string;
  plannedSolutions: LaunchSolutionCard[];
  howItWorksHeader: string;
  howItWorksSubheader: string;
  workflowDetails: LaunchWorkflowDetailedItem[];
  faqHeader: string;
  faqSubheader: string;
  faqs: LaunchFaqItem[];
  finalCtaHeader: string;
  finalCtaSubheader: string;
  brandName: string;
  footerNotice: string;
  sections: LaunchAssetSection[];
}

export interface LaunchBrandStudioSummary {
  brandName: string;
  concept: string;
  targetAudience: string;
  industry: string;
  positioning: string;
  personalityTraits: string[];
  tonePosition: string;

  // Logo Assets
  logoMarkUri: string;
  logoLockupUri: string;
  logoDescriptorLine: string;

  // Color Palette Hex Roles
  primaryColorHex: string;
  secondaryColorHex: string;
  accentColorHex: string;
  backgroundColorHex: string;
  textColorHex: string;

  // Typography
  displayFontFamily: string;
  textFontFamily: string;
  headingWeight: string;
  bodyWeight: string;
}

export interface LaunchAssetsPlan {
  assetType: string;
  version: number;
  selectedVersion?: number;
  status: string;
  releaseTag: string;
  publishedStatus: string;
  lastGeneratedAt: string;
  activeSectionKey: string;
  versionHistory?: LaunchAssetsPlanSnapshot[];

  // Brand Studio Visual & Strategic Identity
  brandStudio?: LaunchBrandStudioSummary;

  // Section A: Hero
  brandName: string;
  conceptBadge: string;
  headline: string;
  description: string;
  buttonLabel: string;
  buttonDestinationType: 'Email' | 'Link' | 'NotSet' | string;
  buttonDestinationValue: string;
  buttonDestinationConfigured: boolean;
  heroHelpText: string;

  // Planned Workflow (Hero Sub-container)
  plannedWorkflowTitle: string;
  plannedWorkflowSubtitle: string;
  workflowSteps: LaunchWorkflowStep[];

  // Section B: Problem
  problemEyebrow: string;
  problemStatement: string;
  operationalMomentumStatement: string;

  // Section C: Planned Solution
  solutionHeader: string;
  solutionSubheader: string;
  plannedSolutions: LaunchSolutionCard[];

  // Section D: How It Works
  howItWorksHeader: string;
  howItWorksSubheader: string;
  workflowDetails: LaunchWorkflowDetailedItem[];

  // Section E: FAQ
  faqHeader: string;
  faqSubheader: string;
  faqs: LaunchFaqItem[];

  // Section F: Final CTA
  finalCtaHeader: string;
  finalCtaSubheader: string;

  // Section G: Footer
  footerNotice: string;

  // Section Directory & Management
  sections: LaunchAssetSection[];
  pricingExclusion: LaunchPricingExclusion;
  proofExclusion: LaunchProofExclusion;
}

export interface LaunchAssetsResponse {
  ideaId: string;
  ideaVersion: number;
  assets: LaunchAssetsPlan | null;
  updateAvailable: boolean;
  changedSources: string[];
}

export interface UpdateLaunchAssetsRequest {
  ideaId?: string;
  expectedVersion?: number;
  activeSectionKey?: string;

  // Section A: Hero
  headline?: string;
  description?: string;
  buttonLabel?: string;
  buttonDestinationType?: 'Email' | 'Link' | 'NotSet' | string;
  buttonDestinationValue?: string;

  // Section B: Problem
  problemEyebrow?: string;
  problemStatement?: string;
  operationalMomentumStatement?: string;

  // Section C: Planned Solution
  solutionHeader?: string;
  solutionSubheader?: string;
  plannedSolutions?: LaunchSolutionCard[];

  // Section D: How It Works
  howItWorksHeader?: string;
  howItWorksSubheader?: string;
  workflowDetails?: LaunchWorkflowDetailedItem[];

  // Section E: FAQ
  faqHeader?: string;
  faqSubheader?: string;
  faqs?: LaunchFaqItem[];

  // Section F: Final CTA
  finalCtaHeader?: string;
  finalCtaSubheader?: string;

  // Section G: Footer
  brandName?: string;
  footerNotice?: string;

  sections?: LaunchAssetSection[];
}

export interface GenerateLaunchAssetsRequest {
  ideaId?: string;
  expectedVersion?: number;
}

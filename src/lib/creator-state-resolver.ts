import { CreatorJourneyState } from '@/types/creator/creator-journey';

export interface NextAction {
  targetPhase: number;
  targetStep: string;
  route: string;
  buttonLabel: string;
  prerequisiteReason?: string;
}

export function getNextCreatorAction(state: CreatorJourneyState): NextAction {
  // Phase 1 Check: Profile Onboarding & Verification
  if (state.phase1.status !== 'completed') {
    return {
      targetPhase: 1,
      targetStep: 'verification',
      route: '/dashboard/creator/phase-1',
      buttonLabel: 'Complete Your Verification',
      prerequisiteReason: 'Verify your identity to unlock your dashboard.'
    };
  }

  // Phase 2 Check: Project Identity. Canonical linear flow:
  //   Step <= 6: Idea Clarifier (/phase-2/clarifier)
  //   Step 7: Idea Summary (/phase-2/idea-summary)
  //   Step 8: Concept Name (/phase-2/concept-name)
  //   Step 9: Branding (/phase-2/branding)
  //   Step 10: Hire Designer (/phase-2/hire-designer)
  //   Step 11: Logo Tool (/phase-2/logo-tool)
  //   Step 12: Phase 2 Complete (/phase-2/complete)
  // (Note: Legacy step numbers 6, 7, 8, 9, 12 are preserved for backward compatibility
  // with persisted database values and backend DerivePhase2Step; Path A has been removed.)
  if (state.phase2.status !== 'completed') {
    const step = state.phase2.currentStep;

    let route = '/dashboard/creator/phase-2/clarifier';
    if (step <= 6) route = '/dashboard/creator/phase-2/clarifier';
    else if (step === 7) route = '/dashboard/creator/phase-2/idea-summary';
    else if (step === 8) route = '/dashboard/creator/phase-2/concept-name';
    else if (step === 9) route = '/dashboard/creator/phase-2/branding';
    else if (step === 10) route = '/dashboard/creator/phase-2/hire-designer';
    else if (step === 11) route = '/dashboard/creator/phase-2/logo-tool';
    else if (step === 12) route = '/dashboard/creator/phase-2/complete';

    return {
      targetPhase: 2,
      targetStep: `step-2.${step}`,
      route,
      buttonLabel: state.phase2.status === 'in_progress' ? 'Resume Setup' : 'Continue Setup'
    };
  }

  // Phase 3 Check: Project Intelligence
  if (state.phase3.status !== 'completed') {
    const step = state.phase3.currentStep;
    // Default = business plan (the new first screen). The removed 3.1 input screen means
    // the derivation never emits step 1, but any unmapped/legacy value (incl. a stale
    // local step 1) resolves here rather than the old /phase-3 root. Derivation steps are
    // unchanged: business plan = 2 (from clarifier), forecast = 3 (consumes plan), etc.
    let route = '/dashboard/creator/phase-3/business-plan';
    if (step === 3) route = '/dashboard/creator/phase-3/forecast';
    else if (step === 4) route = '/dashboard/creator/phase-3/compliance';
    else if (step === 5) route = '/dashboard/creator/phase-3/formation';
    else if (step === 6) route = '/dashboard/creator/phase-3/complete';

    return {
      targetPhase: 3,
      targetStep: `step-3.${step}`,
      route,
      buttonLabel: state.phase3.status === 'in_progress' ? 'Resume Project Intelligence' : 'Continue Setup'
    };
  }

  // Phase 4 Check: Offer & Resource Setup
  if (state.phase4.status !== 'completed') {
    return {
      targetPhase: 4,
      targetStep: 'offer-pricing',
      route: '/dashboard/creator/offer-pricing',
      buttonLabel: state.phase4.status === 'in_progress' ? 'Resume Offer & Pricing' : 'Continue Setup'
    };
  }

  // Phase 5 Check: The Crossroads
  if (state.phase5.status !== 'completed') {
    return {
      targetPhase: 5,
      targetStep: 'crossroads',
      route: '/dashboard/creator/crossroads',
      buttonLabel: 'Make Crossroads Decision'
    };
  }

  // Phase 6 Check: Smart Matching
  if (state.phase6.status !== 'completed') {
    return {
      targetPhase: 6,
      targetStep: 'matching',
      route: '/dashboard/creator/investors',
      buttonLabel: 'Start Smart Matching'
    };
  }

  // All complete
  return {
    targetPhase: 6,
    targetStep: 'complete',
    route: '/dashboard/creator',
    buttonLabel: 'All Stages Complete 🎉'
  };
}

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

  // Phase 2 Check: Project Identity
  if (state.phase2.status !== 'completed') {
    const step = state.phase2.currentStep;
    let route = '/dashboard/creator/phase-2';
    if (step === 2) route = '/dashboard/creator/phase-2/discovery';
    else if (step === 3) route = '/dashboard/creator/phase-2/ai-processing';
    else if (step === 4) route = '/dashboard/creator/phase-2/idea-cards';
    else if (step === 5) route = '/dashboard/creator/phase-2/idea-confirm';
    else if (step === 6) route = '/dashboard/creator/phase-2/clarifier';
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
    let route = '/dashboard/creator/phase-3';
    if (step === 2) route = '/dashboard/creator/phase-3/forecast';
    else if (step === 3) route = '/dashboard/creator/phase-3/business-plan';
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

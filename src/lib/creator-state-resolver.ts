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

  // Phase 2 Check: Project Identity. Step numbers match backend DerivePhase2Step (2C-2):
  //   2=discovery form, 3=ai-processing, 4=idea-cards, 5=idea-confirm,
  //   6=clarifier, 7=idea-summary, 8=concept-name, 9=branding,
  //   10=hire-designer, 11=logo-tool, 12=complete.
  // Discovery steps 3–5 resume from hydrated state. Step 3 (ai-processing) needs a live
  // generation session it can't recover from a bare route, so it resumes to the discovery
  // form (pre-filled from hydrated inputs; the user re-generates). Step 2 isn't backend-
  // derivable, and a fresh user with no chosen path also derives to 6 — both must land on
  // the Smart Gate to choose, not the clarifier. So step 6 routes to the clarifier ONLY
  // when the user is actually on Path-B / has clarifier activity; otherwise the Smart Gate.
  // (The Discovery entry card is still hidden for alpha; this mapping is ready for it.)
  if (state.phase2.status !== 'completed') {
    const step = state.phase2.currentStep;
    const p2 = state.phase2;
    const inClarifier =
      p2.selectedEntryPath === 'already_have_idea' ||
      !!p2.clarifierSessionId ||
      (p2.chatMessages?.length ?? 0) > 0;

    let route = '/dashboard/creator/phase-2'; // Smart Gate — fresh user (no path chosen) / step 2
    if (step === 3) route = '/dashboard/creator/phase-2/discovery';       // ai-processing not bare-route-resumable
    else if (step === 4) route = '/dashboard/creator/phase-2/idea-cards';
    else if (step === 5) route = '/dashboard/creator/phase-2/idea-confirm';
    else if (step === 6) route = inClarifier ? '/dashboard/creator/phase-2/clarifier' : '/dashboard/creator/phase-2';
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
    // Business plan first (step 2, from clarifier), then forecast (step 3, consumes plan).
    if (step === 2) route = '/dashboard/creator/phase-3/business-plan';
    else if (step === 3) route = '/dashboard/creator/phase-3/forecast';
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

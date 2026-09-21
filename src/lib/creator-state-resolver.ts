import { CreatorJourneyState } from '@/types/creator/creator-journey';
import { withIdeaContext } from '@/lib/creator-routes';

export interface NextAction {
  targetPhase: number;
  targetStep: string;
  route: string;
  buttonLabel: string;
  prerequisiteReason?: string;
}

export function getNextCreatorAction(state: CreatorJourneyState, ideaId?: string | null): NextAction {
  const wrap = (action: NextAction): NextAction => {
    if (!ideaId) return action;
    return { ...action, route: withIdeaContext(action.route, ideaId) };
  };

  // Phase 1 Check: Profile Onboarding & Verification
  if (state.phase1.status !== 'completed') {
    return wrap({
      targetPhase: 1,
      targetStep: 'verification',
      route: '/dashboard/creator/phase-1',
      buttonLabel: 'Complete Your Verification',
      prerequisiteReason: 'Verify your identity to unlock your dashboard.'
    });
  }

  // Phase 2 Check: Project Identity. Canonical linear flow:
  //   Step <= 6: Idea Clarifier (/phase-2/clarifier)
  //   Step 7: Idea Summary (/phase-2/idea-summary)
  //   Step 8: Concept Name (/phase-2/concept-name)
  //   Step 9: Branding (/phase-2/branding)
  //   Step 10: Hire Designer (/phase-2/hire-designer)
  //   Step 11: Logo Tool (/phase-2/logo-tool)
  //   Step 12: Phase 2 Complete (/phase-2/complete)
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

    return wrap({
      targetPhase: 2,
      targetStep: `step-2.${step}`,
      route,
      buttonLabel: state.phase2.status === 'in_progress' ? 'Resume Setup' : 'Continue Setup'
    });
  }

  // Phase 3 Check: Project Intelligence (Canonical 7-Step Sequence):
  //   Step 1: Market Study (/phase-3/market-study)
  //   Step 2: Business Model (/phase-3/business-model)
  //   Step 3: Financial Forecast (/phase-3/forecast)
  //   Step 4: Legal & Compliance Checklist (/phase-3/compliance)
  //   Step 5: Company Formation & Team (/phase-3/formation)
  //   Step 6: Executive Business Plan (/phase-3/business-plan)
  //   Step 7: Phase 3 Complete / Investor Readiness (/phase-3/complete)
  if (state.phase3.status !== 'completed') {
    const step = state.phase3.currentStep;

    let route = '/dashboard/creator/phase-3/market-study';
    if (step <= 1) route = '/dashboard/creator/phase-3/market-study';
    else if (step === 2) route = '/dashboard/creator/phase-3/business-model';
    else if (step === 3) route = '/dashboard/creator/phase-3/forecast';
    else if (step === 4) route = '/dashboard/creator/phase-3/compliance';
    else if (step === 5) route = '/dashboard/creator/phase-3/formation';
    else if (step === 6) route = '/dashboard/creator/phase-3/business-plan';
    else if (step >= 7) route = '/dashboard/creator/phase-3/complete';

    return wrap({
      targetPhase: 3,
      targetStep: `step-3.${step}`,
      route,
      buttonLabel: state.phase3.status === 'in_progress' ? 'Resume Project Intelligence' : 'Continue Setup'
    });
  }

  // Phase 4 Check: Construction Engine
  if (state.phase4.status !== 'completed') {
    return wrap({
      targetPhase: 4,
      targetStep: 'construction',
      route: '/dashboard/creator/phase-4',
      buttonLabel: state.phase4.status === 'in_progress' ? 'Resume Construction' : 'Continue Setup'
    });
  }

  // Phase 5 Check: The Crossroads
  if (state.phase5.status !== 'completed') {
    return wrap({
      targetPhase: 5,
      targetStep: 'crossroads',
      route: '/dashboard/creator/crossroads',
      buttonLabel: 'Make Crossroads Decision'
    });
  }

  // Phase 6 Check: Smart Matching
  if (state.phase6.status !== 'completed') {
    return wrap({
      targetPhase: 6,
      targetStep: 'matching',
      route: '/dashboard/creator/investors',
      buttonLabel: 'Start Smart Matching'
    });
  }

  // All complete
  return wrap({
    targetPhase: 6,
    targetStep: 'complete',
    route: '/dashboard/creator',
    buttonLabel: 'All Stages Complete 🎉'
  });
}

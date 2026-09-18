import { describe, it, expect } from 'vitest';
import { getNextCreatorAction } from '@/lib/creator-state-resolver';
import type { CreatorJourneyState } from '@/types/creator/creator-journey';

describe('Creator Phase 2 Linear Journey & State Resolver', () => {
  const baseJourneyState: CreatorJourneyState = {
    currentPhase: 2,
    phase1: { status: 'completed', currentStep: 3 },
    phase2: { status: 'available', currentStep: 6 },
    phase3: { status: 'locked', currentStep: 1 },
    phase4: { status: 'locked', currentStep: 1 },
    phase5: { status: 'locked', currentStep: 1 },
    phase6: { status: 'locked', currentStep: 1 },
  };

  it('routes fresh creator (step <= 6) directly to the Idea Clarifier', () => {
    const state: CreatorJourneyState = {
      ...baseJourneyState,
      phase2: { status: 'available', currentStep: 6 },
    };
    const action = getNextCreatorAction(state);
    expect(action.targetPhase).toBe(2);
    expect(action.route).toBe('/dashboard/creator/phase-2/clarifier');
  });

  it('resumes partial clarifier (in_progress, step <= 6) to Idea Clarifier', () => {
    const state: CreatorJourneyState = {
      ...baseJourneyState,
      phase2: { status: 'in_progress', currentStep: 6 },
    };
    const action = getNextCreatorAction(state);
    expect(action.targetPhase).toBe(2);
    expect(action.route).toBe('/dashboard/creator/phase-2/clarifier');
    expect(action.buttonLabel).toBe('Resume Setup');
  });

  it('routes clarifier complete (step 7) to Idea Summary', () => {
    const state: CreatorJourneyState = {
      ...baseJourneyState,
      phase2: { status: 'in_progress', currentStep: 7 },
    };
    const action = getNextCreatorAction(state);
    expect(action.targetPhase).toBe(2);
    expect(action.route).toBe('/dashboard/creator/phase-2/idea-summary');
  });

  it('routes missing name (step 8) to Concept Name', () => {
    const state: CreatorJourneyState = {
      ...baseJourneyState,
      phase2: { status: 'in_progress', currentStep: 8 },
    };
    const action = getNextCreatorAction(state);
    expect(action.targetPhase).toBe(2);
    expect(action.route).toBe('/dashboard/creator/phase-2/concept-name');
  });

  it('routes branding decision missing (step 9) to Branding', () => {
    const state: CreatorJourneyState = {
      ...baseJourneyState,
      phase2: { status: 'in_progress', currentStep: 9 },
    };
    const action = getNextCreatorAction(state);
    expect(action.targetPhase).toBe(2);
    expect(action.route).toBe('/dashboard/creator/phase-2/branding');
  });

  it('routes branding sub-branches (step 10 hire designer, step 11 logo tool)', () => {
    const state10: CreatorJourneyState = {
      ...baseJourneyState,
      phase2: { status: 'in_progress', currentStep: 10 },
    };
    expect(getNextCreatorAction(state10).route).toBe('/dashboard/creator/phase-2/hire-designer');

    const state11: CreatorJourneyState = {
      ...baseJourneyState,
      phase2: { status: 'in_progress', currentStep: 11 },
    };
    expect(getNextCreatorAction(state11).route).toBe('/dashboard/creator/phase-2/logo-tool');
  });

  it('routes phase 2 complete (step 12) to Complete screen', () => {
    const state: CreatorJourneyState = {
      ...baseJourneyState,
      phase2: { status: 'in_progress', currentStep: 12 },
    };
    const action = getNextCreatorAction(state);
    expect(action.targetPhase).toBe(2);
    expect(action.route).toBe('/dashboard/creator/phase-2/complete');
  });

  it('unlocks Phase 3 when Phase 2 status is completed', () => {
    const state: CreatorJourneyState = {
      ...baseJourneyState,
      phase2: { status: 'completed', currentStep: 12 },
      phase3: { status: 'available', currentStep: 2 },
    };
    const action = getNextCreatorAction(state);
    expect(action.targetPhase).toBe(3);
    expect(action.route).toBe('/dashboard/creator/phase-3/business-model');
  });

  it('never routes to removed Path A endpoints (discovery, ai-processing, idea-cards, idea-confirm) for any step', () => {
    const removedRoutes = [
      '/dashboard/creator/phase-2/discovery',
      '/dashboard/creator/phase-2/ai-processing',
      '/dashboard/creator/phase-2/idea-cards',
      '/dashboard/creator/phase-2/idea-confirm',
    ];

    for (let step = 0; step <= 15; step++) {
      const state: CreatorJourneyState = {
        ...baseJourneyState,
        phase2: { status: 'in_progress', currentStep: step },
      };
      const action = getNextCreatorAction(state);
      for (const removed of removedRoutes) {
        expect(action.route).not.toBe(removed);
      }
    }
  });
});

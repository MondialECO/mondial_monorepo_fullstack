import { describe, it, expect } from 'vitest';
import { getNextCreatorAction } from '@/lib/creator-state-resolver';
import { CreatorJourneyState } from '@/types/creator/creator-journey';
import * as creatorApi from '@/lib/api-creator-journey';
import { menu } from '@/lib/menu';
import { UserRole } from '@/lib/roles';

describe('Legacy Creator Phase 4 Removal Anti-Regression', () => {
  const baseState: CreatorJourneyState = {
    currentPhase: 4,
    highestPhaseReached: 4,
    canAdvanceToNextPhase: true,
    phase1: { status: 'completed' } as any,
    phase2: { status: 'completed', currentStep: 12 } as any,
    phase3: { status: 'completed', currentStep: 7 } as any,
    phase4: { status: 'in_progress', currentStep: 1 } as any,
    phase5: { status: 'locked', decision: null } as any,
    phase6: { status: 'locked' } as any,
  };

  it('CreatorStateResolver_RoutesToCanonicalPhase4', () => {
    const action = getNextCreatorAction(baseState);
    expect(action.targetPhase).toBe(4);
    expect(action.targetStep).toBe('construction');
    expect(action.route).toBe('/dashboard/creator/phase-4');
  });

  it('LegacyOfferPricingRoute_IsNotPartOfCanonicalCreatorFlow', () => {
    // Check all variations of phase progression
    for (let p = 1; p <= 6; p++) {
      const state = {
        ...baseState,
        phase1: { status: p > 1 ? 'completed' : 'in_progress' },
        phase2: { status: p > 2 ? 'completed' : 'in_progress', currentStep: 1 },
        phase3: { status: p > 3 ? 'completed' : 'in_progress', currentStep: 1 },
        phase4: { status: p > 4 ? 'completed' : 'in_progress' },
        phase5: { status: p > 5 ? 'completed' : 'in_progress', decision: null },
        phase6: { status: p >= 6 ? 'in_progress' : 'locked' },
      } as any;

      const action = getNextCreatorAction(state);
      expect(action.route).not.toContain('offer-pricing');
    }
  });

  it('CanonicalPhase4_DoesNotCallLegacyOfferApi', () => {
    const apiKeys = Object.keys(creatorApi);
    expect(apiKeys).not.toContain('setPricing');
    expect(apiKeys).not.toContain('resourceCalculator');
    expect(apiKeys).not.toContain('gtmSetup');
    expect(apiKeys).not.toContain('completeOffer');
    expect(apiKeys).not.toContain('pricingInsights');
    expect(apiKeys).not.toContain('marketBenchmark');
  });

  it('Menu_DoesNotContainLegacyOfferPricing', () => {
    const creatorSections = menu[UserRole.CREATOR];
    const allHrefs: string[] = [];
    creatorSections.forEach(section => {
      section.items.forEach(item => {
        allHrefs.push(item.href);
        item.children?.forEach(child => allHrefs.push(child.href));
      });
    });
    expect(allHrefs).not.toContain('/dashboard/creator/offer-pricing');
    expect(allHrefs).toContain('/dashboard/creator/phase-4');
  });

  it('Phase5_RemainsAvailable', () => {
    const p5State = {
      ...baseState,
      phase4: { status: 'completed' } as any,
      phase5: { status: 'not_started', decision: null } as any,
    };
    const action = getNextCreatorAction(p5State);
    expect(action.targetPhase).toBe(5);
    expect(action.targetStep).toBe('crossroads');
    expect(action.route).toBe('/dashboard/creator/crossroads');
  });

  it('Phase6_RemainsAvailable', () => {
    const p6State = {
      ...baseState,
      phase4: { status: 'completed' } as any,
      phase5: { status: 'completed', decision: 'build' } as any,
      phase6: { status: 'not_started' } as any,
    };
    const action = getNextCreatorAction(p6State);
    expect(action.targetPhase).toBe(6);
    expect(action.targetStep).toBe('matching');
    expect(action.route).toBe('/dashboard/creator/investors');
  });
});

import { describe, expect, it } from 'vitest';
import { AWAITING_CLIENT } from '@/lib/workroom-status';

/**
 * The review-window card ("payment releases automatically on [date]") must appear only
 * while a delivery is genuinely sitting with the client.
 *
 * SubmitDeliverableAsync sets ReviewWindowEndsAt and AutoReleaseAt once and nothing ever
 * clears them, so both stay populated for the rest of the milestone's life. Gating on
 * field presence — which the SP panel did until this fix, and the buyer card did until
 * 10b2756 — therefore showed the warning on Paid, Cancelled and Disputed milestones with
 * a date already in the past.
 *
 * These assert the predicate both surfaces now share. Rendering is not exercised here:
 * both components pull a dozen mutation hooks, and the defect was entirely in this
 * condition.
 */
const gateShowsCard = (milestone: { status: string; autoReleaseAt?: string | null }) =>
  AWAITING_CLIENT.has(milestone.status) && !!milestone.autoReleaseAt;

const PAST = '2026-07-01T12:00:00Z';

describe('review-window card gating', () => {
  it.each(['ClientReviewing', 'Resubmitted'])(
    'shows the card while the delivery sits with the client (%s)',
    (status) => {
      expect(gateShowsCard({ status, autoReleaseAt: PAST })).toBe(true);
    }
  );

  /**
   * The actual bug: these all carry a populated autoReleaseAt from the delivery that has
   * already been through review, so a presence check renders a stale warning.
   */
  it.each(['Paid', 'Cancelled', 'Disputed', 'RevisionRequested', 'RevisionInProgress', 'Approved'])(
    'hides the card once the milestone has moved on (%s)',
    (status) => {
      expect(gateShowsCard({ status, autoReleaseAt: PAST })).toBe(false);
    }
  );

  it('hides the card before anything has been delivered', () => {
    expect(gateShowsCard({ status: 'Active', autoReleaseAt: null })).toBe(false);
    expect(gateShowsCard({ status: 'FundingRequired' })).toBe(false);
  });

  /**
   * A provider-favoured resolution returns the milestone to ClientReviewing and escrow to
   * Funded, so the clock genuinely restarts and the card must come back — the fix must not
   * suppress it permanently once a dispute has happened.
   */
  it('shows the card again after a provider-favoured dispute resolution', () => {
    const resolved = {
      status: 'ClientReviewing',
      autoReleaseAt: PAST,
      disputeOutcome: 'ProviderFavored',
    };

    expect(gateShowsCard(resolved)).toBe(true);
  });

  /** A client-favoured resolution settles to Paid, where no auto-release is pending. */
  it('keeps the card hidden after a client-favoured dispute resolution', () => {
    expect(gateShowsCard({ status: 'Paid', autoReleaseAt: PAST })).toBe(false);
  });

  /**
   * Pins the set itself. It mirrors the states SweepTimedRulesAsync auto-releases; adding
   * one here without a backend change would re-introduce a warning that is not true.
   */
  it('contains exactly the states the backend auto-releases', () => {
    expect([...AWAITING_CLIENT].sort()).toEqual(['ClientReviewing', 'Resubmitted']);
  });
});

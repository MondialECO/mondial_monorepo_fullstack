/**
 * Admin-scoped workroom actions. Third sibling to `api-workroom.ts` (provider) and
 * `api-workroom-client.ts` (buyer), kept separate because these endpoints are
 * `[Authorize(Roles = "Admin")]` and must not be reachable from either party's surface.
 */
import api from '@/lib/axios';
import type { ApiEnvelope } from '@/types/service-provider';
import { CLIENT_FAVORED, PROVIDER_FAVORED } from '@/lib/workroom-status';
import type { WorkroomDetail } from '@/types/workroom';

const BASE = '/workroom';

/**
 * The two outcomes the backend accepts. `Split` exists in the DisputeOutcome enum but
 * `ResolveDisputeAsync` rejects it outright — split settlements need an explicit
 * contract amendment and are deliberately not auto-priced (canon §10.7). `Open` is
 * rejected too: it is the starting state, not a resolution.
 *
 * Spelling is American — `Favored`, not `Favoured` — because the value is parsed against
 * the C# enum by name.
 */
export const DISPUTE_OUTCOMES = [
  {
    value: PROVIDER_FAVORED,
    label: 'Provider favoured',
    effect:
      'Escrow returns to Funded and the milestone goes back to client review. The buyer can then approve and release payment as normal.',
  },
  {
    value: CLIENT_FAVORED,
    label: 'Client favoured',
    effect:
      'Escrow is refunded to the buyer. The milestone settles as Paid with a refund timestamp, so the engagement can still be completed.',
  },
] as const;

export type DisputeOutcomeValue = (typeof DISPUTE_OUTCOMES)[number]['value'];

/** Admin only. Returns the full workroom detail for the affected engagement. */
export async function resolveDispute(
  milestoneId: string,
  outcome: DisputeOutcomeValue,
  reason: string
): Promise<WorkroomDetail> {
  const res = await api.post<ApiEnvelope<WorkroomDetail>>(
    `${BASE}/milestones/${milestoneId}/resolve-dispute`,
    { outcome, reason }
  );
  return res.data.data;
}

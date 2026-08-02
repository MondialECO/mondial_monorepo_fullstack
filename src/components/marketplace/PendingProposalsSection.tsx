'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/marketplace-format';
import { getEngagements } from '@/lib/api-workroom';
import { workroomErrorMessage } from '@/lib/workroom-format';
import {
  packagePurchaseKeys,
  useAcceptProposal,
  useMyProposals,
  useProposalConversionPoll,
} from '@/hooks/queries/package-purchase';
import type { Proposal } from '@/types/leads';

/** Statuses that still need something from the client. Everything else is history. */
const ACTIONABLE = new Set(['Submitted', 'ClientReviewing']);

const apiErrorMessage = (error: unknown) =>
  workroomErrorMessage(error, 'Could not complete your order. Please try again.');

export function PendingProposalsSection({ basePath }: { basePath: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useMyProposals();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [escrowAuthorized, setEscrowAuthorized] = useState(false);
  const [acceptedProposalId, setAcceptedProposalId] = useState<string | null>(null);

  const accept = useAcceptProposal();
  const { converted, isTimedOut } = useProposalConversionPoll(acceptedProposalId);

  // Same resolution path as the order flow's Step 3: conversion is observed, then the
  // engagement is matched by proposalId.
  useEffect(() => {
    if (!converted || !acceptedProposalId) return;
    let cancelled = false;
    (async () => {
      try {
        const engagements = await getEngagements();
        const match = engagements.find((e) => e.proposalId === acceptedProposalId);
        if (!cancelled) router.push(match ? `${basePath}/${match.id}` : basePath);
      } catch {
        if (!cancelled) router.push(basePath);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [converted, acceptedProposalId, basePath, router]);

  const handleAccept = useCallback(
    (proposalId: string) => {
      accept.mutate(
        { id: proposalId, payload: { explicitlyConfirmed: true, escrowAuthorized: true } },
        {
          onSuccess: () => {
            setAcceptedProposalId(proposalId);
            queryClient.invalidateQueries({ queryKey: packagePurchaseKeys.myProposals });
          },
        }
      );
    },
    [accept, queryClient]
  );

  const pending = (data ?? []).filter((p) => ACTIONABLE.has(p.status));

  if (isLoading || pending.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-1 text-lg font-semibold text-foreground">Pending your action</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Orders that haven&apos;t started yet because they&apos;re waiting on a confirmation.
      </p>

      <div className="space-y-3">
        {pending.map((p) => (
          <PendingProposalRow
            key={p.id}
            proposal={p}
            isExpanded={expandedId === p.id}
            onExpand={() => {
              setExpandedId(expandedId === p.id ? null : p.id);
              setConfirmed(false);
              setEscrowAuthorized(false);
            }}
            confirmed={confirmed}
            escrowAuthorized={escrowAuthorized}
            onToggleConfirmed={() => setConfirmed((v) => !v)}
            onToggleEscrow={() => setEscrowAuthorized((v) => !v)}
            onAccept={() => handleAccept(p.id)}
            isSubmitting={accept.isPending && expandedId === p.id}
            errorMessage={
              accept.isError && expandedId === p.id ? apiErrorMessage(accept.error) : null
            }
            isConverting={acceptedProposalId === p.id && !converted && !isTimedOut}
            isTimedOut={acceptedProposalId === p.id && isTimedOut}
          />
        ))}
      </div>
    </section>
  );
}

interface RowProps {
  proposal: Proposal;
  isExpanded: boolean;
  onExpand: () => void;
  confirmed: boolean;
  escrowAuthorized: boolean;
  onToggleConfirmed: () => void;
  onToggleEscrow: () => void;
  onAccept: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
  isConverting: boolean;
  isTimedOut: boolean;
}

function PendingProposalRow({
  proposal,
  isExpanded,
  onExpand,
  confirmed,
  escrowAuthorized,
  onToggleConfirmed,
  onToggleEscrow,
  onAccept,
  isSubmitting,
  errorMessage,
  isConverting,
  isTimedOut,
}: RowProps) {
  const awaitingProvider = proposal.status === 'Submitted';

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{proposal.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatPrice(proposal.proposedPrice, proposal.currency)} ·{' '}
            {proposal.deliveryTimeValue} {proposal.deliveryTimeUnit}
          </p>
        </div>

        <div className="shrink-0">
          {awaitingProvider ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              <Clock className="size-3" />
              Awaiting provider approval
            </span>
          ) : isConverting ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Setting up your workroom...
            </span>
          ) : (
            <Button size="sm" onClick={onExpand} variant={isExpanded ? 'outline' : 'default'}>
              {isExpanded ? 'Cancel' : 'Complete your order'}
            </Button>
          )}
        </div>
      </div>

      {isTimedOut && (
        <p className="mt-3 text-xs text-muted-foreground">
          Your order is being set up — refresh shortly to see it in your engagements.
        </p>
      )}

      {isExpanded && !awaitingProvider && !isConverting && (
        <div className="mt-4 space-y-3 border-t border-border pt-4">
          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={onToggleConfirmed}
              className="mt-0.5 rounded border border-input"
            />
            <span className="text-foreground">I confirm this order</span>
          </label>

          <label className="flex cursor-pointer items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={escrowAuthorized}
              onChange={onToggleEscrow}
              className="mt-0.5 rounded border border-input"
            />
            <span className="text-foreground">
              Escrow authorization approved (simulated in development)
            </span>
          </label>

          {errorMessage && (
            <p className="rounded-md border border-destructive/20 bg-destructive/10 p-2 text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <Button
            onClick={onAccept}
            disabled={!confirmed || !escrowAuthorized || isSubmitting}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Confirming...
              </>
            ) : (
              'Confirm order'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

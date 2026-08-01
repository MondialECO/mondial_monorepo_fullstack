'use client';

import { FileText } from 'lucide-react';
import { formatPrice } from '@/lib/marketplace-format';
import { statusChipClass } from '@/lib/workroom-status';
import {
  useClientConfirmContract,
  workroomErrorMessage,
} from '@/hooks/queries/workroom-client';
import { ConfirmAction } from './ConfirmAction';
import type { Contract } from '@/types/workroom';

export function ContractPanel({
  contract,
  engagementId,
}: {
  contract: Contract;
  engagementId: string;
}) {
  const confirm = useClientConfirmContract();
  const terms = contract.terms;

  const clientSigned = !!contract.clientSignedAt;
  const providerSigned = !!contract.providerSignedAt;
  const voided = contract.status === 'Voided';

  return (
    <section className="rounded-lg border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-foreground">
          <FileText className="size-4" />
          Contract
        </h2>
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${statusChipClass(contract.status)}`}
        >
          {contract.status}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-muted-foreground">Price</dt>
          <dd className="text-sm font-medium text-foreground">
            {formatPrice(terms.price, terms.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Delivery</dt>
          <dd className="text-sm font-medium text-foreground">
            {terms.deliveryTimeValue} {terms.deliveryTimeUnit}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Revisions</dt>
          <dd className="text-sm font-medium text-foreground">
            {terms.unlimitedRevisions ? 'Unlimited' : terms.includedRevisionCount}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Pricing</dt>
          <dd className="text-sm font-medium text-foreground">{terms.pricingType}</dd>
        </div>
      </dl>

      {terms.deliverables?.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Deliverables</p>
          <ul className="list-inside list-disc space-y-0.5">
            {terms.deliverables.map((d, i) => (
              <li key={i} className="text-sm text-foreground">
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 border-t border-border pt-4">
        {voided ? (
          <p className="text-sm text-muted-foreground">This contract was voided.</p>
        ) : !clientSigned ? (
          <ConfirmAction
            label="Sign contract"
            title="Sign this contract?"
            body="Both parties must sign before work can begin."
            confirmLabel="I agree to the terms"
            onConfirm={() => confirm.mutate(engagementId)}
            isPending={confirm.isPending}
            errorMessage={confirm.isError ? workroomErrorMessage(confirm.error) : null}
          />
        ) : !providerSigned ? (
          <p className="text-sm text-muted-foreground">
            You&apos;ve signed. Awaiting provider signature before work can begin.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Signed by both parties.</p>
        )}
      </div>
    </section>
  );
}

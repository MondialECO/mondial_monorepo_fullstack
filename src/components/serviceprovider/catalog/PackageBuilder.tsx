'use client';

import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  SpCard,
  SpMutationFeedback,
  SpSectionHeader,
  SpStatusBadge,
} from '@/components/serviceprovider/ui';
import {
  useAddPackage,
  usePublishPackage,
  useUnpublishPackage,
  useUpdatePackage,
} from '@/hooks/queries/service-catalog';
import {
  PACKAGE_TYPES,
  type PackageType,
  type ServicePackage,
  type UpsertServicePackageRequest,
} from '@/types/service-catalog';
import { PackageEditor } from './PackageEditor';

type PublishInfo = {
  pkgId: string;
  warnings?: string[];
  error?: string;
  needsConfirm?: boolean;
};

export function PackageBuilder({
  listingId,
  packages,
  category,
}: {
  listingId: string;
  packages: ServicePackage[];
  category: string;
}) {
  const add = useAddPackage();
  const updatePackage = useUpdatePackage();
  const publish = usePublishPackage();
  const unpublish = useUnpublishPackage();
  const [editingTier, setEditingTier] = useState<PackageType | null>(null);
  const [publishInfo, setPublishInfo] = useState<PublishInfo | null>(null);
  const [confirmPackageId, setConfirmPackageId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  const byTier = (tier: PackageType) =>
    packages.find((item) => item.packageType === tier);

  const doPublish = async (packageId: string, confirm = false) => {
    setFeedback(null);
    setPublishInfo(null);
    try {
      const response = await publish.mutateAsync([
        packageId,
        { confirmShorterDelivery: confirm },
      ]);
      setPublishInfo({ pkgId: packageId, warnings: response.warnings });
      setFeedback({ status: 'success', message: 'Package published successfully.' });
      setConfirmPackageId(null);
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'The package could not be published.';
      const needsConfirm = /confirmation/i.test(message);
      setPublishInfo({ pkgId: packageId, error: message, needsConfirm });
      if (!needsConfirm) setFeedback({ status: 'error', message });
    }
  };

  const doUnpublish = async (packageId: string) => {
    setFeedback(null);
    try {
      await unpublish.mutateAsync([packageId]);
      setFeedback({ status: 'success', message: 'Package unpublished successfully.' });
    } catch {
      setFeedback({ status: 'error', message: 'The package could not be unpublished. Try again.' });
    }
  };

  if (editingTier) {
    const existing = byTier(editingTier);
    return (
      <PackageEditor
        tier={editingTier}
        existing={existing}
        category={category}
        pending={add.isPending || updatePackage.isPending}
        onCancel={() => setEditingTier(null)}
        onSubmit={async (payload: UpsertServicePackageRequest) => {
          if (existing) await updatePackage.mutateAsync([existing.id, payload]);
          else await add.mutateAsync([listingId, payload]);
          setEditingTier(null);
          setFeedback({ status: 'success', message: `${editingTier} package saved successfully.` });
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <SpCard>
        <SpSectionHeader
          title="Packages & scope"
          description="Define client-facing scope for Basic, Standard, and Premium. Package terms are the source of truth for delivery and revisions."
        />
        <p className="mt-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-xs leading-5 text-[#6B7280]">
          Prices below are gross client-facing amounts. The catalog does not calculate provider net earnings; the server-provided payment-release preview remains authoritative.
        </p>
      </SpCard>

      {feedback && <SpMutationFeedback status={feedback.status}>{feedback.message}</SpMutationFeedback>}

      <div className="grid gap-4 xl:grid-cols-3">
        {PACKAGE_TYPES.map((tier) => {
          const item = byTier(tier);
          return item ? (
            <PackageCard
              key={tier}
              item={item}
              publishInfo={publishInfo?.pkgId === item.id ? publishInfo : null}
              pending={publish.isPending || unpublish.isPending}
              onEdit={() => setEditingTier(tier)}
              onPublish={() => doPublish(item.id)}
              onConfirmPublish={() => setConfirmPackageId(item.id)}
              onUnpublish={() => doUnpublish(item.id)}
            />
          ) : (
            <SpCard key={tier} className="flex min-h-80 flex-col items-center justify-center border-dashed text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-[#F4F5F7] text-[#6B7280]">
                <Plus className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold text-[#171717]">{tier}</h3>
              <p className="mt-2 max-w-60 text-sm leading-6 text-[#6B7280]">
                Add the scope, price, delivery terms, revisions, and client requirements for this package.
              </p>
              <Button type="button" variant="outline" className="mt-5" onClick={() => setEditingTier(tier)}>
                Add {tier} package
              </Button>
            </SpCard>
          );
        })}
      </div>

      <Dialog open={!!confirmPackageId} onOpenChange={(open) => !open && setConfirmPackageId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish with the delivery warning?</DialogTitle>
            <DialogDescription>
              The server detected a higher package with a shorter delivery time. Confirm only if those delivery terms are intentional.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmPackageId(null)} disabled={publish.isPending}>
              Review package
            </Button>
            <Button
              type="button"
              onClick={() => confirmPackageId && doPublish(confirmPackageId, true)}
              disabled={publish.isPending}
            >
              {publish.isPending ? 'Publishing…' : 'Confirm and publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PackageCard({
  item,
  publishInfo,
  pending,
  onEdit,
  onPublish,
  onConfirmPublish,
  onUnpublish,
}: {
  item: ServicePackage;
  publishInfo: PublishInfo | null;
  pending: boolean;
  onEdit: () => void;
  onPublish: () => void;
  onConfirmPublish: () => void;
  onUnpublish: () => void;
}) {
  const amount = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: item.currency || 'EUR',
    maximumFractionDigits: 2,
  }).format(item.price);

  return (
    <SpCard className="flex min-h-[30rem] flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6B7280]">{item.packageType}</p>
          <h3 className="mt-2 font-heading text-lg font-semibold text-[#171717]">
            {item.packageTitle || item.packageName || 'Untitled package'}
          </h3>
        </div>
        <SpStatusBadge tone={item.status === 'Published' ? 'positive' : 'neutral'}>{item.status}</SpStatusBadge>
      </div>

      <p className="mt-5 text-3xl font-semibold tracking-tight text-[#171717]">{amount}</p>
      <p className="mt-3 min-h-12 text-sm leading-6 text-[#6B7280]">
        {item.packageDescription || 'No package description has been added.'}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-[#F9FAFB] p-4 text-sm">
        <div>
          <dt className="text-xs text-[#6B7280]">Delivery</dt>
          <dd className="mt-1 font-semibold text-[#171717]">{item.deliveryTimeValue} {formatEnum(item.deliveryTimeUnit)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#6B7280]">Revisions</dt>
          <dd className="mt-1 font-semibold text-[#171717]">
            {item.unlimitedRevisions ? 'Unlimited' : item.includedRevisionCount}
          </dd>
        </div>
      </dl>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#6B7280]">Included deliverables</p>
        {item.deliverables.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {item.deliverables.slice(0, 4).map((deliverable) => (
              <li key={deliverable} className="flex items-start gap-2 text-sm text-[#374151]">
                <Check className="mt-0.5 size-4 shrink-0 text-[#157A55]" aria-hidden="true" />
                {deliverable}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-[#6B7280]">No deliverables specified.</p>
        )}
      </div>

      {publishInfo?.warnings && publishInfo.warnings.length > 0 && (
        <SpMutationFeedback status="info" className="mt-4">
          <ul className="space-y-1">
            {publishInfo.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </SpMutationFeedback>
      )}

      {publishInfo?.error && publishInfo.needsConfirm && (
        <SpMutationFeedback status="error" className="mt-4">
          <div>
            <p>{publishInfo.error}</p>
            <Button type="button" size="sm" variant="outline" className="mt-3" onClick={onConfirmPublish}>
              Review confirmation
            </Button>
          </div>
        </SpMutationFeedback>
      )}

      <div className="mt-auto flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-5">
        <Button type="button" size="sm" variant="outline" onClick={onEdit}>Edit package</Button>
        {item.status === 'Published' ? (
          <Button type="button" size="sm" variant="outline" onClick={onUnpublish} disabled={pending}>Unpublish</Button>
        ) : (
          <Button type="button" size="sm" onClick={onPublish} disabled={pending}>
            {pending ? 'Updating…' : 'Publish'}
          </Button>
        )}
      </div>
    </SpCard>
  );
}

function formatEnum(value: string) {
  return value.replace(/([a-z])([A-Z])/g, '$1 $2');
}

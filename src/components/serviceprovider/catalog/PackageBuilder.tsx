'use client';

import { useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

type PublishInfo = { pkgId: string; warnings?: string[]; error?: string; needsConfirm?: boolean };

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
  const updatePkg = useUpdatePackage();
  const publish = usePublishPackage();
  const unpublish = useUnpublishPackage();

  const [editingTier, setEditingTier] = useState<PackageType | null>(null);
  const [publishInfo, setPublishInfo] = useState<PublishInfo | null>(null);

  const byTier = (t: PackageType) => packages.find((p) => p.packageType === t);

  const doPublish = async (pkgId: string, confirm = false) => {
    try {
      const res = await publish.mutateAsync([pkgId, { confirmShorterDelivery: confirm }]);
      setPublishInfo({ pkgId, warnings: res.warnings });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Publish failed.';
      setPublishInfo({ pkgId, error: msg, needsConfirm: /confirmation/i.test(msg) });
    }
  };

  if (editingTier) {
    const existing = byTier(editingTier);
    return (
      <PackageEditor
        tier={editingTier}
        existing={existing}
        category={category}
        pending={add.isPending || updatePkg.isPending}
        onCancel={() => setEditingTier(null)}
        onSubmit={async (payload: UpsertServicePackageRequest) => {
          if (existing) await updatePkg.mutateAsync([existing.id, payload]);
          else await add.mutateAsync([listingId, payload]);
          setEditingTier(null);
        }}
      />
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {PACKAGE_TYPES.map((tier) => {
        const pkg = byTier(tier);
        return (
          <Card key={tier} className="flex flex-col">
            <CardHeader className="gap-1">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{tier}</CardTitle>
                {pkg && <Badge variant={pkg.status === 'Published' ? 'success' : 'secondary'}>{pkg.status}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="mt-auto space-y-2">
              {pkg ? (
                <>
                  <p className="text-sm font-medium text-foreground">{pkg.packageTitle || pkg.packageName || 'Untitled'}</p>
                  <p className="text-sm text-muted-foreground">
                    {pkg.currency} {pkg.price} · {pkg.deliveryTimeValue} {pkg.deliveryTimeUnit} ·{' '}
                    {pkg.unlimitedRevisions ? 'Unlimited revisions' : `${pkg.includedRevisionCount} revisions`}
                  </p>
                  {publishInfo?.pkgId === pkg.id && publishInfo.warnings && publishInfo.warnings.length > 0 && (
                    <div className="rounded-md border border-border bg-muted/50 p-2 text-xs text-muted-foreground">
                      {publishInfo.warnings.map((w, i) => <p key={i}>⚠ {w}</p>)}
                    </div>
                  )}
                  {publishInfo?.pkgId === pkg.id && publishInfo.error && (
                    <div className="space-y-1">
                      <p className="inline-flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" /> {publishInfo.error}
                      </p>
                      {publishInfo.needsConfirm && (
                        <Button size="sm" variant="outline" onClick={() => doPublish(pkg.id, true)}>Publish anyway</Button>
                      )}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <Button size="sm" variant="outline" onClick={() => setEditingTier(tier)}>Edit</Button>
                    {pkg.status === 'Published'
                      ? <Button size="sm" variant="outline" onClick={() => unpublish.mutate([pkg.id])}>Unpublish</Button>
                      : <Button size="sm" onClick={() => doPublish(pkg.id)} disabled={publish.isPending}>Publish</Button>}
                  </div>
                </>
              ) : (
                <Button variant="outline" className="w-full" onClick={() => setEditingTier(tier)}>
                  <Plus className="h-4 w-4" /> Add {tier}
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

'use client';

import { Info, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { resolveProviderMediaUrl } from '@/lib/service-provider/provider-media';
import { formatPrice } from '@/lib/marketplace-format';
import { PLATFORM_COMMISSION_RATE, computeCommission } from '@/types/package-purchase';
import type { MarketplaceListingDetail, MarketplacePackage } from '@/lib/api-marketplace';

interface Props {
  listing: MarketplaceListingDetail;
  pkg: MarketplacePackage;
  selectedAddOnNames: string[];
  total: number;
}

/** Persistent order context. Mirrors the UI-R2 package selector card's language. */
export function OrderSummaryWidget({ listing, pkg, selectedAddOnNames, total }: Props) {
  const cover = listing.gallery?.[0]?.url;
  const resolved = cover ? resolveProviderMediaUrl(cover) : null;
  const selectedAddOns = pkg.addOns.filter((a) => selectedAddOnNames.includes(a.name));

  // Display only — the server recomputes the authoritative figure at purchase.
  const providerReceives = total - computeCommission(total);

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="relative mb-4 aspect-video overflow-hidden rounded-lg bg-muted">
        {resolved ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolved} alt={listing.title} className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-8 text-muted-foreground" />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">{listing.provider.displayName}</p>
      <h4 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-foreground">
        {listing.title}
      </h4>
      <Badge variant="secondary" className="mt-2">
        {pkg.tier}
      </Badge>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-muted-foreground">
            {pkg.title || pkg.tier} (base)
          </span>
          <span className="shrink-0 text-foreground">{formatPrice(pkg.price, pkg.currency)}</span>
        </div>

        {selectedAddOns.map((addon) => (
          <div key={addon.name} className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-muted-foreground">{addon.name}</span>
            <span className="shrink-0 text-foreground">
              + {formatPrice(addon.price, pkg.currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-baseline justify-between border-t border-border pt-3">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-xl font-semibold text-foreground">
          {formatPrice(total, pkg.currency)}
        </span>
      </div>

      <p className="mt-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
        <Info className="mr-1 inline-block size-3.5 align-text-bottom" />
        Provider receives {formatPrice(providerReceives, pkg.currency, 2)} after the{' '}
        {Math.round(PLATFORM_COMMISSION_RATE * 100)}% Mondial platform fee.
      </p>
    </div>
  );
}

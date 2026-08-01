'use client';

import { Package } from 'lucide-react';
import { resolveProviderMediaUrl } from '@/lib/service-provider/provider-media';
import { formatPrice } from '@/lib/marketplace-format';
import type { MarketplaceListingDetail, MarketplacePackage } from '@/lib/api-marketplace';

interface Props {
  listing: MarketplaceListingDetail;
  pkg: MarketplacePackage;
  selectedAddOnNames: string[];
  total: number;
}

/** Persistent order context, rendered above every step of the flow. */
export function OrderSummaryWidget({ listing, pkg, selectedAddOnNames, total }: Props) {
  const cover = listing.gallery?.[0]?.url;
  const resolved = cover ? resolveProviderMediaUrl(cover) : null;

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-4">
      <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-md bg-muted">
        {resolved ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resolved} alt={listing.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{listing.title}</p>
        <p className="text-xs text-muted-foreground">
          {pkg.tier} package
          {selectedAddOnNames.length > 0 && ` · ${selectedAddOnNames.length} add-on${selectedAddOnNames.length > 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="text-right">
        <p className="text-xs text-muted-foreground">Total</p>
        <p className="text-lg font-bold text-foreground">{formatPrice(total, pkg.currency)}</p>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Package, Star } from 'lucide-react';
import { resolveProviderMediaUrl } from '@/lib/service-provider/provider-media';
import { formatPrice } from '@/lib/marketplace-format';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { MarketplaceListingCard } from '@/lib/api-marketplace';

function Avatar({
  url,
  name,
  className,
}: {
  url: string | null;
  name: string;
  className: string;
}) {
  const resolved = url ? resolveProviderMediaUrl(url) : null;
  if (resolved) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={resolved} alt={name} className={`${className} rounded-full object-cover`} />;
  }
  return (
    <div
      className={`${className} flex items-center justify-center rounded-full bg-muted font-medium text-muted-foreground`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export function MarketplaceCard({ card }: { card: MarketplaceListingCard }) {
  const cover = card.coverImageUrl ? resolveProviderMediaUrl(card.coverImageUrl) : null;

  return (
    <div className="group overflow-hidden rounded-xl border border-border transition-all duration-200 hover:shadow-md">
      <Link
        href={`/marketplace/services/${card.id}`}
        className="block relative aspect-video overflow-hidden bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={card.title}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <Package className="size-8 text-muted-foreground" />
          </div>
        )}
      </Link>

      <div className="space-y-2.5 p-4">
        {/* Tooltip suppresses itself on touch devices, so no separate mobile path. */}
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            {card.provider.publicSlug ? (
              <Link
                href={`/profile/${card.provider.publicSlug}`}
                className="flex w-fit items-center gap-2 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <Avatar
                  url={card.provider.profileImageUrl}
                  name={card.provider.displayName}
                  className="size-6 text-xs"
                />
                <span className="truncate text-xs font-medium text-foreground hover:underline">
                  {card.provider.displayName}
                </span>
                {card.provider.verified && (
                  <span className="shrink-0 text-xs text-success-text">Verified</span>
                )}
              </Link>
            ) : (
              <div className="flex w-fit items-center gap-2">
                <Avatar
                  url={card.provider.profileImageUrl}
                  name={card.provider.displayName}
                  className="size-6 text-xs"
                />
                <span className="truncate text-xs font-medium text-foreground">
                  {card.provider.displayName}
                </span>
                {card.provider.verified && (
                  <span className="shrink-0 text-xs text-success-text">Verified</span>
                )}
              </div>
            )}
          </TooltipTrigger>
          <TooltipContent side="top" align="start" className="w-56">
            <div className="flex items-center gap-3">
              <Avatar
                url={card.provider.profileImageUrl}
                name={card.provider.displayName}
                className="size-10 text-sm"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{card.provider.displayName}</p>
                {card.provider.verified && (
                  <p className="text-xs text-success-text">Verified provider</p>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {card.provider.publicSlug ? 'View profile' : 'View services'}
            </p>
          </TooltipContent>
        </Tooltip>

        <Link
          href={`/marketplace/services/${card.id}`}
          className="block space-y-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
            {card.title}
          </h3>

          <div className="flex items-center justify-between gap-2">
            {card.rating != null ? (
              <span className="flex items-center gap-1">
                <Star className="size-3 fill-rating text-rating" />
                <span className="text-xs font-medium text-foreground">{card.rating.toFixed(1)}</span>
                {card.reviewCount != null && (
                  <span className="text-xs text-muted-foreground">({card.reviewCount})</span>
                )}
              </span>
            ) : (
              <span />
            )}
            <span className="truncate text-xs text-muted-foreground">{card.category}</span>
          </div>

          <div className="flex items-baseline justify-between gap-2 pt-1">
            <span className="text-xs text-muted-foreground">From</span>
            <span className="text-xs text-muted-foreground">
              <span className="text-base font-bold text-foreground">
                {formatPrice(card.startingPrice, card.currency)}
              </span>
              {' · '}
              {card.deliveryTimeValue} {card.deliveryTimeUnit}
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}

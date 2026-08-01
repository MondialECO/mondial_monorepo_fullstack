'use client';

import { BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ProviderAvatar } from './ProviderAvatar';
import type { MarketplaceListingDetail } from '@/lib/api-marketplace';

const DESKTOP_TAGS = 6;
const MOBILE_TAGS = 3;

export function ListingHeader({ listing }: { listing: MarketplaceListingDetail }) {
  const p = listing.provider;
  const tags = [...(listing.metadataTags ?? []), ...(listing.searchTags ?? [])];
  const shown = tags.slice(0, DESKTOP_TAGS);

  // Every metadata item is conditional — the backend returns null for fields it
  // hasn't computed, and inventing values here would be fake data.
  const meta: string[] = [];
  if (p.trustScore != null) meta.push(`Trust ${p.trustScore.toFixed(1)}/5.0`);
  if (p.completedOrders != null) meta.push(`${p.completedOrders} completed`);
  if (p.medianResponseTime) meta.push(`Responds in ${p.medianResponseTime}`);

  return (
    <header className="mb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Badge variant="secondary" className="rounded-full text-xs">
            {listing.category}
          </Badge>

          <h1 className="mt-3 text-3xl font-bold text-foreground md:text-4xl">{listing.title}</h1>

          {listing.serviceType && (
            <p className="mt-1 text-muted-foreground">{listing.serviceType}</p>
          )}

          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <div className="mt-4 flex w-fit flex-wrap items-center gap-x-2 gap-y-1">
                <ProviderAvatar
                  url={p.profileImageUrl}
                  name={p.displayName}
                  className="size-8 text-sm"
                />
                <span className="font-medium text-foreground">{p.displayName}</span>
                {p.verified && (
                  <Badge variant="success">
                    <BadgeCheck />
                    Verified
                  </Badge>
                )}
                {meta.map((item) => (
                  <span key={item} className="text-sm text-muted-foreground">
                    <span aria-hidden className="mx-1">
                      ·
                    </span>
                    {item}
                  </span>
                ))}
              </div>
            </TooltipTrigger>
            {(p.headline || p.medianResponseTime) && (
              <TooltipContent side="bottom" align="start" className="w-64">
                {p.headline && <p className="text-sm">{p.headline}</p>}
                {p.medianResponseTime && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Typically responds in {p.medianResponseTime}
                  </p>
                )}
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end">
            {shown.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className={`rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground ${
                  i >= MOBILE_TAGS ? 'hidden sm:inline-block' : ''
                }`}
              >
                {tag}
              </span>
            ))}
            {tags.length > MOBILE_TAGS && (
              <span className="px-1 py-1 text-xs text-muted-foreground sm:hidden">
                +{tags.length - MOBILE_TAGS} more
              </span>
            )}
            {tags.length > DESKTOP_TAGS && (
              <span className="hidden px-1 py-1 text-xs text-muted-foreground sm:inline-block">
                +{tags.length - DESKTOP_TAGS} more
              </span>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProviderAvatar } from './ProviderAvatar';
import type { MarketplaceListingDetail } from '@/lib/api-marketplace';

/**
 * Expanded provider section at the foot of the content column. Deliberately
 * has no stats charts or activity feed — those would need backend fields the
 * detail DTO doesn't return, and inventing them would be fake data.
 */
export function ProviderAboutCard({
  provider,
  onMessage,
  messagePending,
}: {
  provider: MarketplaceListingDetail['provider'];
  onMessage: () => void;
  /** True while the conversation is being created, to block a second click. */
  messagePending?: boolean;
}) {
  const meta: string[] = [];
  if (provider.medianResponseTime) meta.push(`Responds in ${provider.medianResponseTime}`);
  if (provider.completedOrders != null) meta.push(`${provider.completedOrders} completed orders`);
  if (provider.trustScore != null) meta.push(`Trust ${provider.trustScore.toFixed(1)}/5.0`);

  return (
    <section className="rounded-xl border border-border p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">About the provider</h2>

      <div className="flex gap-4">
        {provider.publicSlug ? (
          <Link
            href={`/profile/${provider.publicSlug}`}
            className="size-16 shrink-0 transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full"
          >
            <ProviderAvatar
              url={provider.profileImageUrl}
              name={provider.displayName}
              className="size-16 text-lg"
            />
          </Link>
        ) : (
          <ProviderAvatar
            url={provider.profileImageUrl}
            name={provider.displayName}
            className="size-16 shrink-0 text-lg"
          />
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {provider.publicSlug ? (
              <Link
                href={`/profile/${provider.publicSlug}`}
                className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                <h3 className="font-semibold text-foreground">{provider.displayName}</h3>
              </Link>
            ) : (
              <h3 className="font-semibold text-foreground">{provider.displayName}</h3>
            )}
            {provider.verified && (
              <Badge variant="success">
                <BadgeCheck />
                Verified
              </Badge>
            )}
          </div>

          {provider.headline && (
            <p className="mt-1 text-sm text-muted-foreground">{provider.headline}</p>
          )}

          {meta.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">
              {meta.map((item, i) => (
                <span key={item}>
                  {i > 0 && (
                    <span aria-hidden className="mx-1.5">
                      ·
                    </span>
                  )}
                  {item}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {provider.publicSlug && (
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/profile/${provider.publicSlug}`}>View Profile</Link>
          </Button>
        )}
        <Button
          onClick={onMessage}
          disabled={messagePending}
          variant={provider.publicSlug ? 'outline' : 'outline'}
          className="flex-1"
        >
          Contact provider
        </Button>
      </div>
    </section>
  );
}

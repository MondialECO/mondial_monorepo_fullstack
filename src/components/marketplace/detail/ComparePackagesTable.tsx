'use client';

import { Check, MoveHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/marketplace-format';
import type { MarketplacePackage } from '@/lib/api-marketplace';

/**
 * Union of every feature across all tiers, ordered by first appearance
 * (tier 1's included list first, then tier 2's, and so on) and deduplicated
 * case-insensitively. That ordering puts what the cheapest tier considers
 * headline features at the top, which is the comparison a buyer scans first.
 */
function buildFeatureUnion(packages: MarketplacePackage[]): string[] {
  const seen = new Map<string, string>();
  for (const pkg of packages) {
    for (const f of [...pkg.includedFeatures, ...pkg.excludedFeatures]) {
      const key = f.trim().toLowerCase();
      if (key && !seen.has(key)) seen.set(key, f.trim());
    }
  }
  return [...seen.values()];
}

function hasFeature(pkg: MarketplacePackage, feature: string): boolean {
  const key = feature.trim().toLowerCase();
  return pkg.includedFeatures.some((f) => f.trim().toLowerCase() === key);
}

export function ComparePackagesTable({
  packages,
  selectedTier,
  onChooseTier,
}: {
  packages: MarketplacePackage[];
  selectedTier: string;
  onChooseTier: (tier: string) => void;
}) {
  // A single-package service has nothing to compare.
  if (packages.length < 2) return null;

  const features = buildFeatureUnion(packages);
  if (features.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-foreground">Compare packages</h2>

      <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground md:hidden">
        <MoveHorizontal className="size-3.5" />
        Swipe to compare
      </p>

      <div className="-mx-4 w-full overflow-x-auto px-4 md:mx-0 md:px-0">
        <table className="min-w-[560px] border-collapse rounded-xl md:min-w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="w-1/3 px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                <span className="sr-only">Feature</span>
              </th>
              {packages.map((pkg) => (
                <th key={pkg.id} className="px-4 py-3 text-center align-top">
                  <span className="block text-sm font-semibold text-foreground">{pkg.tier}</span>
                  <span className="mt-1 block text-base font-bold text-foreground">
                    {formatPrice(pkg.price, pkg.currency)}
                  </span>
                  <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                    {pkg.deliveryTimeValue} {pkg.deliveryTimeUnit}
                  </span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {pkg.unlimitedRevisions
                      ? 'Unlimited revisions'
                      : `${pkg.includedRevisionCount} revision${pkg.includedRevisionCount === 1 ? '' : 's'}`}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {features.map((feature, i) => (
              <tr key={feature} className={i % 2 === 1 ? 'bg-muted/30' : undefined}>
                <td className="px-4 py-2.5 text-sm text-foreground">{feature}</td>
                {packages.map((pkg) => (
                  <td key={pkg.id} className="px-4 py-2.5 text-center">
                    {hasFeature(pkg, feature) ? (
                      <Check className="mx-auto size-4 text-primary" aria-label="Included" />
                    ) : (
                      <X
                        className="mx-auto size-4 text-muted-foreground"
                        aria-label="Not included"
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="border-t border-border">
              <td className="px-4 py-4" />
              {packages.map((pkg) => (
                <td key={pkg.id} className="px-4 py-4 text-center">
                  <Button
                    size="sm"
                    variant={pkg.tier === selectedTier ? 'default' : 'outline'}
                    onClick={() => onChooseTier(pkg.tier)}
                    className="w-full"
                  >
                    {pkg.tier === selectedTier ? 'Selected' : `Choose ${pkg.tier}`}
                  </Button>
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

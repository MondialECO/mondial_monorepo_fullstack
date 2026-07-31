'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getMarketplaceListings,
  getMarketplaceListingDetail,
  type MarketplaceListingsQuery,
} from '@/lib/api-marketplace';

export const marketplaceKeys = {
  all: ['marketplace'] as const,
  listings: (query: MarketplaceListingsQuery) =>
    [...marketplaceKeys.all, 'listings', query] as const,
  detail: (id: string) =>
    [...marketplaceKeys.all, 'detail', id] as const,
};

export const useMarketplaceListings = (query: MarketplaceListingsQuery = {}) =>
  useQuery({
    queryKey: marketplaceKeys.listings(query),
    queryFn: () => getMarketplaceListings(query),
    staleTime: 60_000,
  });

export const useMarketplaceListingDetail = (listingId: string | null) =>
  useQuery({
    queryKey: marketplaceKeys.detail(listingId ?? ''),
    queryFn: () => getMarketplaceListingDetail(listingId!),
    enabled: !!listingId,
    staleTime: 5 * 60_000,
  });

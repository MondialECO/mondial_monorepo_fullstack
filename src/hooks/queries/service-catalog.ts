'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-service-catalog';
import type {
  PricingGuidance,
  ProviderCapacity,
  ServiceListing,
  ServiceListingDetail,
} from '@/types/service-catalog';

const ROOT = ['serviceCatalog'] as const;
const LISTINGS_KEY = ['serviceCatalog', 'listings'] as const;
const CAPACITY_KEY = ['serviceCatalog', 'capacity'] as const;
const listingKey = (id: string) => ['serviceCatalog', 'listing', id] as const;

export const useServiceListings = () =>
  useQuery<ServiceListing[]>({ queryKey: LISTINGS_KEY, queryFn: api.getListings });

export const useServiceListing = (id: string | null) =>
  useQuery<ServiceListingDetail>({
    queryKey: listingKey(id ?? ''),
    queryFn: () => api.getListing(id as string),
    enabled: !!id,
  });

// All catalog writes touch the listings collection and/or a listing's detail; invalidate
// the whole catalog namespace so lists + open detail views refetch.
function useCatalogMutation<TArgs extends unknown[], TData>(fn: (...args: TArgs) => Promise<TData>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: TArgs) => fn(...args),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROOT }),
  });
}

// Listings
export const useCreateListing = () => useCatalogMutation(api.createListing);
export const useUpdateListing = () =>
  useCatalogMutation((id: string, payload: Parameters<typeof api.updateListing>[1]) => api.updateListing(id, payload));
export const usePublishListing = () => useCatalogMutation(api.publishListing);
export const useUnpublishListing = () => useCatalogMutation(api.unpublishListing);

// Packages
export const useAddPackage = () =>
  useCatalogMutation((listingId: string, payload: Parameters<typeof api.addPackage>[1]) => api.addPackage(listingId, payload));
export const useUpdatePackage = () =>
  useCatalogMutation((id: string, payload: Parameters<typeof api.updatePackage>[1]) => api.updatePackage(id, payload));
export const usePublishPackage = () =>
  useCatalogMutation((id: string, payload: Parameters<typeof api.publishPackage>[1]) => api.publishPackage(id, payload));
export const useUnpublishPackage = () => useCatalogMutation(api.unpublishPackage);

// FAQs
export const useAddFaq = () =>
  useCatalogMutation((listingId: string, payload: Parameters<typeof api.addFaq>[1]) => api.addFaq(listingId, payload));
export const useUpdateFaq = () =>
  useCatalogMutation((id: string, payload: Parameters<typeof api.updateFaq>[1]) => api.updateFaq(id, payload));
export const useDuplicateFaq = () => useCatalogMutation(api.duplicateFaq);
export const usePublishFaq = () => useCatalogMutation(api.publishFaq);
export const useUnpublishFaq = () => useCatalogMutation(api.unpublishFaq);
export const useDeleteFaq = () => useCatalogMutation(api.deleteFaq);
export const useReorderFaqs = () =>
  useCatalogMutation((listingId: string, payload: Parameters<typeof api.reorderFaqs>[1]) => api.reorderFaqs(listingId, payload));

// Capacity
export const useCapacity = () =>
  useQuery<ProviderCapacity>({ queryKey: CAPACITY_KEY, queryFn: api.getCapacity });
export const useUpdateCapacity = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.updateCapacity,
    onSuccess: (data) => {
      qc.setQueryData(CAPACITY_KEY, data);
      qc.invalidateQueries({ queryKey: ['provider-dashboard-overview'] });
    },
  });
};

// Pricing guidance — deterministic; keyed by category (+ optional model).
export const usePricingGuidance = (category: string | null, pricingModel?: string) =>
  useQuery<PricingGuidance>({
    queryKey: ['serviceCatalog', 'pricingGuidance', category ?? '', pricingModel ?? ''],
    queryFn: () => api.getPricingGuidance(category as string, pricingModel),
    enabled: !!category,
  });

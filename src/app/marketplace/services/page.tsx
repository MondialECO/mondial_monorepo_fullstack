'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Star,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import AuthGuard from '@/components/layout/AuthGuard';
import { useMarketplaceListings } from '@/hooks/queries/marketplace';
import type { MarketplaceListingsQuery } from '@/lib/api-marketplace';
import { cn } from '@/lib/utils';

const SERVICE_CATEGORIES = [
  { value: 'Development', label: 'Development' },
  { value: 'Design', label: 'Design' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Accounting', label: 'Accounting' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Strategy', label: 'Strategy' },
  { value: 'DueDiligence', label: 'Due Diligence' },
  { value: 'FundraisingSupport', label: 'Fundraising Support' },
  { value: 'AiAutomation', label: 'AI & Automation' },
  { value: 'HrRecruitment', label: 'HR & Recruitment' },
  { value: 'Other', label: 'Other' },
];

const PRICE_RANGES = [
  { min: 0, max: 500, label: 'Under $500' },
  { min: 500, max: 1500, label: '$500 - $1,500' },
  { min: 1500, max: 5000, label: '$1,500 - $5,000' },
  { min: 5000, max: Infinity, label: 'Over $5,000' },
];

const DELIVERY_TIMES = [
  { days: Infinity, label: 'Any' },
  { days: 1, label: '1 day' },
  { days: 3, label: '3 days' },
  { days: 7, label: '1 week' },
  { days: 14, label: '2 weeks' },
];

export default function MarketplaceGridPage() {
  return (
    <AuthGuard>
      <MarketplaceGridContent />
    </AuthGuard>
  );
}

function MarketplaceGridContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [priceRange, setPriceRange] = useState(searchParams.get('priceRange') ?? '');
  const [deliveryTime, setDeliveryTime] = useState(searchParams.get('deliveryTime') ?? '');
  const [sort, setSort] = useState<'recent' | 'price_asc' | 'price_desc' | 'rating'>(
    (searchParams.get('sort') as any) ?? 'recent'
  );
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1', 10));

  const query: MarketplaceListingsQuery = useMemo(
    () => ({
      page,
      pageSize: 12,
      search: search || undefined,
      category: category || undefined,
      sort,
      ...(priceRange && {
        priceMin: PRICE_RANGES.find((r) => r.label === priceRange)?.min,
        priceMax: PRICE_RANGES.find((r) => r.label === priceRange)?.max,
      }),
      ...(deliveryTime && {
        deliveryTimeMaxDays:
          DELIVERY_TIMES.find((d) => d.label === deliveryTime)?.days,
      }),
    }),
    [page, search, category, sort, priceRange, deliveryTime]
  );

  const { data, isLoading, isError, refetch } = useMarketplaceListings(query);

  const handleResetFilters = useCallback(() => {
    setSearch('');
    setCategory('');
    setPriceRange('');
    setDeliveryTime('');
    setSort('recent');
    setPage(1);
  }, []);

  const handleSearch = useCallback(() => {
    setPage(1);
  }, []);

  const listings = data?.data.items ?? [];
  const total = data?.data.total ?? 0;
  const currentPage = data?.data.page ?? page;
  const pageSize = data?.data.pageSize ?? 12;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Marketplace
          </h1>
          <p className="text-muted-foreground">
            Discover vetted service providers for your business
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          {/* Search */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            <Button onClick={handleSearch} variant="default">
              Search
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label htmlFor="category" className="text-xs font-semibold text-muted-foreground">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-input bg-white px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">All Categories</option>
                {SERVICE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="price" className="text-xs font-semibold text-muted-foreground">
                Price
              </label>
              <select
                id="price"
                value={priceRange}
                onChange={(e) => {
                  setPriceRange(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-input bg-white px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">Any Price</option>
                {PRICE_RANGES.map((range) => (
                  <option key={range.label} value={range.label}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="delivery" className="text-xs font-semibold text-muted-foreground">
                Delivery
              </label>
              <select
                id="delivery"
                value={deliveryTime}
                onChange={(e) => {
                  setDeliveryTime(e.target.value);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-input bg-white px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="">Any Time</option>
                {DELIVERY_TIMES.map((dt) => (
                  <option key={dt.label} value={dt.label}>
                    {dt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="sort" className="text-xs font-semibold text-muted-foreground">
                Sort
              </label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value as any);
                  setPage(1);
                }}
                className="h-9 rounded-md border border-input bg-white px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <option value="recent">Most Recent</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {(search || category || priceRange || deliveryTime || sort !== 'recent') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetFilters}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive text-sm">
            Failed to load marketplace listings.
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              className="ml-2 h-6 px-2"
            >
              Try again
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border overflow-hidden">
                <Skeleton className="aspect-video" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-lg font-medium text-foreground mb-2">
              No services match your filters
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              Try clearing some filters or searching for something different
            </p>
            <Button onClick={handleResetFilters} variant="outline">
              Reset Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
              {listings.map((card) => (
                <Link
                  key={card.id}
                  href={`/marketplace/services/${card.id}`}
                  className="group rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    {card.coverImageUrl ? (
                      <Image
                        src={card.coverImageUrl}
                        alt={card.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No image
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 space-y-3">
                    {/* Provider */}
                    <div className="flex items-center gap-2">
                      {card.provider.profileImageUrl ? (
                        <Image
                          src={card.provider.profileImageUrl}
                          alt={card.provider.displayName}
                          width={24}
                          height={24}
                          className="rounded-full size-6 object-cover"
                        />
                      ) : (
                        <div className="size-6 rounded-full bg-muted" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">
                          {card.provider.displayName}
                        </p>
                        {card.provider.verified && (
                          <p className="text-xs text-primary">Verified</p>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>

                    {/* Category */}
                    <p className="text-xs text-muted-foreground">{card.category}</p>

                    {/* Rating */}
                    {card.rating != null && (
                      <div className="flex items-center gap-1">
                        <Star className="size-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium text-foreground">
                          {card.rating.toFixed(1)}
                        </span>
                        {card.reviewCount != null && (
                          <span className="text-xs text-muted-foreground">
                            ({card.reviewCount})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price & Delivery */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">From</p>
                        <p className="text-sm font-semibold text-foreground">
                          ${card.startingPrice.toFixed(0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Delivery</p>
                        <p className="text-xs font-medium text-foreground">
                          {card.deliveryTimeValue} {card.deliveryTimeUnit}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

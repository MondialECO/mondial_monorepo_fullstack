'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight, Star, Package, SlidersHorizontal } from 'lucide-react';
import { resolveProviderMediaUrl } from '@/lib/service-provider/provider-media';
import { formatPrice } from '@/lib/marketplace-format';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MarketplaceFilters } from '@/components/marketplace/MarketplaceFilters';
import AuthGuard from '@/components/layout/AuthGuard';
import { useMarketplaceListings } from '@/hooks/queries/marketplace';
import type { MarketplaceListingsQuery } from '@/lib/api-marketplace';

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

const PAGE_SIZE = 12;

export default function MarketplaceGridPage() {
  return (
    <AuthGuard>
      <MarketplaceGridContent />
    </AuthGuard>
  );
}

function MarketplaceGridContent() {
  const searchParams = useSearchParams();

  // Initialised from the URL so existing deep links keep working. Filter changes
  // are local state only — the URL is not rewritten (unchanged from the original).
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [category, setCategory] = useState(searchParams.get('category') ?? '');
  const [priceRange, setPriceRange] = useState(searchParams.get('priceRange') ?? '');
  const [deliveryTime, setDeliveryTime] = useState(searchParams.get('deliveryTime') ?? '');
  const [sort, setSort] = useState<'recent' | 'price_asc' | 'price_desc' | 'rating'>(
    (searchParams.get('sort') as 'recent' | 'price_asc' | 'price_desc' | 'rating') ?? 'recent'
  );
  const [page, setPage] = useState(parseInt(searchParams.get('page') ?? '1', 10));
  const [filtersOpen, setFiltersOpen] = useState(false);

  const query: MarketplaceListingsQuery = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      category: category || undefined,
      sort,
      ...(priceRange && {
        priceMin: PRICE_RANGES.find((r) => r.label === priceRange)?.min,
        priceMax: PRICE_RANGES.find((r) => r.label === priceRange)?.max,
      }),
      ...(deliveryTime && {
        deliveryTimeMaxDays: DELIVERY_TIMES.find((d) => d.label === deliveryTime)?.days,
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

  const handleSearch = useCallback(() => setPage(1), []);

  const listings = data?.items ?? [];
  const total = data?.total ?? 0;
  const currentPage = data?.page ?? page;
  const pageSize = data?.pageSize ?? PAGE_SIZE;
  const totalPages = Math.ceil(total / pageSize);

  const hasActiveFilters = !!(search || category || priceRange || deliveryTime || sort !== 'recent');
  const rangeStart = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, total);

  const activeFilterCount = [category, priceRange, deliveryTime].filter(Boolean).length;

  const renderFilters = (onCommit?: () => void) => (
    <MarketplaceFilters
      categories={SERVICE_CATEGORIES}
      priceRanges={PRICE_RANGES}
      deliveryTimes={DELIVERY_TIMES}
      category={category}
      priceRange={priceRange}
      deliveryTime={deliveryTime}
      onCategoryChange={(v) => {
        setCategory(v);
        setPage(1);
      }}
      onPriceRangeChange={(v) => {
        setPriceRange(v);
        setPage(1);
      }}
      onDeliveryTimeChange={(v) => {
        setDeliveryTime(v);
        setPage(1);
      }}
      onReset={handleResetFilters}
      hasActiveFilters={hasActiveFilters}
      onCommit={onCommit}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 py-6 md:px-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
            <p className="mt-1 text-muted-foreground">
              Discover vetted service providers for your business
            </p>
          </div>

          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="shrink-0 lg:hidden">
                <SlidersHorizontal className="mr-2 size-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-2 rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-6">{renderFilters(() => setFiltersOpen(false))}</div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Sticky search */}
      <div className="sticky top-0 z-20 border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search services, categories, or providers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="h-12 rounded-full pl-12 pr-32"
            />
            <Button
              onClick={handleSearch}
              className="absolute right-1 top-1/2 h-10 -translate-y-1/2 rounded-full px-5"
            >
              <Search className="mr-2 size-4" />
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="flex gap-6">
          <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] w-60 shrink-0 self-start lg:block">
            <ScrollArea className="h-full pr-3">{renderFilters()}</ScrollArea>
          </aside>

          <div className="min-w-0 flex-1">
            {isError && (
              <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                Failed to load marketplace listings.
                <Button variant="ghost" size="sm" onClick={() => refetch()} className="ml-2 h-6 px-2">
                  Try again
                </Button>
              </div>
            )}

            {/* Results header */}
            {(isLoading || listings.length > 0) && (
              <div className="mb-4 flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? 'Showing services…'
                    : `Showing ${rangeStart}-${rangeEnd} of ${total} services`}
                </p>
                <select
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value as typeof sort);
                    setPage(1);
                  }}
                  aria-label="Sort results"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="recent">Most Recent</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="overflow-hidden rounded-xl border border-border">
                    <Skeleton className="aspect-video" />
                    <div className="space-y-3 p-4">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border py-12 text-center">
                <p className="mb-2 text-lg font-medium text-foreground">
                  No services match your filters
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Try clearing some filters or searching for something different
                </p>
                <Button onClick={handleResetFilters} variant="outline">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {listings.map((card) => (
                    <Link
                      key={card.id}
                      href={`/marketplace/services/${card.id}`}
                      className="group overflow-hidden rounded-xl border border-border transition-all duration-200 hover:shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      <div className="relative aspect-video overflow-hidden bg-muted">
                        {card.coverImageUrl && resolveProviderMediaUrl(card.coverImageUrl) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveProviderMediaUrl(card.coverImageUrl)!}
                            alt={card.title}
                            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center bg-muted">
                            <Package className="size-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 p-4">
                        <div className="flex items-center gap-2">
                          {card.provider.profileImageUrl &&
                          resolveProviderMediaUrl(card.provider.profileImageUrl) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={resolveProviderMediaUrl(card.provider.profileImageUrl)!}
                              alt={card.provider.displayName}
                              className="size-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                              {card.provider.displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium text-foreground">
                              {card.provider.displayName}
                            </p>
                            {card.provider.verified && (
                              <p className="text-xs text-primary">Verified</p>
                            )}
                          </div>
                        </div>

                        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                          {card.title}
                        </h3>

                        <p className="text-xs text-muted-foreground">{card.category}</p>

                        {card.rating != null && (
                          <div className="flex items-center gap-1">
                            <Star className="size-3 fill-amber-400 text-amber-400" />
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

                        <div className="flex items-center justify-between border-t border-border pt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">From</p>
                            <p className="text-sm font-semibold text-foreground">
                              {formatPrice(card.startingPrice, card.currency)}
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
      </div>
    </div>
  );
}

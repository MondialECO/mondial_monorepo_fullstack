'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface FilterOption {
  label: string;
}

interface Props {
  categories: { value: string; label: string }[];
  priceRanges: FilterOption[];
  deliveryTimes: FilterOption[];
  category: string;
  priceRange: string;
  deliveryTime: string;
  onCategoryChange: (value: string) => void;
  onPriceRangeChange: (value: string) => void;
  onDeliveryTimeChange: (value: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  /** Called after any committed change — lets the mobile Sheet close itself. */
  onCommit?: () => void;
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-foreground">
      {children}
    </h3>
  );
}

/**
 * Price and delivery are rendered as checkboxes but behave single-select: the
 * query shape carries one value per axis, and true multi-select would require a
 * new MarketplaceListingsQuery. Checking a second option replaces the first;
 * checking the active one clears it.
 */
export function MarketplaceFilters({
  categories,
  priceRanges,
  deliveryTimes,
  category,
  priceRange,
  deliveryTime,
  onCategoryChange,
  onPriceRangeChange,
  onDeliveryTimeChange,
  onReset,
  hasActiveFilters,
  onCommit,
}: Props) {
  const commit = (fn: () => void) => {
    fn();
    onCommit?.();
  };

  return (
    <div className="space-y-6">
      <div>
        <GroupLabel>Category</GroupLabel>
        <div className="space-y-0.5">
          <CategoryButton
            label="All Categories"
            active={category === ''}
            onClick={() => commit(() => onCategoryChange(''))}
          />
          {categories.map((cat) => (
            <CategoryButton
              key={cat.value}
              label={cat.label}
              active={category === cat.value}
              onClick={() => commit(() => onCategoryChange(cat.value))}
            />
          ))}
        </div>
      </div>

      <div>
        <GroupLabel>Price</GroupLabel>
        <div className="space-y-2">
          {priceRanges.map((range) => (
            <CheckRow
              key={range.label}
              label={range.label}
              checked={priceRange === range.label}
              onToggle={() =>
                commit(() => onPriceRangeChange(priceRange === range.label ? '' : range.label))
              }
            />
          ))}
        </div>
      </div>

      <div>
        <GroupLabel>Delivery time</GroupLabel>
        <div className="space-y-2">
          {deliveryTimes.map((dt) => (
            <CheckRow
              key={dt.label}
              label={dt.label}
              checked={deliveryTime === dt.label}
              onToggle={() =>
                commit(() => onDeliveryTimeChange(deliveryTime === dt.label ? '' : dt.label))
              }
            />
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={() => commit(onReset)} className="w-full">
          Reset filters
        </Button>
      )}
    </div>
  );
}

function CategoryButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'w-full rounded-md border-l-[3px] border-transparent px-3 py-2 text-left text-sm transition-colors hover:bg-muted',
        active && 'border-primary bg-muted font-semibold text-foreground'
      )}
    >
      {label}
    </button>
  );
}

function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 px-3 text-sm text-foreground">
      <Checkbox checked={checked} onChange={onToggle} />
      {label}
    </label>
  );
}

import React, { ReactNode } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AdminFilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: (e: React.FormEvent) => void;
  filters?: ReactNode;
  actions?: ReactNode;
  hasActiveFilters?: boolean;
  onClearFilters?: () => void;
  className?: string;
}

export function AdminFilterBar({
  searchPlaceholder = "Search records...",
  searchValue,
  onSearchChange,
  onSearchSubmit,
  filters,
  actions,
  hasActiveFilters = false,
  onClearFilters,
  className = "",
}: AdminFilterBarProps) {
  const isControlledSearch = searchValue !== undefined && onSearchChange !== undefined;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(e);
    }
  };

  return (
    <Card className={`border-border/60 shadow-sm bg-card mb-6 ${className}`}>
      <CardContent className="p-3 sm:p-4">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row items-stretch md:items-center gap-3"
        >
          {/* Search Field */}
          {isControlledSearch && (
            <div className="relative flex-1 min-w-[200px]">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 h-9 text-xs sm:text-sm bg-background/60 border-border/80 focus-visible:bg-background"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Filter dropdowns slot */}
          {filters && (
            <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
              {filters}
            </div>
          )}

          {/* Clear Filters button */}
          {hasActiveFilters && onClearFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              <X className="size-3.5" />
              Clear filters
            </Button>
          )}

          {/* Optional Action / Submit buttons */}
          {(onSearchSubmit || actions) && (
            <div className="flex items-center gap-2 ml-auto">
              {onSearchSubmit && (
                <Button type="submit" variant="secondary" size="sm" className="h-9 text-xs flex items-center gap-1.5">
                  <Filter className="size-3.5" />
                  Filter
                </Button>
              )}
              {actions}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

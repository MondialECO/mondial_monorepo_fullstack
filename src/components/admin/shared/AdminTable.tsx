import React, { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminEmptyState } from "./AdminEmptyState";

interface AdminTableProps {
  title?: ReactNode;
  description?: ReactNode;
  badge?: ReactNode;
  headerActions?: ReactNode;
  loading?: boolean;
  loadingRowsCount?: number;
  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pagination?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AdminTable({
  title,
  description,
  badge,
  headerActions,
  loading = false,
  loadingRowsCount = 5,
  empty = false,
  emptyTitle = "No records found",
  emptyDescription,
  pagination,
  children,
  className = "",
}: AdminTableProps) {
  const hasHeader = title || description || headerActions || badge;

  return (
    <Card className={`border-border/60 shadow-sm bg-card overflow-hidden ${className}`}>
      {hasHeader && (
        <CardHeader className="py-3.5 px-4 sm:px-5 border-b border-border/40 flex flex-row items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {title && (
                <CardTitle className="text-sm sm:text-base font-bold text-foreground font-syne truncate">
                  {title}
                </CardTitle>
              )}
              {badge}
            </div>
            {description && (
              <CardDescription className="text-xs text-muted-foreground mt-0.5 truncate">
                {description}
              </CardDescription>
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {headerActions}
            </div>
          )}
        </CardHeader>
      )}

      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: loadingRowsCount }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2">
                <Skeleton className="h-4 w-1/4 rounded" />
                <Skeleton className="h-4 w-1/4 rounded" />
                <Skeleton className="h-4 w-1/6 rounded" />
                <Skeleton className="h-4 w-1/6 rounded" />
              </div>
            ))}
          </div>
        ) : empty ? (
          <div className="p-6">
            <AdminEmptyState title={emptyTitle} description={emptyDescription} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            {children}
          </div>
        )}

        {pagination}
      </CardContent>
    </Card>
  );
}

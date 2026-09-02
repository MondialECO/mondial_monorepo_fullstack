import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  disabled?: boolean;
  className?: string;
}

export function AdminPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize = 20,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  disabled = false,
  className = "",
}: AdminPaginationProps) {
  if (totalPages <= 1 && (!totalCount || totalCount <= pageSize)) {
    return totalCount !== undefined ? (
      <div className={`p-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground ${className}`}>
        <span>Total: <strong className="text-foreground font-semibold">{totalCount.toLocaleString()}</strong> records</span>
        <span>Page 1 of 1</span>
      </div>
    ) : null;
  }

  const startItem = totalCount !== undefined ? Math.min((currentPage - 1) * pageSize + 1, totalCount) : null;
  const endItem = totalCount !== undefined ? Math.min(currentPage * pageSize, totalCount) : null;

  return (
    <div className={`p-3.5 sm:p-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs bg-card/50 ${className}`}>
      <div className="flex items-center gap-3 text-muted-foreground">
        {totalCount !== undefined ? (
          <span>
            Showing <strong className="text-foreground">{startItem}</strong> to{" "}
            <strong className="text-foreground">{endItem}</strong> of{" "}
            <strong className="text-foreground">{totalCount.toLocaleString()}</strong> results
          </span>
        ) : (
          <span>
            Page <strong className="text-foreground">{currentPage}</strong> of{" "}
            <strong className="text-foreground">{totalPages}</strong>
          </span>
        )}

        {onPageSizeChange && (
          <div className="hidden sm:flex items-center gap-1.5 ml-2">
            <span className="text-[11px]">Rows:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => onPageSizeChange(Number(val))}
              disabled={disabled}
            >
              <SelectTrigger className="h-7 w-16 text-xs bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((opt) => (
                  <SelectItem key={opt} value={String(opt)} className="text-xs">
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || disabled}
          className="h-8 px-2.5 text-xs flex items-center gap-1 bg-background"
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="px-2 font-mono text-xs text-muted-foreground">
          {currentPage} / {totalPages}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || disabled}
          className="h-8 px-2.5 text-xs flex items-center gap-1 bg-background"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

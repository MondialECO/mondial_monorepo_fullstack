import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface RoleGridProps {
  children: ReactNode;
  columns?: "1" | "2";
  className?: string;
}

/**
 * 2×2 (or 1-col) grid wrapper for RoleCards.
 * 24px gap matches Figma frame 3664/3665.
 */
export function RoleGrid({
  children,
  columns = "2",
  className,
}: RoleGridProps) {
  return (
    <div
      className={cn(
        "grid w-full gap-6",
        columns === "1" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface DealCardBaseProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}

// Shared structural primitive for any investor-side deal card. Holds the
// typography rhythm, spacing, and hover affordances. Used by:
//   - Discovery feed rows (Screen 1)
//   - Kanban cards (Screen 5)
// Other concerns (match badge, lock state, etc.) are composed by callers.
export default function DealCardBase({
  children,
  className,
  interactive = false,
}: DealCardBaseProps) {
  return (
    <Card
      className={cn(
        "border border-border bg-card text-card-foreground shadow-sm rounded-2xl p-5",
        interactive &&
          "transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring/40",
        className
      )}
    >
      {children}
    </Card>
  );
}

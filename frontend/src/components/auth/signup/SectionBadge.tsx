import { cn } from "@/lib/utils";

/**
 * Small pill label used above page titles (e.g. "ONBOARDING PROTOCOL").
 * Theme-token only. Server component.
 */
export function SectionBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border",
        "bg-muted/60 text-muted-foreground",
        "px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em]",
        className,
      )}
    >
      <span
        className="size-1.5 rounded-full bg-primary"
        aria-hidden="true"
      />
      {children}
    </span>
  );
}

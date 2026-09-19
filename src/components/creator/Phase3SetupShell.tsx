import { cn } from "@/lib/utils";

interface Phase3SetupShellProps {
  children: React.ReactNode;
  compact?: boolean;
  contentClassName?: string;
  description?: string | React.ReactNode;
  descriptionClassName?: string;
  fullWidth?: boolean;
  headerActions?: React.ReactNode;
  headerAlign?: "center" | "left";
  stepEyebrow?: string;
  title: string;
  titleClassName?: string;
}

export function Phase3SetupShell({
  children,
  compact = false,
  contentClassName,
  description,
  descriptionClassName,
  fullWidth = false,
  headerActions,
  headerAlign = "center",
  stepEyebrow,
  title,
  titleClassName,
}: Phase3SetupShellProps) {
  return (
    <div className="flex w-full max-w-full flex-col text-foreground overflow-x-clip">
      <div
        className={cn(
          "w-full max-w-none flex-1 flex flex-col min-w-0",
          compact ? "py-0" : "py-2 sm:py-4",
        )}
      >
        <div
          className={cn(
            headerAlign === "left"
              ? "w-full flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/70 pb-6 text-left"
              : "mx-auto max-w-3xl space-y-3 text-center",
          )}
        >
          <div className="space-y-1.5">
            {stepEyebrow && (
              <span className="text-badge font-semibold uppercase tracking-wider text-muted-foreground font-sans">
                {stepEyebrow}
              </span>
            )}
            <h1 className={cn("text-page-heading font-bold tracking-tight text-foreground font-sans", titleClassName)}>
              {title}
            </h1>
            {description && (
              typeof description === "string" ? (
                <p className={cn(headerAlign === "left" ? "text-body font-sans text-muted-foreground pt-0.5" : "text-body leading-relaxed text-muted-foreground", descriptionClassName)}>
                  {description}
                </p>
              ) : (
                description
              )
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 shrink-0 pb-0.5">
              {headerActions}
            </div>
          )}
        </div>

        <div className={cn("mt-6 space-y-8 w-full min-w-0", contentClassName)}>{children}</div>
      </div>
    </div>
  );
}


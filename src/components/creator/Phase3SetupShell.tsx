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
    <div className="flex min-h-screen w-full flex-col bg-muted/30 dark:bg-background text-foreground px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <main
        className={cn(
          "mx-auto flex w-full flex-1 flex-col",
          compact ? "py-0" : "py-4 lg:py-6",
          fullWidth
            ? "max-w-6xl"
            : "max-w-5xl",
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

        <div className={cn("mt-6 space-y-8", contentClassName)}>{children}</div>
      </main>
    </div>
  );
}


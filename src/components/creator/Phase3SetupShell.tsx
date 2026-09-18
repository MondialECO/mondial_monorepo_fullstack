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
    <div className="flex min-h-screen w-full flex-col bg-muted/40 text-foreground px-5 py-12 sm:px-8 lg:py-16">
      <main
        className={cn(
          "mx-auto flex w-full flex-1 flex-col",
          compact ? "py-0" : "py-12 lg:py-16",
          fullWidth
            ? "max-w-none px-0"
            : "max-w-[1140px] px-5 sm:px-8",
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
              <span className="text-xs font-mono font-medium uppercase tracking-wider text-muted-foreground">
                {stepEyebrow}
              </span>
            )}
            <h1 className={cn("text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-sans", titleClassName)}>
              {title}
            </h1>
            {description && (
              typeof description === "string" ? (
                <p className={cn(headerAlign === "left" ? "text-xs font-mono text-muted-foreground pt-0.5" : "text-sm leading-7 text-muted-foreground sm:text-base", descriptionClassName)}>
                  {description}
                </p>
              ) : (
                description
              )
            )}
          </div>
          {headerActions && (
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
            </div>
          )}
        </div>

        <div className={cn("mt-8 space-y-8", contentClassName)}>{children}</div>
      </main>
    </div>
  );
}


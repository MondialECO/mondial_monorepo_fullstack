import { cn } from "@/lib/utils";

interface Phase3SetupShellProps {
  children: React.ReactNode;
  compact?: boolean;
  contentClassName?: string;
  description: string;
  fullWidth?: boolean;
  headerAlign?: "center" | "left";
  stepEyebrow: string;
  title: string;
  titleClassName?: string;
}

export function Phase3SetupShell({
  children,
  compact = false,
  contentClassName,
  description,
  fullWidth = false,
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
              ? "w-full space-y-2 text-left"
              : "mx-auto max-w-3xl space-y-3 text-center",
          )}
        >
          {stepEyebrow && <span className="text-xs font-bold uppercase tracking-wider text-primary">{stepEyebrow}</span>}
          <h1 className={cn("text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl", titleClassName)}>{title}</h1>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
        </div>

        <div className={cn("mt-12 space-y-8", contentClassName)}>{children}</div>
      </main>
    </div>
  );
}

import { cn } from "@/lib/utils";

interface SignupTitleProps {
  badge?: string;
  title: string;
  subtitle: string;
  className?: string;
}

/**
 * Hero block for signup screens — Figma frame 3697.
 * Pill badge ("ONBOARDING PROTOCOL") + h1 title + subtitle, all centered.
 */
export function SignupTitle({
  badge,
  title,
  subtitle,
  className,
}: SignupTitleProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4 text-center", className)}>
      {badge && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full",
            "border border-primary/15 bg-primary/5",
            "px-4 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary",
          )}
        >
          {badge}
        </span>
      )}
      <h1 className="text-balance text-3xl font-semibold leading-10 tracking-tight text-foreground sm:text-[32px]">
        {title}
      </h1>
      <p className="max-w-md text-balance text-base font-normal leading-6 text-muted-foreground">
        {subtitle}
      </p>
    </div>
  );
}

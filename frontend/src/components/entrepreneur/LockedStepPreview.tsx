import { Lock, LucideIcon } from "lucide-react";

/**
 * Dimmed preview of the next locked step (Figma 2.1 / 2.2 / 2.3 footer cards).
 * Purely visual; doesn't link anywhere.
 */
export interface LockedStepPreviewProps {
  step: number;
  title: string;
  subtitle: string;
  icon?: LucideIcon;
}

export default function LockedStepPreview({ step, title, subtitle, icon: Icon }: LockedStepPreviewProps) {
  return (
    <div
      className="rounded-2xl border border-border bg-card/40 px-6 py-5 flex items-center gap-4 opacity-70"
      aria-disabled
    >
      <span className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-semibold flex-shrink-0">
        {step}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
      <span className="w-9 h-9 rounded-full bg-muted text-muted-foreground flex items-center justify-center flex-shrink-0">
        {Icon ? <Icon className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
      </span>
    </div>
  );
}

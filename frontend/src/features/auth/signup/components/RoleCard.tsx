import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoleCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  isSelected?: boolean;
  onClick?: (id: string) => void;
  disabled?: boolean;
}

/**
 * Variant A — Figma node 20566:22718.
 * 343×184 card: square icon tile (top-left) + title + subtitle.
 * Selection state shown via primary border + subtle bg tint.
 * Theme-token only, dark-mode safe.
 */
export function RoleCard({
  id,
  title,
  description,
  icon: Icon,
  isSelected = false,
  onClick,
  disabled = false,
}: RoleCardProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onClick?.(id)}
      disabled={disabled}
      aria-pressed={isSelected}
      className={cn(
        "group relative flex h-full min-h-[184px] w-full flex-col justify-between gap-10",
        "rounded-2xl border-2 bg-card px-6 pt-5 pb-6 text-left shadow-sm",
        "transition-all duration-200",
        "hover:border-primary/40 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
        "disabled:pointer-events-none disabled:opacity-50",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border",
      )}
    >
      <span
        className={cn(
          "inline-flex size-12 items-center justify-center rounded-lg",
          "bg-muted text-primary transition-colors",
          "group-hover:bg-primary/10",
          isSelected && "bg-primary/10",
        )}
        aria-hidden="true"
      >
        <Icon className="size-6" strokeWidth={2} />
      </span>

      <span className="flex flex-col gap-1">
        <span className="text-xl font-medium leading-7 text-foreground">
          {title}
        </span>
        <span className="text-sm font-normal leading-5 text-muted-foreground">
          {description}
        </span>
      </span>
    </button>
  );
}

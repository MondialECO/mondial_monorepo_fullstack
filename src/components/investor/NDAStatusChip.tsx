import { Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface NDAStatusChipProps {
  ndaRequired: boolean;
  ndaAccepted: boolean;
  className?: string;
}

export default function NDAStatusChip({
  ndaRequired,
  ndaAccepted,
  className,
}: NDAStatusChipProps) {
  if (!ndaRequired) return null;
  if (ndaAccepted) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary border border-primary/30",
          className
        )}
      >
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        NDA Signed
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground border border-border",
        className
      )}
    >
      <Lock className="h-3.5 w-3.5" aria-hidden />
      NDA Required
    </span>
  );
}

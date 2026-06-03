import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NDALockedPanelProps {
  title?: string;
  message?: string;
  onSignNda?: () => void;
  className?: string;
}

export default function NDALockedPanel({
  title = "Sign the NDA to unlock",
  message = "This section reveals sensitive material. Sign the data-room NDA to gain immediate access.",
  onSignNda,
  className,
}: NDALockedPanelProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-10 px-6 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Lock className="h-5 w-5 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="mb-1 text-base font-semibold text-foreground">{title}</h3>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      {onSignNda ? (
        <Button className="mt-5" onClick={onSignNda}>
          Sign NDA &amp; Get Access
        </Button>
      ) : null}
    </div>
  );
}

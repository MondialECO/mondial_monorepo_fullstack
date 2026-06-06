import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Loader2, AlertCircle, Eye } from "lucide-react";
import type { AiSessionStatus } from "@/types/creator/ai";

const MAP: Record<
  AiSessionStatus,
  {
    label: string;
    variant: "default" | "secondary" | "success" | "warning" | "info" | "destructive";
    icon: typeof Clock;
    spin?: boolean;
  }
> = {
  Pending: { label: "Pending", variant: "secondary", icon: Clock },
  Processing: { label: "Processing", variant: "info", icon: Loader2, spin: true },
  Completed: { label: "Completed", variant: "success", icon: CheckCircle2 },
  NeedsReview: { label: "Needs Review", variant: "warning", icon: Eye },
  Failed: { label: "Failed", variant: "destructive", icon: AlertCircle },
};

export function AiStatusBadge({ status }: { status?: AiSessionStatus | null }) {
  if (!status) {
    return (
      <Badge variant="secondary" className="px-2.5 py-1 font-semibold">
        Not started
      </Badge>
    );
  }
  const { label, variant, icon: Icon, spin } = MAP[status];
  return (
    <Badge variant={variant} className="px-2.5 py-1 font-semibold">
      <Icon className={spin ? "animate-spin" : undefined} />
      {label}
    </Badge>
  );
}

export default AiStatusBadge;

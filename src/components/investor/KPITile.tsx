import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

interface KPITileProps {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sublabel?: string;
  className?: string;
}

export default function KPITile({ icon: Icon, label, value, sublabel, className }: KPITileProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-2xl border border-border p-5 shadow-sm flex flex-col justify-between min-h-[120px]",
        className
      )}
    >
      <div className="inline-flex items-center gap-2">
        <div className="p-1.5 bg-primary/10 rounded-md">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
          {label}
        </div>
      </div>
      <div>
        <div className="text-foreground text-2xl font-bold tabular-nums">{value}</div>
        {sublabel ? (
          <div className="text-muted-foreground text-xs mt-1">{sublabel}</div>
        ) : null}
      </div>
    </div>
  );
}

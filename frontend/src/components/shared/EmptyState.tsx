import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  message: string;
  maxWidth?: string;
}

export default function EmptyState({
  icon: Icon,
  emoji,
  title,
  message,
  maxWidth = "max-w-2xl",
}: EmptyStateProps) {
  return (
    <div className={`text-center py-16 bg-card rounded-lg border border-dashed border-border mx-auto ${maxWidth}`}>
      <div className="mb-4 flex justify-center">
        <div className="h-12 w-12 rounded-full bg-muted dark:bg-slate-800 flex items-center justify-center">
          {emoji ? (
            <span className="text-xl">{emoji}</span>
          ) : Icon ? (
            <Icon className="h-6 w-6 text-muted-foreground" />
          ) : null}
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-sm mx-auto">{message}</p>
    </div>
  );
}

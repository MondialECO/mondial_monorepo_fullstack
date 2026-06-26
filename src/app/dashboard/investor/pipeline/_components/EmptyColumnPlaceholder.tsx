import { Inbox } from "lucide-react";

interface EmptyColumnPlaceholderProps {
  label?: string;
}

export default function EmptyColumnPlaceholder({
  label = "No deals in this stage",
}: EmptyColumnPlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 py-8 px-4 text-center">
      <Inbox className="mb-2 h-5 w-5 text-muted-foreground" aria-hidden />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

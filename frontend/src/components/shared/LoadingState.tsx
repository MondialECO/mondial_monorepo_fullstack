import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  message?: string;
  minHeight?: string;
}

export default function LoadingState({
  message = "Loading...",
  minHeight = "min-h-[50vh]",
}: LoadingStateProps) {
  return (
    <div className={`w-full max-w-7xl mx-auto flex flex-col items-center justify-center ${minHeight} gap-4`}>
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      {message && <p className="text-muted-foreground text-sm">{message}</p>}
    </div>
  );
}

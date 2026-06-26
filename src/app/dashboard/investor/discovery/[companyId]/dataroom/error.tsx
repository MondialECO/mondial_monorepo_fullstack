"use client";

import ErrorState from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DataRoomError({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className="w-full max-w-[1280px] mx-auto space-y-4 pb-8">
      <ErrorState
        title="Something went wrong"
        message={error?.message ?? "Couldn't render the data room."}
      />
      <div className="flex justify-center">
        <Button variant="outline" onClick={reset}>
          Try again
        </Button>
      </div>
    </div>
  );
}

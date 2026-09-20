"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BrandStudioShell } from "@/components/creator/brand-kit/BrandStudioShell";
import { Loader2 } from "lucide-react";

function BrandStudioContent() {
  const searchParams = useSearchParams();
  const ideaId = searchParams.get("ideaId") || undefined;

  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      <BrandStudioShell ideaId={ideaId} />
    </div>
  );
}

export default function BrandStudioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-full min-h-0 flex-1 w-full items-center justify-center bg-[#EFEFF1]">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      }
    >
      <BrandStudioContent />
    </Suspense>
  );
}

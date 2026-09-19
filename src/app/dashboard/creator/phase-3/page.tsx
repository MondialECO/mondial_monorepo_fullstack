"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { withIdeaContext } from "@/lib/creator-routes";

// Canonical Phase 3 starts at Step 3.1: Market Study.
// This root redirects bookmarks, Phase 2 completion, and phase navigation here with ideaId preserved.
export default function Phase3IndexPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaId = searchParams.get("ideaId");

  useEffect(() => {
    router.replace(withIdeaContext("/dashboard/creator/phase-3/market-study", ideaId));
  }, [router, ideaId]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen items-center justify-center gap-3 bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Entering Step 3.1: Market Intelligence...</p>
    </div>
  );
}


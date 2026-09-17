"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

// Canonical Phase 3 starts at Step 3.1: Market Study.
// This root redirects bookmarks, Phase 2 completion, and phase navigation here.
export default function Phase3IndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/creator/phase-3/market-study");
  }, [router]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen items-center justify-center gap-3 bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Entering Step 3.1: Market Study...</p>
    </div>
  );
}

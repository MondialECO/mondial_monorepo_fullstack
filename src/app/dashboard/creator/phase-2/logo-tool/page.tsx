"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { withIdeaContext } from "@/lib/creator-routes";

export default function AILogoToolPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaId = searchParams.get("ideaId");

  useEffect(() => {
    router.replace(withIdeaContext("/dashboard/creator/phase-2/brand-studio", ideaId));
  }, [router, ideaId]);

  return (
    <div className="w-full flex-1 flex flex-col items-center justify-center min-h-screen p-4 bg-background text-foreground gap-3">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-xs text-muted-foreground font-sans">Redirecting to Brand Identity Studio…</p>
    </div>
  );
}


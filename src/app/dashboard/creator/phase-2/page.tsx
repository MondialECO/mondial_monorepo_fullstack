"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { Loader2 } from "lucide-react";
import { withIdeaContext } from "@/lib/creator-routes";

export default function Phase2EntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ideaId = searchParams.get("ideaId");
  const { setEntryPath, updateProject } = useCreatorProgress();

  useEffect(() => {
    setEntryPath("already_have_idea");
    updateProject({ exists: true });
    router.replace(withIdeaContext("/dashboard/creator/phase-2/clarifier", ideaId));
  }, [router, setEntryPath, updateProject, ideaId]);

  return (
    <div
      className="w-full flex-1 flex flex-col min-h-screen items-center justify-center gap-3"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Entering Idea Clarifier...</p>
    </div>
  );
}


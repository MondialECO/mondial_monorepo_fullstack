"use client";

import { useRouter } from "next/navigation";
import { Lightbulb, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";

export default function SmartGatePage() {
  const router = useRouter();
  const { setEntryPath, updateProject } = useCreatorProgress();

  // Single entry path — the discovery path was removed. Tapping the card sets
  // selectedEntryPath = "already_have_idea" and routes straight to the clarifier.
  const handleStart = () => {
    setEntryPath("already_have_idea");
    updateProject({ exists: true });
    router.push("/dashboard/creator/phase-2/clarifier");
  };

  return (
    <div className="w-full flex-1 flex flex-col bg-background text-foreground min-h-screen">
      <header className="flex items-center justify-between border-b border-border bg-card/50 backdrop-blur-xs px-6 py-4">
        <Button
          variant="ghost"
          onClick={() => router.push("/dashboard/creator/myideas")}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to My Idea
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" />
          Phase 2 of 6
        </div>
      </header>

      <div className="h-[3px] w-full bg-muted">
        <div className="h-full bg-primary" style={{ width: "14%" }} />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 md:p-16 text-center max-w-4xl mx-auto w-full">
        <div className="space-y-4 mb-12 max-w-2xl">
          <div className="text-xs font-bold text-primary uppercase tracking-wider">Project Identity</div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Let&apos;s sharpen your idea
          </h1>
          <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
            Welcome back, Founder. The AI Idea Clarifier asks a few focused questions, then
            structures your concept into a clear problem, audience, and solution.
          </p>
        </div>

        <div className="w-full max-w-[460px] mb-12">
          <Card
            onClick={handleStart}
            className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 text-left transition-all duration-300 cursor-pointer hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5"
          >
            <CardContent className="p-0 flex flex-col justify-between h-full min-h-[240px]">
              <div className="space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Lightbulb className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-foreground sm:text-xl">AI Idea Clarifier</h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                    Have a concept in mind? We&apos;ll use structured logic to sharpen your value
                    proposition and score its clarity.
                  </p>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block font-semibold uppercase tracking-wider mb-4">
                  About 15 minutes · Strategic focus
                </span>
                <Button className="group w-full rounded-xl py-5 text-xs font-bold sm:text-sm bg-primary text-primary-foreground hover:bg-primary/95">
                  Let&apos;s sharpen it
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

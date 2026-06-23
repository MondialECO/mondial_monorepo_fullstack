"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Wand2, ShieldCheck, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { creatorJourneyApi } from "@/lib/api-creator-journey";

export default function BrandingOptionsPage() {
  const router = useRouter();
  const [skipping, setSkipping] = useState(false);

  // Skip → branding "pending" (valid completion state; never blocks Phase 2/3).
  const handleSkip = async () => {
    setSkipping(true);
    try {
      await creatorJourneyApi.skipBranding();
      router.push("/dashboard/creator/phase-2/complete");
    } catch {
      setSkipping(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/creator/phase-2/concept-name")} className="gap-2 text-xs font-semibold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> Branding
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full p-6">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight">Give your idea a face</h1>
          <p className="text-sm text-muted-foreground">Hire a vetted designer or generate a logo yourself. You can also skip for now.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card onClick={() => router.push("/dashboard/creator/phase-2/hire-designer")} className="cursor-pointer rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:-translate-y-0.5 transition-all">
            <CardContent className="p-0 space-y-4 min-h-[200px] flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-6 w-6" /></div>
                <h3 className="text-lg font-bold">Hire an M50 Designer</h3>
                <p className="text-sm text-muted-foreground">Work with a verified designer. We&apos;ll open a workroom and brief them for you.</p>
              </div>
              <span className="text-xs font-semibold text-primary inline-flex items-center gap-1">Recommended <ArrowRight className="h-3 w-3" /></span>
            </CardContent>
          </Card>

          <Card onClick={() => router.push("/dashboard/creator/phase-2/logo-tool")} className="cursor-pointer rounded-2xl border border-border bg-card p-6 hover:border-primary/40 hover:-translate-y-0.5 transition-all">
            <CardContent className="p-0 space-y-4 min-h-[200px] flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><Wand2 className="h-6 w-6" /></div>
                <h3 className="text-lg font-bold">Use the AI Logo Tool</h3>
                <p className="text-sm text-muted-foreground">Generate a logo from your name and sector — pick a style, palette, and font.</p>
              </div>
              <span className="text-xs font-semibold text-primary inline-flex items-center gap-1">Generate now <ArrowRight className="h-3 w-3" /></span>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <button onClick={handleSkip} disabled={skipping} className="text-sm text-muted-foreground hover:text-foreground underline inline-flex items-center gap-2">
            {skipping && <Loader2 className="h-4 w-4 animate-spin" />} Skip branding for now
          </button>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sparkles, ArrowRight, ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import { creatorJourneyApi } from "@/lib/api-creator-journey";

const GENERIC = ["hub", "app", "pro", "platform"];

export default function ConceptNamePage() {
  const router = useRouter();
  const { state, updateProject, completeStep } = useCreatorProgress();
  const { project } = state;

  const [name, setName] = useState(project.name || "");
  const [who, setWho] = useState(project.targetUser || "");
  const [what, setWhat] = useState(project.solution || "");
  const [how, setHow] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingNames, setLoadingNames] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);

  const validateName = (v: string): string | null => {
    const t = v.trim();
    if (!t) return "Name is required.";
    if (t.length > 60) return "Name must be 60 characters or fewer.";
    if (GENERIC.includes(t.toLowerCase())) return `"${t}" is too generic — choose a distinctive name.`;
    return null;
  };

  const handleGenerate = async () => {
    setLoadingNames(true);
    setLimitMsg(null);
    try {
      const concept = [what, who].filter(Boolean).join(" for ") || project.concept || name || "my idea";
      const { names } = await creatorJourneyApi.nameSuggestions(concept);
      setSuggestions(names);
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 429) {
        setLimitMsg("Maximum name suggestion attempts reached.");
      } else {
        setLimitMsg(e instanceof Error ? e.message : "Couldn't generate suggestions.");
      }
    } finally {
      setLoadingNames(false);
    }
  };

  const pitch = `We help ${who || "…"} to ${what || "…"} by ${how || "…"}`;
  const canContinue = !validateName(name) && (who.trim() !== "" || what.trim() !== "");

  const handleContinue = () => {
    const err = validateName(name);
    if (err) { setNameError(err); return; }
    updateProject({
      name: name.trim(),
      targetUser: who.trim(),
      solution: what.trim() || project.solution,
      tagline: pitch,
    });
    completeStep(2, 8);
    router.push("/dashboard/creator/phase-2/branding");
  };

  return (
    <div className="w-full min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-card/50 px-6 py-4">
        <Button variant="ghost" onClick={() => router.push("/dashboard/creator/phase-2/idea-summary")} className="gap-2 text-xs font-semibold text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Sparkles className="h-3 w-3" /> Concept &amp; Name
        </div>
      </header>

      <main className="max-w-5xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Name */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <label className="text-sm font-semibold text-foreground">Project name</label>
            <input
              value={name}
              maxLength={60}
              onChange={(e) => { setName(e.target.value); setNameError(validateName(e.target.value)); }}
              placeholder="e.g. Brandly"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{name.length}/60</span>
              {nameError && <span className="text-xs text-destructive">{nameError}</span>}
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loadingNames} className="gap-2">
                {loadingNames ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Generate suggestions
              </Button>
              {limitMsg && <p className="text-xs text-destructive mt-2">{limitMsg}</p>}
              {suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setName(s); setNameError(validateName(s)); }}
                      className="rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:border-primary hover:text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pitch builder */}
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <label className="text-sm font-semibold text-foreground">Pitch builder</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input value={who} onChange={(e) => setWho(e.target.value)} placeholder="who" className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="what" className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <input value={how} onChange={(e) => setHow(e.target.value)} placeholder="how" className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Live Preview</div>
            <div className="rounded-xl bg-muted/40 p-4">
              <div className="text-lg font-extrabold text-foreground">{name || "Your name"}</div>
              <p className="text-sm text-muted-foreground mt-1">{pitch}</p>
            </div>
          </div>
          <Button onClick={handleContinue} disabled={!canContinue} className="w-full gap-2">
            Continue to Branding <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

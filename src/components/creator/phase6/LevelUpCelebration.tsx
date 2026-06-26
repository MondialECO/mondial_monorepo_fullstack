"use client";

import { useState } from "react";
import { Rocket, Lightbulb, ArrowRight, Loader2, AlertTriangle, BarChart3, Users, Coins, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { creatorJourneyApi } from "@/lib/api-creator-journey";

const UNLOCKS = [
  { icon: BarChart3, label: "Investor Dashboard" },
  { icon: Users, label: "Smart Matchmaking" },
  { icon: Coins, label: "Equity Management" },
  { icon: FileText, label: "Deal Room" },
];

export function LevelUpCelebration({ onDone, onCancel }: { onDone: (redirect: string) => void; onCancel: () => void }) {
  const [phase, setPhase] = useState<"intro" | "working" | "done">("intro");
  const [missing, setMissing] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trigger = async () => {
    setPhase("working"); setMissing(null); setError(null);
    try {
      const res = await creatorJourneyApi.levelUp();
      setPhase("done");
      // Brief celebration, then route (also fired via SignalR LevelUpComplete).
      setTimeout(() => onDone(res.redirectTo || "/dashboard/entrepreneur"), 1600);
    } catch (e) {
      const err = e as { response?: { status?: number; data?: { data?: { missing?: string[] }; message?: string } } };
      if (err.response?.status === 422) {
        setMissing(err.response.data?.data?.missing ?? []);
      } else {
        setError(err.response?.data?.message ?? (e instanceof Error ? e.message : "Level up failed."));
      }
      setPhase("intro");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="max-w-lg w-full text-center space-y-8">
        {phase === "done" ? (
          <div className="space-y-4">
            <div className="text-5xl">🚀</div>
            <h1 className="text-3xl font-extrabold">Welcome, Entrepreneur</h1>
            <p className="text-white/70">Redirecting to your new dashboard…</p>
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-4 text-2xl font-bold">
              <span className="inline-flex items-center gap-2 text-white/60"><Lightbulb className="h-6 w-6" /> Creator</span>
              <ArrowRight className="h-6 w-6 text-primary" />
              <span className="inline-flex items-center gap-2 text-primary"><Rocket className="h-6 w-6" /> Entrepreneur <CheckCircle2 className="h-5 w-5" /></span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold">Level Up</h1>
              <p className="text-white/70 mt-2">This is permanent. You&apos;ll transition to the Entrepreneur experience with your company and raise carried forward.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {UNLOCKS.map((u) => (
                <div key={u.label} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                  <u.icon className="h-4 w-4 text-primary" /> {u.label}
                </div>
              ))}
            </div>

            {missing && (
              <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm text-warning text-left">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <p>Not ready yet — still needed: <strong>{missing.map((m) => m.replace(/_/g, " ")).join(", ") || "complete Phase 5 (Build path + seed funding)"}</strong>.</p>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center justify-center gap-3">
              <Button variant="ghost" onClick={onCancel} className="text-white/70 hover:text-white hover:bg-white/10">Not yet</Button>
              <Button onClick={trigger} disabled={phase === "working"} className="gap-2">
                {phase === "working" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Confirm Level Up
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

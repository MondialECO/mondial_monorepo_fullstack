"use client";

import { useState } from "react";
import { Rocket, Lightbulb, ArrowRight, Loader2, AlertTriangle, BarChart3, Users, Coins, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { creatorJourneyApi } from "@/lib/api-creator-journey";
import { useAuth } from "@/app/_providers/AuthProvider";

const UNLOCKS = [
  { icon: BarChart3, label: "Entrepreneur workspace" },
  { icon: Users, label: "Company profile" },
  { icon: Coins, label: "Company ownership setup" },
  { icon: FileText, label: "Your planning stays linked" },
];

// ---- Confetti (hand-rolled, zero-dependency) --------------------------------
// One-shot DOM burst: ~36 divs animated by a single CSS keyframe with randomized
// per-particle custom properties. Transform/opacity only (compositor-friendly),
// `forwards` fill (no loop, self-terminating), pointer-events-none (never blocks),
// and the whole layer unmounts with the overlay at navigation — nothing lingers.
// Theme tokens only, no hex (design rule).

const CONFETTI_COLORS = [
  "var(--primary)", "var(--chart-1)", "var(--chart-2)",
  "var(--chart-4)", "var(--chart-5)", "var(--warning)",
];

type Particle = {
  dx: number; dy: number; rot: number; dur: number; delay: number;
  w: number; h: number; color: string; round: boolean;
};

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const dist = 140 + Math.random() * 240;
    return {
      dx: Math.cos(angle) * dist,
      // Burst outward, then gravity wins — final y is always downward.
      dy: Math.abs(Math.sin(angle)) * dist * 0.4 + 180 + Math.random() * 160,
      rot: (Math.random() - 0.5) * 720,
      dur: 900 + Math.random() * 700,
      delay: Math.random() * 150,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      round: Math.random() < 0.3,
    };
  });
}

function ConfettiBurst() {
  // Generated ONCE at done-mount (lazy initializer — re-renders never regenerate).
  // Reduced-motion → no particles at all; the static celebration stands alone.
  const [particles] = useState<Particle[]>(() =>
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? []
      : makeParticles(36),
  );
  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <style>{`
        @keyframes lvlup-confetti {
          0%   { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          35%  { transform: translate(calc(var(--dx) * 0.7), calc(var(--dy) * -0.18)) rotate(calc(var(--rot) * 0.4)); opacity: 1; }
          100% { transform: translate(var(--dx), var(--dy)) rotate(var(--rot)); opacity: 0; }
        }
      `}</style>
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-[40%] block"
          style={{
            width: p.w,
            height: p.h,
            backgroundColor: p.color,
            borderRadius: p.round ? "9999px" : "2px",
            ["--dx" as string]: `${p.dx}px`,
            ["--dy" as string]: `${p.dy}px`,
            ["--rot" as string]: `${p.rot}deg`,
            animation: `lvlup-confetti ${p.dur}ms cubic-bezier(0.16, 0.8, 0.4, 1) ${p.delay}ms forwards`,
            opacity: 0, // invisible until its (delayed) animation starts
          }}
        />
      ))}
    </div>
  );
}

export function LevelUpCelebration({ onDone, onCancel, ideaId }: { onDone: (redirect: string) => void; onCancel: () => void; ideaId: string | null }) {
  const { refreshAuthMe } = useAuth();
  const [phase, setPhase] = useState<"intro" | "working" | "done">("intro");
  const [missing, setMissing] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trigger = async () => {
    setPhase("working"); setMissing(null); setError(null);
    try {
      const res = await creatorJourneyApi.levelUp(ideaId ?? undefined);
      await refreshAuthMe();
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
            {/* Fires ONLY here: "done" is reachable solely via a successful levelUp()
                (422/error reset to intro). One-shot, self-terminating, unmounts at nav. */}
            <ConfettiBurst />
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
              <p className="text-white/70 mt-2">Your existing project, planning, and Creator history stay linked as you enter the Entrepreneur workspace.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {UNLOCKS.map((u) => (
                <div key={u.label} className="flex items-center gap-2.5 p-3 rounded-lg bg-white/5 border border-white/10 text-left text-sm font-medium text-white/90">
                  <u.icon className="h-4 w-4 text-primary shrink-0" />
                  <span>{u.label}</span>
                </div>
              ))}
            </div>

            {missing && missing.length > 0 && (
              <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm text-left">
                <p className="font-semibold mb-1 flex items-center gap-1.5"><AlertTriangle className="h-4 w-4 shrink-0" /> Incomplete items</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs opacity-90">
                  {missing.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </div>
            )}

            {error && (
              <p className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm text-left flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={onCancel} disabled={phase === "working"} className="text-white/70 hover:text-white hover:bg-white/10">
                Cancel
              </Button>
              <Button onClick={trigger} disabled={phase === "working"} className="gap-2 font-semibold">
                {phase === "working" ? <><Loader2 className="h-4 w-4 animate-spin" /> Upgrading…</> : <><Rocket className="h-4 w-4" /> Confirm Level Up</>}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

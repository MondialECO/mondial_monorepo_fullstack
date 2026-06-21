'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/_providers/AuthProvider';
import {
  CheckCircle2,
  Circle,
  Lock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const SKIP_KEY = 'identity_gate_skipped_at';
const SKIP_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function shouldShow(onboardingPhase: number): boolean {
  if (onboardingPhase >= 1) return false; // All done — never show again

  const skippedAt = localStorage.getItem(SKIP_KEY);
  if (!skippedAt) return true; // Never skipped → show

  const elapsed = Date.now() - Number(skippedAt);
  return elapsed >= SKIP_DURATION_MS; // Show again after 24h
}

// ─── Animated 3D orb illustration ─────────────────────────────────────────────
function GlassOrb() {
  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[200px] h-auto drop-shadow-2xl"
    >
      <defs>
        <radialGradient id="ig-orb" cx="40%" cy="35%" r="60%">
          <stop offset="0%" stopColor="#818CF8" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#3C61DD" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.7" />
        </radialGradient>
        <linearGradient id="ig-glass" x1="50" y1="40" x2="170" y2="170" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.28" />
          <stop offset="1" stopColor="white" stopOpacity="0.04" />
        </linearGradient>
        <filter id="ig-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="ig-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      {/* Shadow */}
      <ellipse cx="110" cy="195" rx="55" ry="10" fill="black" fillOpacity="0.12" filter="url(#ig-shadow)" />

      {/* Outer dashed orbit ring */}
      <circle
        cx="110" cy="110" r="96"
        stroke="#3C61DD"
        strokeOpacity="0.25"
        strokeWidth="1.2"
        strokeDasharray="4 7"
        className="animate-[spin_80s_linear_infinite]"
        style={{ transformOrigin: '110px 110px' }}
      />
      {/* Inner orbit */}
      <circle
        cx="110" cy="110" r="74"
        stroke="#818CF8"
        strokeOpacity="0.2"
        strokeWidth="1"
        strokeDasharray="2 5"
        className="animate-[spin_50s_linear_infinite_reverse]"
        style={{ transformOrigin: '110px 110px' }}
      />

      {/* Glowing base sphere */}
      <circle cx="110" cy="110" r="58" fill="url(#ig-orb)" filter="url(#ig-glow)" className="animate-pulse" style={{ animationDuration: '3s' }} />

      {/* Glass hexagon facets */}
      <path
        d="M110 55 L152 80 V130 L110 155 L68 130 V80 Z"
        fill="url(#ig-glass)"
        stroke="white"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <line x1="110" y1="55" x2="110" y2="155" stroke="white" strokeOpacity="0.2" strokeWidth="0.8" />
      <line x1="68" y1="80" x2="152" y2="80" stroke="white" strokeOpacity="0.15" strokeWidth="0.8" />
      <line x1="68" y1="130" x2="152" y2="130" stroke="white" strokeOpacity="0.15" strokeWidth="0.8" />

      {/* Center shield icon */}
      <circle cx="110" cy="107" r="18" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      <path
        d="M110 93 L122 99 V108 C122 115 116 121 110 123 C104 121 98 115 98 108 V99 Z"
        fill="white"
        fillOpacity="0.9"
      />
      <path d="M105 107 L109 111 L116 103" stroke="#3C61DD" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Floating dots */}
      <circle cx="60" cy="72" r="4" fill="#818CF8" fillOpacity="0.7" className="animate-bounce" style={{ animationDelay: '0s', animationDuration: '2.5s' }} />
      <circle cx="162" cy="148" r="3" fill="#3C61DD" fillOpacity="0.6" className="animate-bounce" style={{ animationDelay: '0.8s', animationDuration: '2.8s' }} />
      <circle cx="155" cy="65" r="2.5" fill="#818CF8" fillOpacity="0.5" className="animate-bounce" style={{ animationDelay: '0.4s', animationDuration: '3.2s' }} />
    </svg>
  );
}

// ─── Circular Progress Ring ────────────────────────────────────────────────────
function ProgressRing({ percent }: { percent: number }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);
  return (
    <div className="relative w-[68px] h-[68px] flex items-center justify-center shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 60 60">
        <circle cx="30" cy="30" r={r} fill="transparent" stroke="currentColor" strokeWidth="5" className="text-neutral-200 dark:text-neutral-700" />
        <circle
          cx="30" cy="30" r={r}
          fill="transparent"
          stroke="#3C61DD"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-[11px] font-extrabold text-foreground">{percent}%</span>
      </div>
    </div>
  );
}

// ─── Verification step row ─────────────────────────────────────────────────────
function StepRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2.5 py-2 px-3 rounded-xl bg-background border border-border/60">
      {done
        ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
        : <Circle className="w-4 h-4 text-muted-foreground/30 shrink-0" />
      }
      <span className={cn('text-xs font-medium', done ? 'text-foreground' : 'text-muted-foreground')}>
        {label}
      </span>
      {!done && (
        <span className="ml-auto text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded-full">
          pending
        </span>
      )}
    </div>
  );
}

// ─── Main Modal ────────────────────────────────────────────────────────────────
export default function IdentityGateModal() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [phase1Open, setPhase1Open] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || isLoading || !isAuthenticated || !user) return;
    const show = shouldShow(user.onboardingPhase ?? 0);
    setVisible(show);
  }, [mounted, isLoading, isAuthenticated, user]);

  const handleSkip = useCallback(() => {
    localStorage.setItem(SKIP_KEY, String(Date.now()));
    setVisible(false);
  }, []);

  const handleStart = useCallback(() => {
    setVisible(false);
    router.push('/onboarding');
  }, [router]);

  if (!visible) return null;

  // Derive real step states from user.onboardingPhase — phase 0 means nothing done
  const phase = user?.onboardingPhase ?? 0;
  const isPhase1Done = phase >= 1;
  const progressPercent = isPhase1Done ? 100 : 14; // Phase 1 = ~14% of 6 total phases

  return (
    // Overlay
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'rgba(0,0,0,0.58)', backdropFilter: 'blur(3px)' }}
      // NOT dismissible on backdrop click — intentional
    >
      {/* Modal Card — animate in */}
      <div
        className={cn(
          'relative w-full max-w-[900px] bg-card rounded-[28px] border border-border shadow-2xl overflow-hidden',
          'grid grid-cols-1 lg:grid-cols-12',
          'max-h-[92vh] overflow-y-auto',
          'animate-in fade-in zoom-in-95 duration-300'
        )}
      >
        {/* ── LEFT PANEL ──────────────────────────────────────────────── */}
        <div className="lg:col-span-5 relative bg-gradient-to-tr from-primary/10 via-indigo-500/5 to-transparent p-7 sm:p-9 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border/50 overflow-hidden">
          {/* Grid pattern bg */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

          <div className="relative z-10">
            {/* Top badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border/80 shadow-sm text-xs font-bold text-primary mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              Mondial Identity Portal
            </div>

            {/* Progress + Phase label */}
            <div className="flex items-center gap-4 mb-6">
              <ProgressRing percent={progressPercent} />
              <div>
                <p className="text-xs font-bold text-foreground">Phase 1 of 6</p>
                <p className="text-[11px] font-semibold text-primary mt-0.5 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  Active: Universal Identity Gate
                </p>
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight leading-snug">
              Verify your identity<br />
              <span className="text-primary">to unlock Mondial</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed max-w-xs">
              Secure your account and unlock AI Business tools, funding matchmaking, and the full creator ecosystem.
            </p>
          </div>

          {/* 3D Illustration */}
          <div className="relative z-10 flex justify-center my-4 lg:my-6">
            <GlassOrb />
          </div>

          {/* Security note */}
          <div className="relative z-10 flex items-center gap-2.5 bg-background/60 backdrop-blur-md border border-border/60 rounded-2xl px-4 py-3">
            <ShieldCheck className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-[11px] text-muted-foreground font-medium leading-snug">
              Enterprise-grade encryption · EU AML/KYC regulated
            </span>
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────── */}
        <div className="lg:col-span-7 p-6 sm:p-9 flex flex-col justify-between gap-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-border/50 pb-5">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Complete your profile
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                Universal Identity Gate &amp; Profile Setup
              </p>
            </div>
            {/* X button — only skips, same as Skip */}
            <button
              onClick={handleSkip}
              title="Remind me later"
              className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Accordion */}
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">

            {/* Phase 1 — expandable */}
            <div className={cn(
              'rounded-2xl border transition-all duration-300',
              phase1Open ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
            )}>
              <button
                onClick={() => setPhase1Open(!phase1Open)}
                className="w-full px-4 py-3.5 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-extrabold flex items-center justify-center shrink-0">
                    {isPhase1Done ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-foreground leading-tight">
                      Phase 1: Profile Verification
                    </p>
                    <p className="text-[10px] text-primary font-semibold mt-0.5">
                      Universal Identity Gate
                    </p>
                  </div>
                </div>
                <ChevronDown className={cn(
                  'w-5 h-5 text-muted-foreground/60 transition-transform duration-200 shrink-0',
                  phase1Open && 'rotate-180'
                )} />
              </button>

              {phase1Open && (
                <div className="px-4 pb-4 border-t border-border/40 pt-3 space-y-4">

                  {/* Required steps */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Required
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <StepRow label="Role selected (Creator)" done={true} />
                      <StepRow label="Identity Document" done={isPhase1Done} />
                      <StepRow label="Facial verification" done={isPhase1Done} />
                      <StepRow label="Phone verification" done={isPhase1Done} />
                      <StepRow label="Email verification" done={isPhase1Done} />
                      <StepRow label="Final approval" done={isPhase1Done} />
                    </div>
                  </div>

                  {/* Optional steps */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Optional
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <StepRow label="Residence Proof" done={false} />
                      <StepRow label="Professional License" done={false} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Phases 2–6 — locked */}
            {[
              { num: 2, title: 'Project Identity & Branding' },
              { num: 3, title: 'Project Intelligence & AI Tools' },
              { num: 4, title: 'Offer & Resource Setup' },
              { num: 5, title: 'The Crossroads' },
              { num: 6, title: 'Verified Entrepreneur Level Up' },
            ].map((p) => (
              <div
                key={p.num}
                className="rounded-2xl border border-border bg-muted/30 opacity-60 px-4 py-3.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-muted border border-border text-muted-foreground text-xs font-bold flex items-center justify-center shrink-0">
                    {p.num}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-muted-foreground truncate">
                      Phase {p.num}: {p.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 font-medium mt-0.5">
                      Complete Phase {p.num - 1} to unlock
                    </p>
                  </div>
                </div>
                <Lock className="w-4 h-4 text-muted-foreground/50 shrink-0 ml-2" />
              </div>
            ))}
          </div>

          {/* CTA Footer */}
          <div className="flex items-center justify-between gap-4 border-t border-border/50 pt-5">
            <button
              onClick={handleSkip}
              className="text-xs text-muted-foreground font-semibold hover:text-foreground transition-colors flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-muted/60"
            >
              Skip →
              <span className="text-[10px] text-muted-foreground/60 font-normal">(remind in 24h)</span>
            </button>

            <Button
              onClick={handleStart}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/25 flex items-center gap-2 group transition-all duration-200"
            >
              Start verification
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

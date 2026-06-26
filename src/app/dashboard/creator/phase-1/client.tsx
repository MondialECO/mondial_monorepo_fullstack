"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Lock,
  Loader2,
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { cn } from "@/lib/utils";

export default function CreatorPhase1Client() {
  const router = useRouter();
  const { status, isLoading, isComplete, nextRequired } = useOnboarding();
  const [activeAccordion, setActiveAccordion] = useState<number | null>(1);

  useEffect(() => {
    if (isLoading) return;
    if (isComplete) router.replace("/dashboard/creator");
  }, [isLoading, isComplete, router]);

  if (isLoading || !status) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-muted-foreground gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="text-sm font-medium tracking-wide">Loading your verification profile…</span>
      </div>
    );
  }

  // Get verification items statuses
  const isRoleSelected = true; // Creator is selected
  const isIdentityDone = !!status.items.identity?.verified;
  const isFaceDone = !!status.items.face?.verified;
  const isPhoneDone = !!status.items.phone?.verified;
  const isEmailDone = !!status.items.email?.verified;
  const isFinalApprovalDone = isIdentityDone && isFaceDone && isPhoneDone && isEmailDone;

  const totalPhases = 6;
  const currentPhase = 1;
  const progressPercent = Math.round((currentPhase / totalPhases) * 100);

  // Accordion toggle handler
  const toggleAccordion = (phaseNum: number) => {
    if (phaseNum === 1) {
      setActiveAccordion(activeAccordion === 1 ? null : 1);
    }
  };

  return (
    <div className="w-full max-w-[1140px] mx-auto">
      <div className="bg-card rounded-3xl border border-border/80 shadow-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        
        {/* Left Side: 3D Hero Illustration */}
        <div className="lg:col-span-5 relative bg-gradient-to-tr from-primary/10 via-indigo-500/5 to-transparent p-6 sm:p-10 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 lg:border-r border-border/60">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
          
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-sm text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              Mondial Onboarding Portal
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              Begin your Creator Journey
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md leading-relaxed">
              Verify your identity to unlock powerful AI Business intelligence, funding matchmaking, and the service provider ecosystem.
            </p>
          </div>

          {/* Premium 3D Glassmorphic SVG Illustration */}
          <div className="relative z-10 my-6 flex items-center justify-center min-h-[220px]">
            <svg className="w-full max-w-[220px] h-auto drop-shadow-xl" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="circleGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3B82F6" stopOpacity="0.8" />
                  <stop offset="0.5" stopColor="#8B5CF6" stopOpacity="0.8" />
                  <stop offset="1" stopColor="#EC4899" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="glassGrad" x1="40" y1="40" x2="160" y2="160" gradientUnits="userSpaceOnUse">
                  <stop stopColor="white" stopOpacity="0.25" />
                  <stop offset="1" stopColor="white" stopOpacity="0.05" />
                </linearGradient>
                <filter id="blurFilter" x="-10" y="-10" width="220" height="220" filterUnits="userSpaceOnUse">
                  <feGaussianBlur stdDeviation="8" />
                </filter>
              </defs>
              <circle cx="100" cy="100" r="60" fill="url(#circleGrad)" filter="url(#blurFilter)" className="animate-pulse" />
              <circle cx="100" cy="100" r="75" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" className="text-primary/30 dark:text-primary/40 animate-[spin_60s_linear_infinite]" />
              <path d="M100 50L145 75V125L100 150L55 125V75L100 50Z" fill="url(#glassGrad)" stroke="currentColor" strokeOpacity="0.4" strokeWidth="1.5" className="text-border" />
              <path d="M100 50V150" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" className="text-border" />
              <path d="M55 75L100 100L145 75" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" className="text-border" />
              <path d="M55 125L100 100L145 125" stroke="currentColor" strokeOpacity="0.3" strokeWidth="1" className="text-border" />
              <circle cx="100" cy="100" r="20" fill="url(#circleGrad)" className="animate-bounce duration-[3s]" />
            </svg>
          </div>

          <div className="relative z-10 bg-background/50 backdrop-blur-md rounded-2xl p-4 border border-border shadow-sm flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">
              Enterprise-grade encryption protecting your personal and biometric assets.
            </span>
          </div>
        </div>

        {/* Right Side: Complete Profile Flow */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-8">
          <div>
            {/* Header with Circular Progress Ring */}
            <div className="flex items-center justify-between gap-6 border-b border-border/60 pb-6 mb-6">
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  Complete your profile
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-normal">
                  Universal Identity Gate &amp; Profile Setup
                </p>
              </div>

              {/* Progress Ring */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="relative w-14 h-14 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      className="text-neutral-100 dark:text-neutral-800"
                      strokeWidth="4"
                      fill="transparent"
                      stroke="currentColor"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      className="text-primary transition-all duration-500"
                      strokeWidth="4"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 24}
                      strokeDashoffset={2 * Math.PI * 24 * (1 - progressPercent / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                    />
                  </svg>
                  <span className="absolute text-[10px] font-bold text-foreground">
                    {progressPercent}%
                  </span>
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-foreground">Phase 1 of 6</div>
                  <div className="text-[10px] font-medium text-muted-foreground">Identity verification</div>
                </div>
              </div>
            </div>

            {/* Accordion Flow */}
            <div className="space-y-4">
              
              {/* Phase 1: Profile Verification */}
              <div className={cn(
                "rounded-2xl border transition-all duration-300",
                activeAccordion === 1 
                  ? "border-primary/30 bg-primary/5 dark:bg-primary/5/10" 
                  : "border-border bg-card"
              )}>
                <button
                  onClick={() => toggleAccordion(1)}
                  className="w-full p-4 flex items-center justify-between font-semibold text-left text-foreground"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      1
                    </span>
                    <span className="text-sm sm:text-base font-bold">
                      Phase 1: Profile Verification (Universal Identity Gate)
                    </span>
                  </div>
                  <ChevronDown className={cn(
                    "w-5 h-5 text-neutral-400 transition-transform duration-200",
                    activeAccordion === 1 && "transform rotate-180"
                  )} />
                </button>

                {activeAccordion === 1 && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/40 mt-1">
                    <div className="mt-4 space-y-4">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Mandatory Steps</div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Step 1: Role Selection */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/80">
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          <span className="text-xs sm:text-sm font-medium text-foreground">
                            Role selected (Creator)
                          </span>
                        </div>

                        {/* Step 2: Identity Document */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/80">
                          {isIdentityDone ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                          )}
                          <span className="text-xs sm:text-sm font-medium text-foreground">
                            Identity Document
                          </span>
                        </div>

                        {/* Step 3: Facial Verification */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/80">
                          {isFaceDone ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                          )}
                          <span className="text-xs sm:text-sm font-medium text-foreground">
                            Facial verification
                          </span>
                        </div>

                        {/* Step 4: Phone Verification */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/80">
                          {isPhoneDone ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                          )}
                          <span className="text-xs sm:text-sm font-medium text-foreground">
                            Phone verification
                          </span>
                        </div>

                        {/* Step 5: Email Verification */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/80">
                          {isEmailDone ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                          )}
                          <span className="text-xs sm:text-sm font-medium text-foreground">
                            Email verification
                          </span>
                        </div>

                        {/* Step 6: Final Verification Approval */}
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/80">
                          {isFinalApprovalDone ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground/30 shrink-0" />
                          )}
                          <span className="text-xs sm:text-sm font-medium text-foreground">
                            Final verification approval
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Locked Phases 2-6 */}
              {[
                { num: 2, title: "Phase 2: Project Identity & Branding" },
                { num: 3, title: "Phase 3: Project Intelligence & AI Tools" },
                { num: 4, title: "Phase 4: Offer & Resource Setup" },
                { num: 5, title: "Phase 5: The Crossroads" },
                { num: 6, title: "Phase 6: Verified Entrepreneur Level Up" }
              ].map((p) => (
                <div
                  key={p.num}
                  className="rounded-2xl border border-border bg-muted/40 opacity-70 p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-muted border border-border text-muted-foreground flex items-center justify-center text-xs font-bold shrink-0">
                      {p.num}
                    </span>
                    <div className="min-w-0">
                      <span className="block text-sm sm:text-base font-bold text-muted-foreground truncate">
                        {p.title}
                      </span>
                      <span className="block text-[10px] text-muted-foreground/80 font-medium mt-0.5">
                        Complete Phase {p.num - 1} to unlock this phase.
                      </span>
                    </div>
                  </div>
                  <Lock className="w-4.5 h-4.5 text-muted-foreground shrink-0" />
                </div>
              ))}

            </div>
          </div>

          {/* CTA Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Identity Verification regulated under EU AML/KYC guidelines.</span>
            </div>
            
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-primary hover:bg-primary/95 text-white font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group transition-all duration-200"
            >
              <Link href={nextRequired?.href ?? "/onboarding"}>
                {nextRequired ? "Start verification" : "All required steps done"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}

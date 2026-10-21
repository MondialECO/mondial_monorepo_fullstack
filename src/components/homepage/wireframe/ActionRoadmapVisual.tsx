'use client';

import React, { useState } from 'react';
import {
  Info,
  ShieldCheck,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useLanguage } from '@/providers/LanguageProvider';

interface ActionRoadmapVisualProps {
  className?: string;
}

export default function ActionRoadmapVisual({ className = '' }: ActionRoadmapVisualProps) {
  const { t } = useLanguage();
  const [availabilityHours, setAvailabilityHours] = useState<number>(4);
  const [isAdjustingAvailability, setIsAdjustingAvailability] = useState<boolean>(false);
  const [isNowExpanded, setIsNowExpanded] = useState<boolean>(true);
  const [selectedTaskModal, setSelectedTaskModal] = useState<boolean>(false);
  const [bannerDismissed, setBannerDismissed] = useState<boolean>(false);

  return (
    <div
      data-testid="action-roadmap-visual"
      className={`relative w-full max-w-[824px] 2xl:max-w-[862px] bg-white dark:bg-card border border-slate-200/90 dark:border-slate-800 rounded-[24px] shadow-[0_4px_70px_12px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_70px_12px_rgba(0,0,0,0.4)] p-4 sm:p-6 lg:p-7 space-y-4 sm:space-y-4.5 overflow-hidden transition-all duration-300 font-sans ${className}`}
    >
      {/* ========================================================================= */}
      {/* 1. TOP NOTIFICATION BANNER: Update available */}
      {/* ========================================================================= */}
      {!bannerDismissed && (
        <div
          data-testid="roadmap-banner"
          className="relative flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 sm:px-4 sm:py-3 rounded-xl bg-white dark:bg-card border border-slate-200/80 dark:border-slate-800 shadow-xs pl-4 sm:pl-5 overflow-hidden"
        >
          {/* Blue vertical accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 sm:w-1.5 bg-[#3c61dd] rounded-l"
            aria-hidden="true"
          />

          <div className="flex items-start sm:items-center gap-2.5">
            <Info className="w-4 h-4 text-[#3c61dd] shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
            <p className="text-xs sm:text-[13px] leading-snug">
              <span className="font-semibold text-slate-900 dark:text-white">
                Update available
              </span>
              <span className="text-slate-500 dark:text-zinc-400">
                {' '}
                · Changes to your project information or availability may affect this roadmap.
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              onClick={() => setIsAdjustingAvailability(true)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-zinc-200 text-xs font-medium shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Review changes
            </button>
            <button
              type="button"
              onClick={() => setBannerDismissed(true)}
              className="px-2 py-1.5 text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200 font-medium transition-colors"
            >
              Keep current plan
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. AVAILABILITY & WORKLOAD CARD */}
      {/* ========================================================================= */}
      <div
        data-testid="roadmap-availability-card"
        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-card p-4 sm:p-5 lg:p-6 space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800 gap-4 sm:gap-0">
          {/* Column 1: YOUR AVAILABILITY */}
          <div className="space-y-1">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase font-sans">
              YOUR AVAILABILITY
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-[32px] font-bold text-slate-900 dark:text-white font-heading tracking-tight">
                {availabilityHours} hours
              </span>
              <span className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400 font-normal">
                / week
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAdjustingAvailability(!isAdjustingAvailability)}
              className="text-xs sm:text-[13px] text-[#3c61dd] dark:text-blue-400 font-medium hover:underline text-left inline-flex items-center gap-1 transition-colors"
            >
              Adjust availability
            </button>
          </div>

          {/* Column 2: PLANNED NOW */}
          <div className="sm:pl-6 pt-3 sm:pt-0 space-y-1">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase font-sans">
              PLANNED NOW
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-[32px] font-bold text-slate-900 dark:text-white font-heading tracking-tight">
                2 tasks
              </span>
              <span className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400 font-normal">
                · 2.5 hrs
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#157a55]" aria-hidden="true" />
              <span className="text-xs sm:text-[12px] font-medium text-[#157a55] dark:text-emerald-400">
                Within weekly capacity
              </span>
            </div>
          </div>

          {/* Column 3: PLAN STATUS */}
          <div className="sm:pl-6 pt-3 sm:pt-0 space-y-1">
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 dark:text-zinc-500 uppercase font-sans">
              PLAN STATUS
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-[24px] font-bold text-slate-900 dark:text-white font-heading tracking-tight">
                Ready for review
              </span>
            </div>
            <p className="text-xs sm:text-[13px] text-slate-500 dark:text-zinc-400">
              Awaiting activation
            </p>
          </div>
        </div>

        {/* Interactive Availability Slider (if opened) */}
        {isAdjustingAvailability && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#3c61dd]" />
              <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                Weekly commitment:
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {[2, 4, 8, 12].map((hrs) => (
                <button
                  key={hrs}
                  type="button"
                  onClick={() => setAvailabilityHours(hrs)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                    availabilityHours === hrs
                      ? 'bg-[#3c61dd] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100'
                  }`}
                >
                  {hrs} hrs
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsAdjustingAvailability(false)}
                className="ml-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200"
                aria-label="Close availability adjuster"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Sub-note with shield icon */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-3.5 flex items-center gap-2 text-slate-500 dark:text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
          <p className="text-[11.5px] sm:text-[12px] leading-relaxed">
            Your immediate workload is based on the time you can commit. Under 5 hours/week allows a
            maximum of 2 tasks in Now.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. HIGHLIGHT CARD: START HERE */}
      {/* ========================================================================= */}
      <div
        data-testid="roadmap-start-here-card"
        className="rounded-2xl border border-blue-200/90 dark:border-blue-900/50 bg-gradient-to-r from-[#eff5ff] via-[#f7faff] to-white dark:from-blue-950/40 dark:via-blue-950/20 dark:to-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden shadow-xs"
      >
        <div className="space-y-1.5 flex-1 min-w-0">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-[#dbe6ff] dark:bg-blue-900/60 text-[#2552d0] dark:text-blue-300 text-[10.5px] font-bold tracking-wider uppercase font-sans">
            START HERE
          </span>
          <h4 className="text-xl sm:text-[22px] font-bold text-slate-900 dark:text-white font-heading tracking-tight">
            Prepare a technical delivery brief
          </h4>
          <p className="text-xs sm:text-[13px] text-slate-600 dark:text-zinc-400 font-sans leading-relaxed">
            Describe the first product version so technical specialists can estimate the work.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#fef3c7] dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/40 text-[#b45309] dark:text-amber-300 text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" aria-hidden="true" />
              Critical priority
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-zinc-300 text-[11px] font-medium shadow-2xs">
              Estimated effort: 1.5 hours
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-white/90 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-zinc-300 text-[11px] font-medium shadow-2xs">
              No prerequisites
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedTaskModal(!selectedTaskModal)}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-zinc-200 text-xs sm:text-sm font-medium shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 shrink-0 transition-colors self-start md:self-center"
        >
          <span>View task</span>
          <span className="text-slate-400">↓</span>
        </button>
      </div>

      {/* Task Modal / Expanded drawer */}
      {selectedTaskModal && (
        <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 text-xs text-slate-700 dark:text-zinc-300 space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#3c61dd]" />
              Task Brief & Acceptance Criteria
            </span>
            <button
              type="button"
              onClick={() => setSelectedTaskModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="leading-relaxed">
            1. Define user personas & primary job-to-be-done.
            <br />
            2. List 3 MVP core capabilities and third-party integrations (Stripe, INPI).
            <br />
            3. Export specifications as a ready-to-sign contractor brief.
          </p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. NOW SECTION: ACCORDION PREVIEW */}
      {/* ========================================================================= */}
      <div data-testid="roadmap-now-section" className="space-y-3 pt-1">
        <div className="flex items-center gap-2.5">
          <span className="text-lg sm:text-[20px] font-bold text-slate-900 dark:text-white font-heading tracking-tight">
            Now
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-zinc-300 text-[11px] font-semibold">
            2 tasks
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#3c61dd] dark:text-blue-300 text-[11px] font-semibold">
            Immediate focus
          </span>
        </div>

        {/* Accordion Item 1 (Figma Primary item) */}
        <div
          onClick={() => setIsNowExpanded(!isNowExpanded)}
          className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 bg-white dark:bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer select-none"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-[#157a55] shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white font-sans">
              Prepare a technical delivery brief
            </span>
            <span className="px-2 py-0.5 rounded bg-[#fef3c7] dark:bg-amber-950/40 text-[#b45309] dark:text-amber-300 border border-amber-200/80 dark:border-amber-900/40 text-[10.5px] font-semibold">
              Critical
            </span>
            <span className="text-xs text-slate-500 dark:text-zinc-400 font-sans">
              1.5 hours
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/40 text-[10.5px] font-semibold">
              Ready to start
            </span>
          </div>

          <div className="self-end sm:self-center">
            {isNowExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            )}
          </div>
        </div>

        {/* Expanded secondary task item */}
        {isNowExpanded && (
          <div className="rounded-xl border border-slate-100 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-card/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs transition-colors">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#3c61dd] shrink-0" aria-hidden="true" />
              <span className="text-sm font-semibold text-slate-900 dark:text-white font-sans">
                Setup MVP technical requirements & API contracts
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-[#3c61dd] dark:text-blue-300 border border-blue-200/60 text-[10.5px] font-semibold">
                High
              </span>
              <span className="text-xs text-slate-500 dark:text-zinc-400 font-sans">
                1.0 hour
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/40 text-[10.5px] font-semibold">
                Ready to start
              </span>
            </div>

            <span className="text-xs text-slate-400 font-medium self-end sm:self-center">
              Next in queue
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

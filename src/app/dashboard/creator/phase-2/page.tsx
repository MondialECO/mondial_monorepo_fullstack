"use client";

import { useRouter } from "next/navigation";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import Image from "next/image";

// Inlined from the committed SVGs in /public/icons/phase2 (path data verbatim; the
// only change is stroke -> currentColor so the mark inherits its tile's text color
// for the hover/focus treatment). The .svg files on disk are kept as the exported
// source of this data — do not delete them.
// Source: /public/icons/phase2/lamp-charge.svg
function LampChargeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12 7.89L10.93 9.75C10.69 10.16 10.89 10.5 11.36 10.5H12.63C13.11 10.5 13.3 10.84 13.06 11.25L12 13.11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.3 18.04V16.88C6 15.49 4.11 12.78 4.11 9.9C4.11 4.95 8.66 1.07 13.8 2.19C16.06 2.69 18.04 4.19 19.07 6.26C21.16 10.46 18.96 14.92 15.73 16.87V18.03C15.73 18.32 15.84 18.99 14.77 18.99H9.26C8.16 19 8.3 18.57 8.3 18.04Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8.5 22C10.79 21.35 13.21 21.35 15.5 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Source: /public/icons/phase2/discover.svg
function DiscoverIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M17.8 2.1L7.87 4.59C6.42 4.95 4.95 6.42 4.59 7.87L2.1 17.8C1.35 20.8 3.19 22.65 6.2 21.9L16.13 19.42C17.57 19.06 19.05 17.58 19.41 16.14L21.9 6.2C22.65 3.2 20.8 1.35 17.8 2.1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 15.5C13.933 15.5 15.5 13.933 15.5 12C15.5 10.067 13.933 8.5 12 8.5C10.067 8.5 8.5 10.067 8.5 12C8.5 13.933 10.067 15.5 12 15.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function SmartGatePage() {
  const router = useRouter();
  const { setEntryPath, updateProject } = useCreatorProgress();

  const handleSelectRefinement = () => {
    setEntryPath("already_have_idea");
    updateProject({ exists: true });
    router.push("/dashboard/creator/phase-2/clarifier");
  };

  const handleSelectDiscovery = () => {
    // Discovery deliberately does NOT set a server-side entry path — the backend
    // discriminates a Discovery user by persisted working-state (2C-2), and steps
    // 3–5 resume refresh-safe via the resolver (2C-3). Enter the Discovery form.
    updateProject({ exists: true });
    router.push("/dashboard/creator/phase-2/discovery");
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-screen" style={{ backgroundColor: "var(--background)" }}>
      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 sm:px-8 py-12 sm:py-16 md:py-20">
        <div className="w-full max-w-[820px] space-y-10 md:space-y-12">

          {/* Heading Block */}
          <div className="text-center space-y-3 sm:space-y-4">
            <h1 className="text-3xl sm:text-4xl font-semibold" style={{ color: "var(--foreground)" }}>
              Welcome Back! Founder.
            </h1>
            <p className="text-sm sm:text-base leading-relaxed max-w-[533px] mx-auto" style={{ color: "var(--muted-foreground)" }}>
              You&apos;re entering Phase 2: Project Identity. Before we proceed, let&apos;s establish your current starting point. <span style={{ color: "var(--foreground)", fontWeight: "500" }}>Do you have a clear idea in mind?</span>
            </p>
          </div>

          {/* Choice Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {/* LEFT CARD — Active Project Refinement */}
            <div
              onClick={handleSelectRefinement}
              className="group flex flex-col justify-between rounded-2xl p-7 sm:p-8 cursor-pointer transition-all duration-300 border border-[rgba(60,97,221,0.5)] hover:border-[var(--primary)] focus-within:border-[var(--primary)]"
              style={{ backgroundColor: "var(--card)" }}
            >
              <div className="space-y-5">
                {/* Icon Tile — inverts (blue→white) on hover/focus so the near-white mark reads as a change */}
                <div className="h-16 w-16 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300 bg-[var(--primary)] text-[var(--primary-foreground)] group-hover:bg-[var(--primary-foreground)] group-hover:text-[var(--primary)] group-focus-within:bg-[var(--primary-foreground)] group-focus-within:text-[var(--primary)]">
                  <LampChargeIcon className="h-6 w-6" />
                </div>

                {/* Title & Description */}
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-semibold" style={{ color: "var(--foreground)" }}>
                    Active Project Refinement
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    Choose this if you have a defined concept. We&apos;ll use structured logic to sharpen your value proposition.
                  </p>
                </div>

                {/* Metadata */}
                <div className="flex items-center gap-8 py-3 border-t" style={{ borderColor: "#d9d9d9" /* no exact token match; keeping hardcoded */ }}>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#606060" }}>
                      TIME TO COMPLETE
                    </span>
                    <span className="text-xs sm:text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      ~15 Minutes
                    </span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#606060" }}>
                      FOCUS LEVEL
                    </span>
                    <span className="text-xs sm:text-sm font-medium" style={{ color: "var(--foreground)" }}>
                      Strategic High
                    </span>
                  </div>
                </div>
              </div>

              {/* Button */}
              <button
                onClick={handleSelectRefinement}
                className="w-full mt-6 px-6 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                lets Sharper it
                <Image
                  src="/icons/phase2/arrow-right.svg"
                  alt="→"
                  width={20}
                  height={20}
                />
              </button>
            </div>

            {/* RIGHT CARD — Explore & Discovery */}
            <div
              onClick={handleSelectDiscovery}
              className="group flex flex-col justify-between rounded-2xl p-7 sm:p-8 cursor-pointer transition-all duration-300 border border-[var(--border)] hover:border-[var(--muted-foreground)] focus-within:border-[var(--muted-foreground)]"
              style={{ backgroundColor: "var(--card)" }}
            >
              <div className="space-y-5">
                {/* Icon Tile — stays neutral; only the mark takes a blue accent on hover/focus (quiet card) */}
                <div className="h-16 w-16 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-300 bg-[var(--muted)] text-[var(--foreground)] group-hover:text-[var(--primary)] group-focus-within:text-[var(--primary)]">
                  <DiscoverIcon className="h-6 w-6" />
                </div>

                {/* Title & Description */}
                <div className="space-y-2">
                  <h3 className="text-lg sm:text-xl font-semibold" style={{ color: "var(--foreground)" }}>
                    Explore & discovery
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                    Not quite sure? We&apos;ll help you cross-reference your interests with market observations.
                  </p>
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src="/icons/phase2/tick-circle.svg"
                      alt="✓"
                      width={12}
                      height={12}
                    />
                    <span className="text-xs" style={{ color: "var(--foreground)" }}>
                      Interest Mapping
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image
                      src="/icons/phase2/tick-circle.svg"
                      alt="✓"
                      width={12}
                      height={12}
                    />
                    <span className="text-xs" style={{ color: "var(--foreground)" }}>
                      Problem Space Discovery
                    </span>
                  </div>
                </div>
              </div>

              {/* Button */}
              <button
                onClick={handleSelectDiscovery}
                className="w-full mt-6 px-6 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                style={{
                  backgroundColor: "var(--popover)",
                  color: "var(--muted-foreground)",
                  borderWidth: "1px",
                  borderColor: "var(--stroke-10)",
                }}
              >
                Help Me find it
                <Image
                  src="/icons/phase2/arrow-right-dark.svg"
                  alt="→"
                  width={20}
                  height={20}
                />
              </button>
            </div>
          </div>

          {/* Bottom Note */}
          <div className="text-center pt-6 border-t" style={{ borderColor: "var(--stroke-10)" }}>
            <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Both paths lead to same destination. There is no wrong choice.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}

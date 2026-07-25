"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreatorProgress } from "@/providers/CreatorProgressProvider";
import Image from "next/image";

export default function SmartGatePage() {
  const router = useRouter();
  const { setEntryPath, updateProject } = useCreatorProgress();
  const [hoveredCard, setHoveredCard] = useState<"left" | "right" | null>(null);

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
              onMouseEnter={() => setHoveredCard("left")}
              onMouseLeave={() => setHoveredCard(null)}
              className="flex flex-col justify-between rounded-2xl p-7 sm:p-8 cursor-pointer transition-all duration-300"
              style={{
                backgroundColor: "var(--card)",
                borderWidth: "1px",
                borderColor: hoveredCard === "left" ? "rgba(60, 97, 221, 0.5)" : "rgba(60, 97, 221, 0.5)",
                transform: hoveredCard === "left" ? "translateY(-2px)" : "translateY(0)",
              }}
            >
              <div className="space-y-5">
                {/* Icon Tile */}
                <div
                  className="h-16 w-16 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  <Image
                    src="/icons/phase2/lamp-charge.svg"
                    alt="Refinement"
                    width={24}
                    height={24}
                    style={{ color: "white" }}
                  />
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
              onMouseEnter={() => setHoveredCard("right")}
              onMouseLeave={() => setHoveredCard(null)}
              className="flex flex-col justify-between rounded-2xl p-7 sm:p-8 cursor-pointer transition-all duration-300"
              style={{
                backgroundColor: "var(--card)",
                borderWidth: "1px",
                borderColor: "var(--border)",
                transform: hoveredCard === "right" ? "translateY(-2px)" : "translateY(0)",
              }}
            >
              <div className="space-y-5">
                {/* Icon Tile */}
                <div
                  className="h-16 w-16 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--muted)" }}
                >
                  <Image
                    src="/icons/phase2/discover.svg"
                    alt="Discovery"
                    width={24}
                    height={24}
                  />
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

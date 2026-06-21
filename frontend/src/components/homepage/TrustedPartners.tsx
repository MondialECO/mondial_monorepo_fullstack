/**
 * TrustedPartners
 *
 * Figma node: 20128:20283 — "Logo"
 * Section: 1596×336px, VERTICAL, gap 24px, padding T120 B120 L100 R100
 * Logo row: HORIZONTAL, gap 52px, 15 logos × 48×48px each
 * Fade overlays: left 605px, right 605px — GRADIENT_LINEAR #d9d9d9(a=0) → #ededed(a=1)
 *
 * One logo set width  = 15 × 48 + 14 × 52 = 720 + 728 = 1448px
 * Marquee travel dist = 1448 + 52 (inter-set gap) = 1500px per cycle
 */

'use client'

import { useRef, useEffect } from "react";

/* ── Exact logo list in Figma order ─────────────────────── */
const LOGOS: { name: string; file: string }[] = [
    { name: "Avail", file: "/logos/avail.svg" },
    { name: "Bitcoin", file: "/logos/bitcoin.svg" },
    { name: "DAO IPCI", file: "/logos/dao-ipci.svg" },
    { name: "Edgeware", file: "/logos/edgeware.svg" },
    { name: "Hive", file: "/logos/hive.svg" },
    { name: "Fantom", file: "/logos/fantom.svg" },
    { name: "Fusotao", file: "/logos/fusotao.svg" },
    { name: "Kintsugi", file: "/logos/kintsugi.svg" },
    { name: "Loom", file: "/logos/loom.svg" },
    { name: "Polkadex", file: "/logos/polkadex.svg" },
    { name: "Darwinia", file: "/logos/darwinia.svg" },
    { name: "Polkadot", file: "/logos/polkadot.svg" },
    { name: "DigiByte", file: "/logos/digibyte.svg" },
    { name: "Bancor", file: "/logos/bancor.svg" },
    { name: "Amplitude", file: "/logos/amplitude.svg" },
];

/* ── One row of logo items ───────────────────────────────── */
function LogoSet() {
    return (
        <>
            {LOGOS.map((logo) => (
                <div
                    key={logo.name}
                    title={logo.name}
                    style={{
                        /* Each instance: 48×48px, flex-shrink: 0 */
                        width: 48,
                        height: 48,
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <img
                        src={logo.file}
                        alt={logo.name}
                        width={48}
                        height={48}
                        style={{
                            width: 48,
                            height: 48,
                            objectFit: "contain",
                            /* All Figma icons are #3e3e3e fill — keep them dark */
                            filter: "none",
                            display: "block",
                        }}
                    />
                </div>
            ))}
        </>
    );
}

/* ── Main component ──────────────────────────────────────── */
export default function TrustedPartners() {
    /*
     * We pause the marquee on hover for accessibility.
     * Pure-CSS animation avoids JS jank; the ref is only used to
     * toggle the paused state.
     */
    const trackRef = useRef<HTMLDivElement>(null);

    const pause = () => { if (trackRef.current) trackRef.current.style.animationPlayState = "paused"; };
    const resume = () => { if (trackRef.current) trackRef.current.style.animationPlayState = "running"; };

    return (
        <>
            {/* Inject the @keyframes rule once */}
            <style>{`
        @keyframes mondial-marquee {
          0%   { transform: translateX(0);        }
          100% { transform: translateX(-1500px);  }
        }
      `}</style>

            {/*
       * Section container
       * Figma: VERTICAL layout, gap 24px, pad T120 B120 L100 R100
       * Background inherits the page's #F1F1F2 (same canvas area)
       */}
            <section
                style={{
                    width: "100%",
                    background: "#F1F1F2",
                    paddingTop: 120,
                    paddingBottom: 120,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 24,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {/* ── Title ─────────────────────────────────────────────
            Figma: TEXT "20+ Trusted Partners Collaborate with Us"
            Inter 16px w400 lh:24 color:#3E3E3E  centered
        */}
                <p
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 16,
                        fontWeight: 400,
                        lineHeight: "24px",
                        color: "#3E3E3E",
                        textAlign: "center",
                        margin: 0,
                        padding: "0 100px",
                        letterSpacing: 0,
                    }}
                >
                    20+ Trusted Partners Collaborate with Us
                </p>

                {/* ── Marquee track wrapper ──────────────────────────── */}
                <div
                    style={{
                        position: "relative",
                        width: "100%",
                        /* Show 1448px centred but allow overflow for the animation */
                        overflow: "hidden",
                    }}
                    onMouseEnter={pause}
                    onMouseLeave={resume}
                    aria-label="Trusted partner logos"
                    role="marquee"
                >
                    {/*
           * Animated track — contains 3 identical sets of logos.
           * gap: 52px between every logo (within and between sets).
           *
           * Travel = one-set-width + one-gap = 1448 + 52 = 1500px
           * After translating -1500px the view is identical → seamless.
           *
           * Duration: 28s for a comfortable speed (≈53px/s).
           */}
                    <div
                        ref={trackRef}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            /* gap 52px between every logo item (within and across sets) */
                            gap: 52,
                            width: "max-content",
                            animation: "mondial-marquee 28s linear infinite",
                        }}
                    >
                        <LogoSet />
                        <LogoSet />
                        <LogoSet />
                    </div>

                    {/*
           * Left fade overlay
           * Figma: RECTANGLE 605×336, GRADIENT_LINEAR #d9d9d9(a=0)→#ededed(a=1)
           * Interpreted as: transparent → opaque background, left-to-right
           */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: 320,
                            height: "100%",
                            background: "linear-gradient(to right, #F1F1F2 0%, rgba(241,241,242,0) 100%)",
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    />

                    {/*
           * Right fade overlay
           * Mirror of left: transparent → opaque background, right-to-left
           */}
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: 320,
                            height: "100%",
                            background: "linear-gradient(to left, #F1F1F2 0%, rgba(241,241,242,0) 100%)",
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    />
                </div>
            </section>
        </>
    );
}

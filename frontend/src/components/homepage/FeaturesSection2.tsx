"use client";

import { useState } from "react";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type TabKey = "Founder" | "Investor" | "Entrepreneur" | "Service Provider";
type HeaderPos = "top-left" | "bottom-left";

// ─────────────────────────────────────────────────────────────
// REUSABLE FEATURE CARD SHELL
// ─────────────────────────────────────────────────────────────
interface FeatureCardProps {
    width?: string;
    height?: string;
    headerPos?: HeaderPos;
    title: string;
    subtitle: string;
    bgClass?: string;
    className?: string;
    children?: React.ReactNode;
}

const FeatureCard = ({
    width = "flex-1",
    height = "h-[520px]",
    headerPos = "top-left",
    title,
    subtitle,
    bgClass = "bg-[#F9F9FA]",
    className = "",
    children,
}: FeatureCardProps) => {
    const posClass =
        headerPos === "top-left"
            ? "absolute left-12 top-12"
            : "absolute left-12 bottom-12";

    return (
        <div
            className={[
                "relative overflow-hidden rounded-4xl border border-white",
                "shadow-[-2px_-1px_17px_rgba(0,0,0,0.02),1px_2px_3px_rgba(0,0,0,0.04)]",
                bgClass,
                width,
                height,
                className,
            ].join(" ")}
        >
            <div className={posClass} style={{ zIndex: 3 }}>
                <h3
                    className="font-medium text-[28px] leading-8 text-[#070707]"
                    style={{ fontFamily: "'Inter Tight', sans-serif" }}
                >
                    {title}
                </h3>
                <p
                    className="mt-2 text-[18px] leading-7 text-[#5E5E5E]"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    {subtitle}
                </p>
            </div>
            {children}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// CARD 1 – FOUNDER  →  user_profile_card.svg
// ─────────────────────────────────────────────────────────────
const FounderCard = () => (
    <FeatureCard
        width="lg:w-[456px] w-full"
        height="min-h-[520px]"
        headerPos="top-left"
        title="Become a founder"
        subtitle="Convert followers to bookings."
    >
        <div
            className="absolute bottom-0 left-0 w-full pointer-events-none"
            style={{ zIndex: 2 }}
        >
            {/* user_profile_card.svg — 456×367  */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/landing/user_profile_card.svg"
                alt=""
                width={456}
                height={367}
                className="w-full h-auto object-contain object-bottom"
                draggable={false}
            />
        </div>
    </FeatureCard>
);

// ─────────────────────────────────────────────────────────────
// CARD 2 – SUBMIT IDEAS  →  idea_card.svg
// ─────────────────────────────────────────────────────────────
const SubmitIdeasCard = () => (
    <FeatureCard
        width="flex-1"
        height="min-h-[520px]"
        headerPos="top-left"
        title="Submit ideas"
        subtitle="Convert investors to commitments!"
    >
        {/* idea_card.svg — 640×425 */}
        <div
            className="absolute bottom-0 left-0 w-full pointer-events-none"
            style={{ zIndex: 2 }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/landing/idea_card.svg"
                alt="Submit idea detail card"
                width={640}
                height={425}
                className="w-full h-auto object-contain object-bottom"
                draggable={false}
            />
        </div>

    </FeatureCard>
);

// ─────────────────────────────────────────────────────────────
// CARD 3 – GET INVESTORS  →  investorList_card.svg
// ─────────────────────────────────────────────────────────────
const GetInvestorsCard = () => (
    <FeatureCard
        width="flex-1"
        height="min-h-[520px]"
        headerPos="bottom-left"
        title="Get Investors"
        subtitle="Convert investors to commitments!"
    >
        {/* investorList_card.svg — 460×345 */}
        <div
            className="absolute top-4 left-0 w-full pointer-events-none flex justify-center"
            style={{ zIndex: 2 }}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src="/landing/investorList_card.svg"
                alt="Investor list"
                width={460}
                height={345}
                className="w-full max-w-115 h-auto object-contain"
                draggable={false}
            />
        </div>
    </FeatureCard>
);

// ─────────────────────────────────────────────────────────────
// CARD 4 – GROW TOGETHER  →  task.jpg
const GrowTogetherCard = () => (
    <FeatureCard
        width="lg:w-[456px] w-full"
        height="min-h-[520px]"
        headerPos="top-left"
        title="Grow Together"
        subtitle="Convert followers into bookings by sharing ideas!"
        className="bg-linear-to-b from-[#F3F0F9] to-[#F7FCFD]"
    >
        {/* Image Container (fixed positioning anchor) */}
        <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 z-2">

            {/* Scale Wrapper */}
            <div className="scale-[2] origin-center bottom-5">
                <ImageWithFallback
                    src="/landing/task.svg"
                    alt="Business Profit"
                    width={330}
                    height={212}
                    className="rounded-3xl"
                />
            </div>

        </div>
    </FeatureCard>
);

// ─────────────────────────────────────────────────────────────
// TAB TOGGLE
// ─────────────────────────────────────────────────────────────
const TABS: TabKey[] = ["Founder", "Investor", "Entrepreneur", "Service Provider"];

const TabToggle = ({
    active,
    onChange,
}: {
    active: TabKey;
    onChange: (t: TabKey) => void;
}) => (
    <div
        className="flex items-center p-2 gap-1 bg-[#EDEDED] border border-white rounded-[52px]"
        style={{ boxShadow: "0 0 44px rgba(0,0,0,0.06)" }}
    >
        {TABS.map((tab) => (
            <button
                key={tab}
                onClick={() => onChange(tab)}
                style={{ fontFamily: "Inter, sans-serif" }}
                className={[
                    "h-9 px-4 rounded-full text-[14px] leading-5 transition-all duration-200 whitespace-nowrap",
                    active === tab
                        ? "bg-[#3C61DD] text-[#F7F7F7] font-semibold"
                        : "bg-[#F9F9FA] text-[#070707] font-normal border border-white",
                ].join(" ")}
            >
                {tab}
            </button>
        ))}
    </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export default function FeaturesSection2() {
    const [activeTab, setActiveTab] = useState<TabKey>("Founder");

    return (
        <section className="w-full bg-white py-[120px]">
            <div className="max-w-[1128px] mx-auto px-6 flex flex-col items-center gap-[60px]">

                {/* Section heading */}
                <div className="flex flex-col items-center gap-4 text-center max-w-[730px]">
                    <h2
                        className="font-normal text-[52px] leading-[60px] tracking-[-0.02em] text-[#070707]"
                        style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
                    >
                        You&apos;ve got the basics, now create something{" "}
                        <em>awesome!</em>
                    </h2>
                    <p
                        className="font-normal text-[16px] leading-[24px] text-[#3E3E3E] max-w-[486px]"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        Whether looking for a job or talent, our service ensures a seamless
                        experience for all.
                    </p>
                </div>

                {/* Toggle */}
                <TabToggle active={activeTab} onChange={setActiveTab} />

                {/* Card grid */}
                <div className="w-full flex flex-col gap-4">

                    {/* Row 1 — Founder | Submit Ideas */}
                    <div className="flex flex-col lg:flex-row gap-4 w-full">
                        <FounderCard />
                        <SubmitIdeasCard />
                    </div>

                    {/* Row 2 — Get Investors | Grow Together */}
                    <div className="flex flex-col lg:flex-row gap-4 w-full">
                        <GetInvestorsCard />
                        <GrowTogetherCard />
                    </div>

                </div>
            </div>
        </section>
    );
}

/*
 * ─── ASSET SETUP ─────────────────────────────────────────────────────────────
 *
 * Place all four files in your Next.js public folder:
 *
 *   public/
 *   └── assets/
 *       ├── user_profile_card.svg   (456×367)  Card 1 – Founder
 *       ├── idea_card.svg           (640×425)  Card 2 – Submit Ideas
 *       ├── investorList_card.svg   (460×345)  Card 3 – Get Investors
 *       └── task.jpg                           Card 4 – Business Profit
 *
 * Add Google Fonts to your layout / _app:
 *   Playfair Display (italic), Inter, Inter Tight
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */
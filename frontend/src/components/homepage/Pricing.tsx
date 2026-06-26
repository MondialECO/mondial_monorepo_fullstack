'use client'

import { useState } from "react";
import { Check, X } from "lucide-react";
import Link from "next/link";
import { ImageWithFallback } from "@/components/shared/ImageWithFallback";

/* ================= DATA ================= */

const FEATURES = [
    'Business Card "Idea → Project"',
    "Matching team & service providers",
    "Access to opportunities & investors",
    "Real-time data (5 exchanges)",
    "Real-time data (5 exchanges)",
];

interface Plan {
    id: string;
    name: string;
    description: string;
    prices: Record<string, number>;
    savings?: string;
    savingsColor?: string;
    edition: string;
    tabs: string[];
    defaultTab: string;
    features: boolean[];
    featured?: boolean;
    avatar: string;
    avatarBg?: string;
}

const PLANS: Plan[] = [
    {
        id: "creator",
        name: "Creator",
        description:
            "For traders who need reliable, real-time insights to stay ahead of market moves.",
        prices: { Free: 0, Monthly: 30, Yearly: 25 },
        savings: "20% Save",
        savingsColor: "#FF5F5F",
        edition: "Monthly (Limited Edition)",
        tabs: ["Free", "Monthly", "Yearly"],
        defaultTab: "Free",
        features: [true, true, false, false, false],
        avatar: "/images/profile.png",
        avatarBg: "#EED0E9",
    },
    {
        id: "investor",
        name: "Investor",
        description:
            "For traders who need reliable, real-time insights to stay ahead of market moves.",
        prices: { Free: 0, Monthly: 50, Yearly: 42 },
        savings: "20% Save",
        savingsColor: "#FF5F5F",
        edition: "Full Edition",
        tabs: ["Free", "Monthly", "Yearly"],
        defaultTab: "Monthly",
        features: [true, true, true, true, true],
        avatar: "/images/profile.png",
        avatarBg: "#91E7E1",
    },
    {
        id: "entrepreneur",
        name: "Entrepreneur",
        description:
            "For traders who need reliable, real-time insights to stay ahead of market moves.",
        prices: { Monthly: 140, Yearly: 126 },
        savings: "10% Save",
        savingsColor: "#B232F1",
        edition: "Full Edition",
        tabs: ["Monthly", "Yearly"],
        defaultTab: "Monthly",
        features: [true, true, true, true, true],
        featured: true,
        avatar: "/images/profile.png",
        avatarBg: "#D7DD9D",
    },
    {
        id: "service_provider",
        name: "Service Provider",
        description:
            "For traders who need reliable, real-time insights to stay ahead of market moves.",
        prices: { Free: 0 },
        edition: "Full Edition",
        tabs: ["Free"],
        defaultTab: "Free",
        features: [true, true, true, true, true],
        avatar: "/images/profile.png",
        avatarBg: "#C4DCE7",
    },
];

/* ================= CARD ================= */

function PricingCard({ plan }: { plan: Plan }) {
    const [activeTab, setActiveTab] = useState(plan.defaultTab);
    const price = plan.prices[activeTab] ?? 0;

    return (
        <div
            className={`bg-[#F9F9FA] rounded-3xl px-5 py-6 flex flex-col border-2 border-white w-full sm:w-78 ${plan.featured ? "border-[#3c61dd]" : ""
                }`}
            style={{
                boxShadow: "-2px -1px 17px rgba(0, 0, 0, 0.02), 1px 2px 3px rgba(0, 0, 0, 0.04)",
                minHeight: "624px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "48px",
            }}
        >
            {/* CONTENT TOP */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: "32px",
                    width: "275px",
                }}
            >
                {/* PLAN DETAILS */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
                    {/* PLAN HEADER */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                        <div className="flex items-center gap-2">
                            <div
                                style={{ backgroundColor: plan.avatarBg }}
                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                            >
                                <ImageWithFallback
                                    src={plan.avatar}
                                    alt={plan.name}
                                    className="w-8 h-8 rounded-full object-cover"
                                />
                            </div>
                            <h3
                                className="text-[#070707] text-[24px] font-semibold leading-8"
                                style={{ fontFamily: "'Inter Tight', sans-serif" }}
                            >
                                {plan.name}
                            </h3>
                        </div>
                        <p className="text-[#3E3E3E] text-[14px] font-normal leading-5 w-full">
                            {plan.description}
                        </p>
                    </div>

                    {/* FRAME 66 - Price Details Section */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            width: "100%",
                            paddingBottom: "32px",
                            borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                        }}
                    >
                        {/* Price Details */}
                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <span
                                className="text-[#070707] font-semibold text-[48px] leading-13"
                                style={{ fontFamily: "'Inter', sans-serif" }}
                            >
                                ${price}
                            </span>
                            {plan.savings && (
                                <span
                                    className="text-[14px] font-medium"
                                    style={{
                                        color: plan.savingsColor,
                                        background:
                                            "linear-gradient(90deg, #FF5F5F 0%, #B232F1 46.63%, #FF5F5F 100%)",
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                    }}
                                >
                                    {plan.savings}
                                </span>
                            )}
                        </div>

                        {/* FRAME 69 - Additional Info */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                            <p className="text-[#070707] text-[14px] font-normal leading-5">
                                {plan.edition}
                            </p>

                            {/* Toggle Switch */}
                            <div
                                style={{
                                    display: "flex",
                                    gap: "4px",
                                    alignItems: "center",
                                    filter: "drop-shadow(0px 0px 44px rgba(0, 0, 0, 0.06))",
                                    borderRadius: "52px",
                                    width: "fit-content",
                                }}
                            >
                                {plan.tabs.map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 rounded-full text-[14px] font-${activeTab === tab ? "semibold" : "normal"
                                            } transition-all`}
                                        style={{
                                            background:
                                                activeTab === tab ? "#3C61DD" : "#F9F9FA",
                                            color: activeTab === tab ? "#F7F7F7" : "#070707",
                                            border: activeTab === tab ? "none" : "1px solid #FFFFFF",
                                            fontFamily: "'Inter', sans-serif",
                                        }}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* FEATURES LIST */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                    <div style={{ height: "1px", background: "rgba(0, 0, 0, 0.06)" }} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {FEATURES.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3.5">
                                {plan.features[i] ? (
                                    <div
                                        className="w-4 h-4 rounded-full bg-[#099A48] flex items-center justify-center shrink-0"
                                        style={{ width: "16px", height: "16px" }}
                                    >
                                        <Check size={10} color="white" strokeWidth={3} />
                                    </div>
                                ) : (
                                    <div
                                        className="w-4 h-4 rounded-full border border-[#606060] flex items-center justify-center shrink-0"
                                        style={{ width: "16px", height: "16px" }}
                                    >
                                        <X size={9} color="#606060" strokeWidth={2.5} />
                                    </div>
                                )}
                                <span
                                    className={`text-[14px] font-normal leading-5 ${plan.features[i] ? "text-[#070707]" : "text-[#606060]"
                                        }`}
                                >
                                    {feature}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* BUTTON */}
            <button
                className={`w-full py-3 rounded-full text-[16px] font-medium transition-all`}
                style={{
                    background: plan.featured ? "#3C61DD" : "#FFFFFF",
                    color: plan.featured ? "#F7F7F7" : "#070707",
                    border: plan.featured ? "none" : "1px solid rgba(0, 0, 0, 0.08)",
                    boxShadow: "0px 2px 40px rgba(0, 0, 0, 0.02)",
                    fontFamily: "'Inter', sans-serif",
                }}
            >
                Get Started
            </button>
        </div>
    );
}

/* ================= PAGE ================= */

export default function PricingPage() {
    return (
        <div style={{ background: "#EDEDED", minHeight: "100vh" }}>
            {/* NAV */}
            <nav className="px-6 py-4 flex gap-6 border-b border-[#e0e0e0]">
                <Link href="/" className="text-[#3c61dd] text-sm hover:underline">
                    ← Dashboard
                </Link>
                <Link href="/faq" className="text-[#3E3E3E] text-sm">
                    FAQ
                </Link>
            </nav>

            <div style={{ padding: "120px 24px" }}>
                <div style={{ maxWidth: "1320px", margin: "0 auto" }}>
                    {/* HEADER */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "60px",
                            maxWidth: "734px",
                            margin: "0 auto 60px",
                        }}
                    >
                        <h2
                            className="text-[#070707] text-center italic"
                            style={{
                                fontFamily: "'PP Editorial Old', serif",
                                fontSize: "52px",
                                lineHeight: "60px",
                                fontWeight: 400,
                                fontStyle: "italic",
                            }}
                        >
                            Energize Your Trading Approach
                            <br />
                            with a <em>Solid Strategy</em>
                        </h2>

                        <p
                            className="text-[#3E3E3E] text-center"
                            style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: "16px",
                                lineHeight: "24px",
                                fontWeight: 400,
                                maxWidth: "562px",
                            }}
                        >
                            Mondial provides real-time tracking and analytics designed for{" "}
                            <span style={{ fontWeight: "600" }}>founders, investors,</span> and{" "}
                            <span style={{ fontWeight: "600" }}>entrepreneurs</span> who value speed and
                            precision.
                        </p>
                    </div>

                    {/* CARDS CONTAINER */}
                    <div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full"
                        style={{
                            filter: "drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.04))",
                            margin: "0 auto",
                        }}
                    >
                        {PLANS.map((plan) => (
                            <PricingCard key={plan.id} plan={plan} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
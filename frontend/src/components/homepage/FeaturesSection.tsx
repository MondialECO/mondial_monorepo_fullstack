"use client";

import { useState } from "react";

/* ================= TYPES ================= */
type TabKey = "Founder" | "Investor" | "Entrepreneur" | "Service Provider";

/* ================= DATA ================= */
const tabs: TabKey[] = [
    "Founder",
    "Investor",
    "Entrepreneur",
    "Service Provider",
];

/* ================= MAIN ================= */
export default function FeaturesSection() {
    const [activeTab, setActiveTab] = useState<TabKey>("Founder");

    return (
        <section className="w-full bg-white py-[120px]">
            <div className="max-w-[1128px] mx-auto px-4 flex flex-col items-center gap-[60px]">

                <Header />
                <Toggle activeTab={activeTab} setActiveTab={setActiveTab} />

                <div className="w-full flex flex-col gap-4">
                    <RowOne />
                    <RowTwo />
                </div>

            </div>
        </section>
    );
}

/* ================= HEADER ================= */
const Header = () => (
    <div className="flex flex-col items-center gap-4 text-center max-w-[730px]">
        <h2 className="font-playfair italic font-normal text-[36px] md:text-[52px] leading-[44px] md:leading-[60px] tracking-[-0.02em] text-[#070707]">
            You’ve got the basics, now create something <em>awesome!</em>
        </h2>

        <p className="text-[16px] leading-[24px] text-[#3E3E3E] max-w-[486px]">
            Whether looking for a job or talent, our service ensures a seamless experience for all.
        </p>
    </div>
);

/* ================= TOGGLE ================= */
const Toggle = ({
    activeTab,
    setActiveTab,
}: {
    activeTab: TabKey;
    setActiveTab: (tab: TabKey) => void;
}) => (
    <div className="flex items-center p-2 gap-1 bg-[#EDEDED] border border-white shadow-[0_0_44px_rgba(0,0,0,0.06)] rounded-[52px]">
        {tabs.map((tab) => (
            <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`h-[36px] px-4 rounded-full text-[14px] transition-all
        ${activeTab === tab
                        ? "bg-[#3C61DD] text-white font-semibold"
                        : "bg-[#F9F9FA] border border-white text-[#070707]"
                    }`}
            >
                {tab}
            </button>
        ))}
    </div>
);

/* ================= ROW 1 ================= */
const RowOne = () => (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
        <FounderCard />
        <IdeaCard />
    </div>
);

/* ================= ROW 2 ================= */
const RowTwo = () => (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
        <InvestorCard />
        <GrowCard />
    </div>
);

/* ================= BASE CARD ================= */
const BaseCard = ({ children, className = "" }: any) => (
    <div
        className={`bg-[#F9F9FA] border border-white rounded-[20px] shadow-[ -2px_-1px_17px_rgba(0,0,0,0.02),1px_2px_3px_rgba(0,0,0,0.04)] ${className}`}
    >
        {children}
    </div>
);

/* ================= FOUNDER CARD ================= */
const FounderCard = () => (
    <BaseCard className="relative w-full lg:w-[456px] h-[520px] overflow-hidden">

        {/* Header */}
        <div className="absolute left-12 top-12">
            <h3 className="text-[28px] leading-[32px] font-medium font-[Inter_Tight] text-[#070707]">
                Become a founder
            </h3>
            <p className="text-[18px] text-[#5E5E5E] mt-1">
                Convert followers to bookings.
            </p>
        </div>

        {/* Rotated Card */}
        <div className="absolute left-[40px] top-[160px] w-[248px] h-[460px] rotate-[8deg] bg-[#F9F9FA] border-2 border-white rounded-[12px] shadow-[0px_4px_38px_rgba(0,0,0,0.06)] flex flex-col items-center pt-10">

            <div className="w-[80px] h-[80px] rounded-full bg-gradient-to-br from-pink-400 to-red-400 border-2 border-white flex items-center justify-center text-white text-xl">
                👤
            </div>

            <p className="mt-4 text-[18px] font-semibold italic text-[#070707]">
                Mathen Jefer
            </p>

            <div className="flex items-center gap-2 text-[12px] text-[#5E5E5E] mt-1">
                <span>Founder</span>
                <span className="w-[1px] h-[10px] bg-black/10"></span>
                <span>California, USA</span>
            </div>

            <div className="mt-2 px-3 py-[2px] rounded-full bg-[#F3F5FB] text-[12px] text-[#3C61DD] border border-black/5">
                Mondial 90%
            </div>

            <p className="mt-3 text-[11px] text-[#3E3E3E] text-center px-4">
                Challenges are tough, but each problem offers growth.
            </p>
        </div>
    </BaseCard>
);

/* ================= IDEA CARD ================= */
const IdeaCard = () => (
    <BaseCard className="relative flex-1 h-[520px]">

        <div className="absolute left-12 top-12">
            <h3 className="text-[28px] font-medium">Submit ideas</h3>
            <p className="text-[18px] text-[#5E5E5E]">
                Convert investors to commitments!
            </p>
        </div>

        <div className="absolute bottom-6 left-6 right-6 bg-[#F9F9FA] border-2 border-white rounded-[16px] shadow-[0_0_76px_rgba(9,13,27,0.12)] p-6">

            <div className="flex justify-between mb-4">
                <h4 className="text-[16px] font-medium">
                    Smart Farming Solutions
                </h4>

                <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-gray-100 rounded">Approved</span>
                    <span className="px-2 py-1 bg-gray-100 rounded">View</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-gray-400">Market Size</p>
                    <p className="font-semibold">50M by 2030</p>
                </div>
                <div>
                    <p className="text-gray-400">Equity</p>
                    <p>20%</p>
                </div>
            </div>

        </div>
    </BaseCard>
);

/* ================= INVESTOR CARD ================= */
const InvestorCard = () => (
    <BaseCard className="flex-1 h-[520px] p-12 flex items-end">
        <div>
            <h3 className="text-[28px] font-medium">Get Investors</h3>
            <p className="text-[#5E5E5E]">
                Convert investors to commitments!
            </p>
        </div>
    </BaseCard>
);

/* ================= GROW CARD ================= */
const GrowCard = () => (
    <div className="w-full lg:w-[456px] h-[520px] rounded-[20px] bg-gradient-to-b from-[#F3F0F9] to-[#F7FCFD] border border-white shadow-[ -2px_-1px_17px_rgba(0,0,0,0.02),1px_2px_3px_rgba(0,0,0,0.04)] flex items-end p-12">
        <div>
            <h3 className="text-[28px] font-medium">Grow Together</h3>
            <p className="text-[#5E5E5E]">
                Convert followers into bookings by sharing ideas!
            </p>
        </div>
    </div>
);
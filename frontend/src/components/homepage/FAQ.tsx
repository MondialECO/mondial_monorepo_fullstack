'use client'
import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FAQItem {
    question: string;
    answer?: string;
    defaultOpen?: boolean;
}

const leftFAQs: FAQItem[] = [
    { question: "What's the average duration for completing a landing page?" },
    { question: "What's the typical timeframe for finishing a landing page?" },
    {
        question: "How much time is usually needed to create a landing page?",
        answer:
            "We offer both! We can design and develop your landing page (usually in Webflow or Framer), or deliver just the design if you already have a developer or platform in mind.",
        defaultOpen: true,
    },
    { question: "How long does it generally take to build a landing page?" },
];

const rightFAQs: FAQItem[] = [
    {
        question: "How much time does it take to put together a landing page?",
        answer:
            "We offer both! We can design and develop your landing page (usually in Webflow or Framer), or deliver just the design if you already have a developer or platform in mind.",
        defaultOpen: true,
    },
    { question: "What's the expected time to finish a landing page?" },
    { question: "How long is the process to complete a landing page?" },
    { question: "What's the usual timeframe for a landing page completion?" },
];

function FAQCard({ item }: { item: FAQItem }) {
    const [open, setOpen] = useState(item.defaultOpen ?? false);

    return (
        <div
            data-testid="faq-card"
            className="bg-white rounded-2xl border border-[#e8e8e8] w-full transition-shadow"
            style={{
                boxShadow: open
                    ? "-2px -1px 17px 0px rgba(0,0,0,0.02), 1px 2px 3px 0px rgba(0,0,0,0.04)"
                    : "none",
            }}
        >
            <button
                onClick={() => setOpen((o) => !o)}
                data-testid="faq-toggle"
                className="flex gap-[10px] items-start justify-between w-full p-5 sm:p-6 text-left"
            >
                <p
                    className="flex-1 text-[#070707] text-[16px] sm:text-[18px] leading-6 sm:leading-7 font-medium"
                    style={{ fontFamily: "'Inter Tight', 'Inter', sans-serif" }}
                >
                    {item.question}
                </p>

                <div className="shrink-0 w-6 h-6 flex items-center justify-center text-[#070707] mt-1">
                    {open ? <Minus size={18} strokeWidth={2} /> : <Plus size={18} strokeWidth={2} />}
                </div>
            </button>

            {open && item.answer && (
                <p className="px-5 sm:px-6 pb-5 sm:pb-6 text-[#8a8b8f] text-[15px] sm:text-[16px] leading-6 -mt-2">
                    {item.answer}
                </p>
            )}
        </div>
    );
}

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-[#ededed]">

            <div className="py-[60px] sm:py-[80px] px-5 sm:px-6">
                <div className="max-w-[1320px] mx-auto flex flex-col gap-[50px] sm:gap-[60px]">

                    {/* Header */}
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-[77px] lg:items-center">

                        <div className="flex-1 min-w-0">
                            <h1
                                className="text-[32px] sm:text-[40px] lg:text-[48px] leading-[40px] sm:leading-[48px] lg:leading-[56px] text-[#8a8b8f]"
                                style={{ fontFamily: "'Instrument Sans', sans-serif", fontWeight: 400 }}
                            >
                                {"Your Complete Guide to Mondial's "}
                                <em
                                    className="not-italic font-semibold text-[#070707]"
                                    style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}
                                >
                                    Faq&apos;s
                                </em>
                            </h1>
                        </div>

                        <p className="text-[#8a8b8f] text-[15px] sm:text-[16px] leading-6 max-w-[524px]">
                            Discover how our platform operates, what each subscription offers, and how Mondial
                            ensures the security of your data and portfolio.
                        </p>

                    </div>

                    {/* FAQ Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">

                        <div className="flex flex-col gap-5">
                            {leftFAQs.map((item, i) => (
                                <FAQCard key={i} item={item} />
                            ))}
                        </div>

                        <div className="flex flex-col gap-5">
                            {rightFAQs.map((item, i) => (
                                <FAQCard key={i} item={item} />
                            ))}
                        </div>

                    </div>

                </div>
            </div>

        </div>
    );
}